import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets_frontend/assets';
import { AuthContext } from '../Context/AuthContext.jsx';

const MyPharmacistAppointments = () => {
  const { currentUser } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const defaultPharmacistImage = assets.profile_pic;
  const [filter, setFilter] = useState('all');
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://appointment-backend-fwy2.onrender.com/api';
  
  useEffect(() => {
    fetchAppointments();
  }, []);
  
  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to view appointments.');
        navigate('/login');
        return;
      }
      const response = await axios.get(`${API_URL}/pharmacist-appointments/patient`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
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
      } else {
        setError('No appointments found.');
      }
    } catch (err) {
      if (err.response) {
        // Server responded with a status outside 2xx
        setError(err.response.data?.message || `Failed to load appointments: ${err.response.status}`);
        if (err.response.status === 401) navigate('/login');
      } else if (err.request) {
        setError('No response from server. Please check your network connection.');
      } else {
        setError('Error: ' + err.message);
      }
      console.error('Error fetching pharmacist appointments:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to cancel appointments.');
        navigate('/login');
        return;
      }
      await axios.put(
        `${API_URL}/pharmacist-appointments/${appointmentId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
      fetchAppointments();
    } catch (err) {
      if (err.response) {
        alert(err.response.data?.message || `Failed to cancel appointment: ${err.response.status}`);
      } else if (err.request) {
        alert('No response from server. Please check your network connection.');
      } else {
        alert('Error: ' + err.message);
      }
      console.error('Error cancelling appointment:', err);
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
      case 'upcoming':
        return appointments.filter(apt => 
          new Date(apt.appointmentDate) > now && 
          apt.status !== 'cancelled' && 
          apt.status !== 'completed'
        );
      case 'past':
        return appointments.filter(apt => 
          new Date(apt.appointmentDate) <= now || 
          apt.status === 'completed'
        );
      case 'cancelled':
        return appointments.filter(apt => apt.status === 'cancelled');
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Pharmacist Appointments</h1>
        <p className="text-gray-600">View and manage your pharmacist consultation appointments</p>
      </div>
      
      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Appointments' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'past', label: 'Past' },
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
          <p className="text-gray-600 mb-4">No appointments found</p>
          <button
            onClick={() => navigate('/pharmacists')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Book an Appointment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div 
              key={appointment._id || appointment.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
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
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-700 mb-3">
                    <p><strong>Date:</strong> {formatDate(appointment.appointmentDate)}</p>
                    <p><strong>Method:</strong> {appointment.method || 'In Person'}</p>
                    <p><strong>Purpose:</strong> {appointment.purpose || 'Medication Consultation'}</p>
                    {appointment.fees && <p><strong>Fee:</strong> ${appointment.fees}</p>}
                  </div>
                  
                  {appointment.notes && (
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>Notes:</strong> {appointment.notes}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    {appointment.status === 'pending' && (
                      <button
                        onClick={() => handleCancelAppointment(appointment._id || appointment.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Cancel Appointment
                      </button>
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

export default MyPharmacistAppointments;
