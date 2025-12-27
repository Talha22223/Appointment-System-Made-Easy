import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets_frontend/assets';
import { AuthContext } from '../Context/AuthContext.jsx';

const AdminPharmacistAppointments = () => {
  const { currentUser, isAdmin } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const defaultPharmacistImage = assets.profile_pic;
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState({});
  
  const API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'https://appointment-backend-fwy2.onrender.com/api';
      
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchAppointments();
  }, [isAdmin]);
  
  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get(`${API_URL}/pharmacist-appointments/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Admin pharmacist appointments data:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        const sanitizedAppointments = response.data.map(appointment => {
          let pharmacistData;
          
          if (appointment.pharmacist && typeof appointment.pharmacist === 'object' && appointment.pharmacist.name) {
            pharmacistData = {
              ...appointment.pharmacist,
              name: appointment.pharmacist.name || 'Unknown Pharmacist',
              speciality: appointment.pharmacist.speciality || 'General Pharmacy',
              image: appointment.pharmacist.image || defaultPharmacistImage
            };
          } else if (appointment.pharmacistDetails) {
            pharmacistData = {
              name: appointment.pharmacistDetails.name || 'Unknown Pharmacist',
              speciality: appointment.pharmacistDetails.speciality || 'General Pharmacy',
              image: appointment.pharmacistDetails.image || defaultPharmacistImage
            };
          } else {
            pharmacistData = {
              name: 'Unknown Pharmacist',
              speciality: 'General Pharmacy',
              image: defaultPharmacistImage
            };
          }
          
          return {
            ...appointment,
            pharmacist: pharmacistData,
            status: appointment.status || 'pending',
            appointmentDate: appointment.appointmentDate || new Date().toISOString()
          };
        });
        
        setAppointments(sanitizedAppointments);
      }
    } catch (err) {
      console.error('Error fetching pharmacist appointments:', err);
      if (err.response?.status === 401) {
        setError('Please log in to view appointments');
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
        navigate('/');
      } else {
        setError('Failed to load appointments. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateStatus = async (appointmentId, newStatus) => {
    setUpdating(prev => ({ ...prev, [appointmentId]: true }));
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/pharmacist-appointments/${appointmentId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      setAppointments(prev => prev.map(apt => 
        (apt._id || apt.id) === appointmentId 
          ? { ...apt, status: newStatus } 
          : apt
      ));
      
      // Show success message (optional)
      alert(`Appointment ${newStatus} successfully!`);
    } catch (err) {
      console.error('Error updating appointment status:', err);
      alert('Failed to update appointment status. Please try again.');
    } finally {
      setUpdating(prev => ({ ...prev, [appointmentId]: false }));
    }
  };
  
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getFilteredAppointments = () => {
    const now = new Date();
    
    switch (filter) {
      case 'pending':
        return appointments.filter(apt => apt.status === 'pending');
      case 'confirmed':
        return appointments.filter(apt => apt.status === 'confirmed');
      case 'cancelled':
        return appointments.filter(apt => apt.status === 'cancelled');
      case 'completed':
        return appointments.filter(apt => apt.status === 'completed');
      default:
        return appointments;
    }
  };
  
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={fetchAppointments}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const filteredAppointments = getFilteredAppointments();
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pharmacist Appointments Management</h1>
        <p className="text-gray-600">View and manage all pharmacist appointments</p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total</p>
          <p className="text-2xl font-bold">{appointments.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {appointments.filter(a => a.status === 'pending').length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">
            {appointments.filter(a => a.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Completed</p>
          <p className="text-2xl font-bold text-blue-600">
            {appointments.filter(a => a.status === 'completed').length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">
            {appointments.filter(a => a.status === 'cancelled').length}
          </p>
        </div>
      </div>
      
      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Appointments' },
          { key: 'pending', label: 'Pending' },
          { key: 'confirmed', label: 'Confirmed' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-md ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      
      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div 
              key={appointment._id || appointment.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="md:flex">
                <div className="md:w-32 h-32 flex-shrink-0">
                  <img
                    src={appointment.pharmacist?.image || defaultPharmacistImage}
                    alt={appointment.pharmacist?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = defaultPharmacistImage; }}
                  />
                </div>
                
                <div className="p-4 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {appointment.pharmacist?.name || 'Unknown Pharmacist'}
                      </h3>
                      <p className="text-gray-600">{appointment.pharmacist?.speciality}</p>
                      <p className="text-sm text-gray-500">
                        Patient: {appointment.user?.name || 'Unknown Patient'} ({appointment.user?.email || 'N/A'})
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-700 mb-3">
                    <p><strong>Date:</strong> {formatDate(appointment.appointmentDate)}</p>
                    <p><strong>Method:</strong> {appointment.method || 'In Person'}</p>
                    <p><strong>Purpose:</strong> {appointment.purpose || 'Medication Consultation'}</p>
                    <p><strong>Booked:</strong> {formatDate(appointment.createdAt)}</p>
                  </div>
                  
                  {appointment.notes && (
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>Notes:</strong> {appointment.notes}
                    </p>
                  )}
                  
                  {/* Admin Actions */}
                  <div className="flex flex-wrap gap-2">
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(appointment._id || appointment.id, 'confirmed')}
                          disabled={updating[appointment._id || appointment.id]}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                        >
                          {updating[appointment._id || appointment.id] ? 'Updating...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(appointment._id || appointment.id, 'cancelled')}
                          disabled={updating[appointment._id || appointment.id]}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                        >
                          {updating[appointment._id || appointment.id] ? 'Updating...' : 'Cancel'}
                        </button>
                      </>
                    )}
                    {appointment.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(appointment._id || appointment.id, 'completed')}
                          disabled={updating[appointment._id || appointment.id]}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {updating[appointment._id || appointment.id] ? 'Updating...' : 'Mark Completed'}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(appointment._id || appointment.id, 'cancelled')}
                          disabled={updating[appointment._id || appointment.id]}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                        >
                          {updating[appointment._id || appointment.id] ? 'Updating...' : 'Cancel'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPharmacistAppointments;
