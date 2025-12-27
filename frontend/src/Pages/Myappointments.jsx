import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets_frontend/assets';
import { AuthContext } from '../Context/AuthContext.jsx';
const API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'https://appointment-backend-fwy2.onrender.com/api';
const MyAppointments = ({ adminMode = false }) => {
  const { currentUser, isAdmin } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Use a proper doctor image fallback
  const defaultDoctorImage = assets.profile_pic;
  
  // Filter states
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled
  
  // Use the doctors context if available or create a local cache
  const [doctorCache, setDoctorCache] = useState({});
  
  // Fetch doctors to populate the cache
  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_URL}/doctors`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      if (response.data && Array.isArray(response.data)) {
        const cache = {};
        response.data.forEach(doctor => {
          if (doctor._id) {
            cache[doctor._id] = {
              name: doctor.name,
              speciality: doctor.speciality,
              image: doctor.image || assets.profile_pic
            };
          }
        });
        setDoctorCache(cache);
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.message || `Failed to load doctors: ${err.response.status}`);
      } else if (err.request) {
        setError('No response from server. Please check your network connection.');
      } else {
        setError('Error: ' + err.message);
      }
      console.error('Error fetching doctors:', err);
    }
  };
  
  // Fetch appointments on component mount
  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, []);
  
  // Helper function to safely access nested properties
  const safeAccess = (obj, path, fallback = '') => {
    try {
      const result = path.split('.').reduce((o, key) => (o || {})[key], obj);
      return result !== undefined && result !== null ? result : fallback;
    } catch (error) {
      return fallback;
    }
  };
  
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
      let endpoint = `${API_URL}/appointments/patient`;
      if (adminMode) {
        endpoint = `${API_URL}/appointments/all`;
      }
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      if (response.data && Array.isArray(response.data)) {
        // Update doctor cache with any doctor data from appointments
        const newDoctorCache = {...doctorCache};
        response.data.forEach(appointment => {
          if (appointment.doctor && typeof appointment.doctor === 'object' && appointment.doctor._id) {
            const doctorId = appointment.doctor._id;
            if (!newDoctorCache[doctorId]) {
              newDoctorCache[doctorId] = {
                name: appointment.doctor.name || 'Unknown Doctor',
                speciality: appointment.doctor.speciality || 'Not specified',
                image: appointment.doctor.image || assets.profile_pic
              };
            }
          }
        });
        if (Object.keys(newDoctorCache).length > Object.keys(doctorCache).length) {
          setDoctorCache(newDoctorCache);
        }
        // Process appointments with doctor data
        const sanitizedAppointments = response.data.map(appointment => {
          // Prepare doctor data
          let doctorData;
          
          // If doctor is already populated as an object
          if (appointment.doctor && typeof appointment.doctor === 'object' && appointment.doctor.name) {
            doctorData = {
              ...appointment.doctor,
              name: appointment.doctor.name || 'Unknown Doctor',
              speciality: appointment.doctor.speciality || 'Not specified',
              image: appointment.doctor.image || assets.profile_pic
            };
          } 
          // If we have doctor info in our cache
          else if (appointment.doctor && newDoctorCache[appointment.doctor]) {
            doctorData = newDoctorCache[appointment.doctor];
          }
          // Fallback for missing doctor data
          else {
            doctorData = {
              name: 'Unknown Doctor',
              speciality: 'Not specified',
              image: assets.profile_pic
            };
          }
          
          return {
            ...appointment,
            doctor: doctorData,
            status: appointment.status || 'pending',
            appointmentDate: appointment.appointmentDate || new Date().toISOString(),
            purpose: appointment.purpose || 'General Checkup',
            method: appointment.method || 'In Person'
          };
        });
        
        setAppointments(sanitizedAppointments);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel appointment function
  const cancelAppointment = async (appointmentId) => {
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
      await axios.put(`${API_URL}/appointments/${appointmentId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
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

  // Accept appointment function
  const acceptAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to accept appointments.');
        navigate('/login');
        return;
      }
      await axios.patch(`${API_URL}/appointments/${appointmentId}/status`, { status: 'confirmed' }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      fetchAppointments();
    } catch (err) {
      if (err.response) {
        alert(err.response.data?.message || `Failed to accept appointment: ${err.response.status}`);
      } else if (err.request) {
        alert('No response from server. Please check your network connection.');
      } else {
        alert('Error: ' + err.message);
      }
      console.error('Error accepting appointment:', err);
    }
  };

  // Reject appointment function
  const rejectAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to reject this appointment?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to reject appointments.');
        navigate('/login');
        return;
      }
      await axios.patch(`${API_URL}/appointments/${appointmentId}/status`, { status: 'rejected' }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      fetchAppointments();
    } catch (err) {
      if (err.response) {
        alert(err.response.data?.message || `Failed to reject appointment: ${err.response.status}`);
      } else if (err.request) {
        alert('No response from server. Please check your network connection.');
      } else {
        alert('Error: ' + err.message);
      }
      console.error('Error rejecting appointment:', err);
    }
  };
  
  // Filter appointments based on selected filter
  const getFilteredAppointments = () => {
    if (!appointments || appointments.length === 0) {
      return [];
    }
    
    const today = new Date();
    
    switch (filter) {
      case 'upcoming':
        return appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentDate);
          return appointmentDate >= today && appointment.status !== 'cancelled';
        });
      case 'past':
        return appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentDate);
          return appointmentDate < today && appointment.status !== 'cancelled';
        });
      case 'cancelled':
        return appointments.filter(appointment => appointment.status === 'cancelled');
      case 'rejected':
        return appointments.filter(appointment => appointment.status === 'rejected');
      default:
        return appointments;
    }
  };
  
  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get appropriate status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Display loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-6">
          <h2 className="text-3xl font-bold">
            {isAdmin || adminMode ? (
              <><span className="text-black">MANAGE</span> <span className='text-blue-500'>APPOINTMENTS</span></>
            ) : (
              <><span className="text-black">MY</span> <span className='text-blue-500'>APPOINTMENTS</span></>
            )}
          </h2>
          <div className="h-1 w-48 bg-blue-500 mx-auto mt-2 mb-8"></div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center py-6">
        <h2 className="text-3xl font-bold">
          {isAdmin || adminMode ? (
            <><span className="text-black">MANAGE</span> <span className='text-blue-500'>APPOINTMENTS</span></>
          ) : (
            <><span className="text-black">MY</span> <span className='text-blue-500'>APPOINTMENTS</span></>
          )}
        </h2>
        <div className="h-1 w-48 bg-blue-500 mx-auto mt-2 mb-8"></div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          All Appointments
        </button>
        <button 
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-full text-sm ${filter === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setFilter('past')}
          className={`px-4 py-2 rounded-full text-sm ${filter === 'past' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Past
        </button>
        <button 
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-full text-sm ${filter === 'cancelled' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Cancelled
        </button>
        <button 
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-full text-sm ${filter === 'rejected' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Rejected
        </button>
      </div>
      
      {/* Appointments List */}
      {getFilteredAppointments().length > 0 ? (
        <div className="space-y-4">
          {getFilteredAppointments().map((appointment) => {
            // For debugging
            console.log(`Rendering appointment ${appointment._id}:`, {
              doctorName: appointment.doctor?.name,
              doctorImage: appointment.doctor?.image
            });
            
            return (
              <div key={appointment._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="md:flex">
                  <div className="md:flex-shrink-0">
                    <img 
                      className="h-48 w-full object-cover md:w-48" 
                      src={appointment.doctor?.image || defaultDoctorImage} 
                      alt={appointment.doctor?.name || 'Doctor'}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultDoctorImage;
                      }}
                    />
                  </div>
                  <div className="p-6 w-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xl font-semibold text-gray-900">
                          {/* Remove "Dr." prefix if it's already included in the name */}
                          {appointment.doctor?.name?.startsWith('Dr.') ? 
                            appointment.doctor.name : 
                            `Dr. ${appointment.doctor?.name || 'Unknown'}`}
                        </p>
                        <p className="text-gray-600">
                          {appointment.doctor?.speciality || 'Speciality not specified'}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                          {(appointment.status || 'pending').charAt(0).toUpperCase() + (appointment.status || 'pending').slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 text-sm">Date & Time</p>
                        <p className="font-medium">
                          {formatDate(appointment.appointmentDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Booking ID</p>
                        <p className="font-medium">{appointment._id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Purpose</p>
                        <p className="font-medium">{appointment.purpose || 'General Checkup'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Method</p>
                        <p className="font-medium">{appointment.method || 'In Person'}</p>
                      </div>
                      {/* Show patient info for admin */}
                      {(isAdmin || adminMode) && appointment.user && (
                        <>
                          <div>
                            <p className="text-gray-500 text-sm">Patient Name</p>
                            <p className="font-medium">{appointment.user.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm">Patient Email</p>
                            <p className="font-medium">{appointment.user.email || 'N/A'}</p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-6 flex flex-wrap gap-3">
                      {/* Role-based action buttons */}
                      {isAdmin || adminMode ? (
                        // Admin users can accept/reject pending appointments
                        appointment.status === 'pending' && new Date(appointment.appointmentDate) > new Date() && (
                          <>
                            <button 
                              onClick={() => acceptAppointment(appointment._id)}
                              className="px-4 py-2 text-green-600 border border-green-600 rounded-md hover:bg-green-50"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => rejectAppointment(appointment._id)}
                              className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                            >
                              Reject
                            </button>
                          </>
                        )
                      ) : (
                        // Regular users can only cancel their appointments
                        (appointment.status === 'pending' || appointment.status === 'confirmed') && new Date(appointment.appointmentDate) > new Date() && (
                          <button 
                            onClick={() => cancelAppointment(appointment._id)}
                            className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                          >
                            Cancel Appointment
                          </button>
                        )
                      )}
                      
                      <button 
                        onClick={() => navigate(`/appointment-details/${appointment._id}`)}
                        className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                      >
                        View Details
                      </button>
                      
                      {appointment.status === 'completed' && (
                        <button 
                          onClick={() => navigate(`/prescription/${appointment._id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          View Prescription
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No appointments found</h3>
          <p className="mt-2 text-gray-600">
            {filter === 'all' ? "You haven't booked any appointments yet." : `No ${filter} appointments found.`}
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/doctors')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Book an Appointment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


export default MyAppointments;
