import React, { useState, useEffect, useContext } from 'react';
import { assets } from '../assets/assets_frontend/assets';
import axios from 'axios';
import { AppContext } from '../Context/AppContext';

const Myprofile = ({ initialTab = 'profile' }) => {
    const [userData, setUserData] = useState({
        name: '',
        image: assets.profile_pic,
        email: '',
        phone: '',
        address:{
            line1: '',
            line2: '',
            city: '',
        },
        gender: 'Male',
        dob: '',
        role: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({...userData});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Admin state
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [doctors, setDoctors] = useState([]);
    const [labTechniques, setLabTechniques] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [appointmentFilter, setAppointmentFilter] = useState('all');
    const [pendingAppointments, setPendingAppointments] = useState([]);
    const [stats, setStats] = useState({
        totalAppointments: 0,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        totalDoctors: 0,
        totalPatients: 0
    });
    
    // Doctor form state
    const [showDoctorForm, setShowDoctorForm] = useState(false);
    const [doctorForm, setDoctorForm] = useState({
        name: '',
        email: '',
        password: '',
        speciality: '',
        degree: '',
        experience: '',
        fees: '',
        about: '',
        image: '',
        available: true
    });
    const [addingDoctor, setAddingDoctor] = useState(false);
    
    // Lab technique form state
    const [showLabTechniqueForm, setShowLabTechniqueForm] = useState(false);
    const [labTechniqueForm, setLabTechniqueForm] = useState({
        name: '',
        description: '',
        category: '',
        duration: '',
        price: '',
        image: '',
        requirements: '',
        preparation: '',
        available: true
    });
    const [addingLabTechnique, setAddingLabTechnique] = useState(false);
    
    // API base URL
    const API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'https://appointment-backend-fwy2.onrender.com/api';
    
    // Get refreshDoctors from context
    const { refreshDoctors } = useContext(AppContext);
    
    // Fetch user data on component mount
    useEffect(() => {
        fetchUserProfile();
    }, []);
    
    // Function to fetch user profile from backend
    const fetchUserProfile = async () => {
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }
            
            const response = await axios.get(`${API_URL}/auth/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (response.data) {
                const profile = response.data;
                
                // Update state with user data from backend
                const updatedUserData = {
                    name: profile.name || '',
                    image: profile.image || assets.profile_pic,
                    email: profile.email || '',
                    phone: profile.phone || '',
                    address: {
                        line1: profile.address?.line1 || '',
                        line2: profile.address?.line2 || '',
                        city: profile.address?.city || '',
                    },
                    gender: profile.gender || 'Male',
                    dob: profile.dob || '',
                    role: profile.role || 'user'
                };
                
                setUserData(updatedUserData);
                setFormData(updatedUserData);
                
                // Check if user is admin
                const isAdminUser = profile.role === 'admin';
                setIsAdmin(isAdminUser);
                
                // If admin, fetch additional data
                if (isAdminUser) {
                    fetchAdminData();
                }
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            
            // Handle unauthorized access
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return;
            }
            
            setError('Failed to load profile data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };
    
    // Fetch admin dashboard data
    const fetchAdminData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            // Fetch doctors - using correct endpoint
            const doctorsResponse = await axios.get(`${API_URL}/doctors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (doctorsResponse.data) {
                // Backend returns array directly, not nested in 'doctors' property
                const doctorsData = Array.isArray(doctorsResponse.data) ? doctorsResponse.data : doctorsResponse.data.doctors || [];
                setDoctors(doctorsData);
                setStats(prev => ({...prev, totalDoctors: doctorsData.length}));
            }
            
            // Fetch lab techniques - using correct endpoint
            const labTechniquesResponse = await axios.get(`${API_URL}/lab-techniques`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (labTechniquesResponse.data) {
                const labTechniquesData = Array.isArray(labTechniquesResponse.data) ? labTechniquesResponse.data : [];
                setLabTechniques(labTechniquesData);
            }
            
            // Fetch all appointments for admin - using correct endpoint
            const appointmentsResponse = await axios.get(`${API_URL}/appointments/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (appointmentsResponse.data) {
                const allAppointments = Array.isArray(appointmentsResponse.data) ? appointmentsResponse.data : [];
                setAppointments(allAppointments);
                setFilteredAppointments(allAppointments);
                
                // Filter pending appointments
                const pending = allAppointments.filter(app => app.status === 'pending');
                setPendingAppointments(pending);
                
                // Update stats
                setStats(prev => ({
                    ...prev,
                    totalAppointments: allAppointments.length,
                    pendingAppointments: pending.length,
                    confirmedAppointments: allAppointments.filter(app => app.status === 'confirmed').length,
                    completedAppointments: allAppointments.filter(app => app.status === 'completed').length
                }));
                
                // Calculate unique users from appointments
                const uniqueUsers = new Set(allAppointments.map(app => app.user?._id).filter(Boolean)).size;
                setStats(prev => ({...prev, totalPatients: uniqueUsers}));
            }
            
        } catch (error) {
            console.error('Error fetching admin data:', error);
            setError('Failed to fetch admin dashboard data');
        }
    };
    
    // Filter appointments based on status
    const filterAppointments = (status) => {
        setAppointmentFilter(status);
        if (status === 'all') {
            setFilteredAppointments(appointments);
        } else {
            setFilteredAppointments(appointments.filter(app => app.status === status));
        }
    };
    
    // Function to handle appointment status update
    const updateAppointmentStatus = async (appointmentId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            // Using the correct backend endpoint
            await axios.patch(`${API_URL}/appointments/${appointmentId}/status`, 
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            // Refresh data after update
            fetchAdminData();
            setSuccessMessage(`Appointment ${newStatus} successfully`);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
            
        } catch (error) {
            console.error('Error updating appointment status:', error);
            setError('Failed to update appointment status');
            
            // Clear error message after 3 seconds
            setTimeout(() => setError(''), 3000);
        }
    };
    
    // Handle doctor form input changes
    const handleDoctorFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setDoctorForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    
    // Function to add a new doctor
    const handleAddDoctor = async (e) => {
        e.preventDefault();
        setAddingDoctor(true);
        setError('');
        setSuccessMessage('');
        
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            // Using the correct backend endpoint for adding doctor
            const response = await axios.post(`${API_URL}/doctors`, 
                doctorForm,
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            if (response.data) {
                // Refresh doctors data in both admin panel and context
                fetchAdminData();
                if (refreshDoctors) {
                    refreshDoctors(); // Update the global context
                }
                
                setSuccessMessage('Doctor added successfully');
                setShowDoctorForm(false);
                
                // Reset form
                setDoctorForm({
                    name: '',
                    email: '',
                    password: '',
                    speciality: '',
                    degree: '',
                    experience: '',
                    fees: '',
                    about: '',
                    image: '',
                    available: true
                });
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(''), 3000);
            }
            
        } catch (error) {
            console.error('Error adding new doctor:', error);
            const errorMsg = error.response?.data?.message || 'Failed to add doctor';
            setError(errorMsg);
            
            // Clear error message after 3 seconds
            setTimeout(() => setError(''), 3000);
        } finally {
            setAddingDoctor(false);
        }
    };
    
    // Toggle doctor availability
    const toggleDoctorAvailability = async (doctorId, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            // Using the correct backend endpoint for updating doctor
            await axios.put(`${API_URL}/doctors/${doctorId}`, 
                { available: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            // Refresh doctors data
            fetchAdminData();
            setSuccessMessage(`Doctor status updated successfully`);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
            
        } catch (error) {
            console.error('Error updating doctor status:', error);
            setError('Failed to update doctor status');
            
            // Clear error message after 3 seconds
            setTimeout(() => setError(''), 3000);
        }
    };
    
    // Handle lab technique form input changes
    const handleLabTechniqueFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLabTechniqueForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    
    // Function to add a new lab technique
    const handleAddLabTechnique = async (e) => {
        e.preventDefault();
        setAddingLabTechnique(true);
        setError('');
        setSuccessMessage('');
        
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const response = await axios.post(`${API_URL}/lab-techniques`, 
                labTechniqueForm,
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            if (response.data) {
                fetchAdminData();
                setSuccessMessage('Lab technique added successfully');
                setShowLabTechniqueForm(false);
                
                // Reset form
                setLabTechniqueForm({
                    name: '',
                    description: '',
                    category: '',
                    duration: '',
                    price: '',
                    image: '',
                    requirements: '',
                    preparation: '',
                    available: true
                });
                
                setTimeout(() => setSuccessMessage(''), 3000);
            }
            
        } catch (error) {
            console.error('Error adding new lab technique:', error);
            const errorMsg = error.response?.data?.message || 'Failed to add lab technique';
            setError(errorMsg);
            setTimeout(() => setError(''), 3000);
        } finally {
            setAddingLabTechnique(false);
        }
    };
    
    // Toggle lab technique availability
    const toggleLabTechniqueAvailability = async (labTechniqueId, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            await axios.put(`${API_URL}/lab-techniques/${labTechniqueId}`, 
                { available: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            fetchAdminData();
            setSuccessMessage(`Lab technique status updated successfully`);
            setTimeout(() => setSuccessMessage(''), 3000);
            
        } catch (error) {
            console.error('Error updating lab technique status:', error);
            setError('Failed to update lab technique status');
            setTimeout(() => setError(''), 3000);
        }
    };
    
    // Delete lab technique
    const handleDeleteLabTechnique = async (labTechniqueId) => {
        if (!window.confirm('Are you sure you want to delete this lab technique?')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            await axios.delete(`${API_URL}/lab-techniques/${labTechniqueId}`, 
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            fetchAdminData();
            setSuccessMessage('Lab technique deleted successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
            
        } catch (error) {
            console.error('Error deleting lab technique:', error);
            setError('Failed to delete lab technique');
            setTimeout(() => setError(''), 3000);
        }
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData({
                ...formData,
                [parent]: {
                    ...formData[parent],
                    [child]: value
                }
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');
        setSuccessMessage('');
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }
            
            // Fixed the API endpoint - removed the extra 'user' in the path
            const response = await axios.put(
                `${API_URL}/profile`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            if (response.data) {
                setUserData(formData);
                setSuccessMessage('Profile updated successfully!');
                setIsEditing(false);
                
                // Update local storage user data if needed
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({
                    ...user,
                    name: formData.name,
                    email: formData.email
                }));
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            
            // Display more specific error message based on the response
            const errorMsg = err.response?.data?.message || 'Failed to update profile. Please try again.';
            setError(errorMsg);
            
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return;
            }
        } finally {
            setUpdating(false);
        }
    };
    
    const handleCancel = () => {
        setFormData({...userData});
        setIsEditing(false);
    };
    
    // Show loading state while fetching profile data
    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4 max-w-5xl">
                <div className="text-center py-6">
                    <h2 className="text-3xl font-bold">
                        <span className="text-black">MY</span> <span className='text-blue-500'>PROFILE</span>
                    </h2>
                    <div className="h-1 w-48 bg-blue-500 mx-auto mt-2 mb-8"></div>
                </div>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                </div>
            </div>
        );
    }
    
    // Admin Dashboard View
    if (isAdmin) {
        return (
            <div className="container mx-auto py-8 px-4 max-w-7xl">
                {/* Admin Header */}
                <div className="text-center py-6">
                    <h2 className="text-3xl font-bold">
                        <span className="text-black">ADMIN</span> <span className='text-blue-500'>DASHBOARD</span>
                    </h2>
                    <div className="h-1 w-48 bg-blue-500 mx-auto mt-2 mb-8"></div>
                </div>
                
                {/* Error and Success Messages */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                        <span className="block sm:inline">{successMessage}</span>
                    </div>
                )}
                
                {/* Admin Navigation */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
                    {/* Admin Header with User Info */}
                    <div className="bg-blue-50 p-6 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                            <img 
                                src={userData.image} 
                                alt={userData.name || 'Admin'} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{userData.name}</h1>
                            <p className="text-gray-600 mt-1">{userData.email}</p>
                            <div className="mt-2 inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                Administrator
                            </div>
                        </div>
                    </div>
                    
                    {/* Admin Tabs */}
                    <div className="flex border-b">
                        <button 
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-6 py-3 font-medium ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                        >
                            Dashboard
                        </button>
                        <button 
                            onClick={() => setActiveTab('appointments')}
                            className={`px-6 py-3 font-medium ${activeTab === 'appointments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                        >
                            Appointments
                        </button>
                        <button 
                            onClick={() => setActiveTab('doctors')}
                            className={`px-6 py-3 font-medium ${activeTab === 'doctors' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                        >
                            Manage Doctors
                        </button>
                        <button 
                            onClick={() => setActiveTab('lab-techniques')}
                            className={`px-6 py-3 font-medium ${activeTab === 'lab-techniques' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                        >
                            Manage Lab Tests
                        </button>
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`px-6 py-3 font-medium ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                        >
                            My Profile
                        </button>
                    </div>
                </div>
                
                {/* Dashboard Content */}
                {activeTab === 'dashboard' && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-6">System Overview</h2>
                        
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                                <h3 className="text-lg font-medium text-gray-800">Total Appointments</h3>
                                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalAppointments}</p>
                                <div className="mt-4 flex justify-between text-sm">
                                    <span className="text-yellow-600">Pending: {stats.pendingAppointments}</span>
                                    <span className="text-green-600">Confirmed: {stats.confirmedAppointments}</span>
                                    <span className="text-blue-800">Completed: {stats.completedAppointments}</span>
                                </div>
                            </div>
                            
                            <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                                <h3 className="text-lg font-medium text-gray-800">Doctors</h3>
                                <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalDoctors}</p>
                                <p className="mt-4 text-sm text-gray-600">Total registered doctors in the system</p>
                            </div>
                            
                            <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                                <h3 className="text-lg font-medium text-gray-800">Patients</h3>
                                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalPatients}</p>
                                <p className="mt-4 text-sm text-gray-600">Total registered patients in the system</p>
                            </div>
                        </div>
                        
                        {/* Pending Appointments Section - Updated to match backend data structure */}
                        <div className="mt-8">
                            <h3 className="text-lg font-medium mb-4">Pending Appointments</h3>
                            
                            {pendingAppointments.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white border border-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {pendingAppointments.slice(0, 5).map((appointment) => (
                                                <tr key={appointment._id}>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {appointment.user?.name || 'Unknown Patient'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm text-gray-900">
                                                            {appointment.doctor?.name || appointment.doctorDetails?.name || 'Unknown Doctor'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {appointment.doctor?.speciality || appointment.doctorDetails?.speciality || 'Unknown Speciality'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm text-gray-900">
                                                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm text-gray-900">
                                                            {appointment.purpose || 'General Checkup'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <button 
                                                            onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                                                            className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium mr-2"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button 
                                                            onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                                                            className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    {pendingAppointments.length > 5 && (
                                        <div className="mt-4 text-center">
                                            <button 
                                                onClick={() => setActiveTab('appointments')}
                                                className="text-blue-600 hover:underline"
                                            >
                                                View all {pendingAppointments.length} pending appointments
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500">No pending appointments</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Appointments Tab Content */}
                {activeTab === 'appointments' && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-6">Manage Appointments</h2>
                        
                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <button 
                                onClick={() => filterAppointments('all')}
                                className={`px-4 py-2 rounded-md ${appointmentFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                All ({appointments.length})
                            </button>
                            <button 
                                onClick={() => filterAppointments('pending')}
                                className={`px-4 py-2 rounded-md ${appointmentFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Pending ({stats.pendingAppointments})
                            </button>
                            <button 
                                onClick={() => filterAppointments('confirmed')}
                                className={`px-4 py-2 rounded-md ${appointmentFilter === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Confirmed ({stats.confirmedAppointments})
                            </button>
                            <button 
                                onClick={() => filterAppointments('completed')}
                                className={`px-4 py-2 rounded-md ${appointmentFilter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Completed ({stats.completedAppointments})
                            </button>
                            <button 
                                onClick={() => filterAppointments('cancelled')}
                                className={`px-4 py-2 rounded-md ${appointmentFilter === 'cancelled' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Cancelled
                            </button>
                        </div>
                        
                        {/* Appointments Table - Updated to match backend data structure */}
                        {filteredAppointments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border border-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredAppointments.map((appointment) => (
                                            <tr key={appointment._id}>
                                                <td className="py-3 px-4">
                                                    <div className="text-xs text-gray-900">
                                                        {appointment._id.substring(0, 8)}...
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {appointment.user?.name || 'Unknown Patient'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center">
                                                        <img 
                                                            className="h-8 w-8 rounded-full object-cover"
                                                            src={(appointment.doctor?.image || appointment.doctorDetails?.image) || assets.profile_pic}
                                                            alt="Doctor"
                                                        />
                                                        <div className="ml-3">
                                                            <div className="text-sm text-gray-900">
                                                                {appointment.doctor?.name || appointment.doctorDetails?.name || 'Unknown Doctor'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {appointment.doctor?.speciality || appointment.doctorDetails?.speciality || 'Unknown Speciality'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(appointment.appointmentDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                                                        ${appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                                          appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                                                          'bg-red-100 text-red-800'}`}
                                                    >
                                                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {appointment.status === 'pending' && (
                                                        <>
                                                            <button 
                                                                onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                                                                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium mr-2"
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button 
                                                                onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                                                                className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                    
                                                    {appointment.status === 'confirmed' && (
                                                        <button 
                                                            onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                                                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                                                        >
                                                            Mark Completed
                                                        </button>
                                                    )}
                                                    
                                                    <button className="ml-2 text-blue-600 hover:text-blue-800 text-xs">
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">No appointments found for the selected filter</p>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Doctors Management Tab */}
                {activeTab === 'doctors' && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Manage Doctors</h2>
                            <button 
                                onClick={() => setShowDoctorForm(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                Add New Doctor
                            </button>
                        </div>
                        
                        {/* Add Doctor Form Modal */}
                        {showDoctorForm && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-semibold">Add New Doctor</h3>
                                        <button 
                                            onClick={() => setShowDoctorForm(false)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    
                                    <form onSubmit={handleAddDoctor} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Full Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={doctorForm.name}
                                                    onChange={handleDoctorFormChange}
                                                    required
                                                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Email *
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={doctorForm.email}
                                                    onChange={handleDoctorFormChange}
                                                    required
                                                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Password *
                                                </label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={doctorForm.password}
                                                    onChange={handleDoctorFormChange}
                                                    required
                                                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Profile Image URL
                                                </label>
                                                <input
                                                    type="url"
                                                    name="image"
                                                    value={doctorForm.image}
                                                    onChange={handleDoctorFormChange}
                                                    placeholder="https://example.com/doctor-image.jpg"
                                                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Speciality *
                                                </label>
                                                <select
                                                    name="speciality"
                                                    value={doctorForm.speciality}
                                                    onChange={handleDoctorFormChange}
                                                    required
                                                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select Speciality</option>
                                                    <option value="General physician">General Physician</option>
                                                    <option value="Gynecologist">Gynecologist</option>
                                                    <option value="Dermatologist">Dermatologist</option>
                                                    <option value="Pediatricians">Pediatricians</option>
                                                    <option value="Neurologist">Neurologist</option>
                                                    <option value="Gastroenterologist">Gastroenterologist</option>
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Degree *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="degree"
                                                    value={doctorForm.degree}
                                                    onChange={handleDoctorFormChange}
                                                    required
                                                    placeholder="e.g., MBBS, MD"
                                                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Experience *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="experience"
                                                    value={doctorForm.experience}
                                                    onChange={handleDoctorFormChange}
                                                    required
                                                    placeholder="e.g., 5 Years"
                                                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Fees ($) *
                                                </label>
                                                <input
                                                    type="number"
                                                    name="fees"
                                                    value={doctorForm.fees}
                                                    onChange={handleDoctorFormChange}
                                                    required
                                                    min="0"
                                                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    About
                                                </label>
                                                <textarea
                                                    name="about"
                                                    value={doctorForm.about}
                                                    onChange={handleDoctorFormChange}
                                                    rows="3"
                                                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            
                                            <div className="md:col-span-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        name="available"
                                                        checked={doctorForm.available}
                                                        onChange={handleDoctorFormChange}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">Available for appointments</span>
                                                </label>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-end gap-4 pt-4">
                                            <button 
                                                type="button"
                                                onClick={() => setShowDoctorForm(false)}
                                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                                disabled={addingDoctor}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit"
                                                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${addingDoctor ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={addingDoctor}
                                            >
                                                {addingDoctor ? 'Adding...' : 'Add Doctor'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                        
                        {/* Doctors Table */}
                        {doctors.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border border-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speciality</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fees</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {doctors.map((doctor) => (
                                            <tr key={doctor._id}>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <img 
                                                                className="h-10 w-10 rounded-full object-cover"
                                                                src={doctor.image || assets.profile_pic}
                                                                alt={doctor.name}
                                                                onError={(e) => {
                                                                    if (!doctor.image || doctor.image === '') {
                                                                        e.target.src = assets.profile_pic;
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {doctor.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {doctor.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-sm text-gray-900">
                                                        {doctor.speciality}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {doctor.degree}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-sm text-gray-900">
                                                        {doctor.experience}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-sm text-gray-900">
                                                        ${doctor.fees}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        doctor.available !== false
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {doctor.available !== false ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button 
                                                        onClick={() => toggleDoctorAvailability(doctor._id, doctor.available)}
                                                        className={`text-xs mr-2 px-3 py-1 rounded-full ${
                                                            doctor.available !== false
                                                                ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                                                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        }`}
                                                    >
                                                        {doctor.available !== false ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">No doctors found</p>
                                <button 
                                    onClick={() => setShowDoctorForm(true)}
                                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                >
                                    Add First Doctor
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Profile Tab - Show Regular Profile View */}
                {activeTab === 'profile' && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        {/* Use the existing profile view code here */}
                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Personal Information */}
                                    <div className="bg-gray-50 p-6 rounded-lg">
                                        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Personal Information</h2>
                                        
                                        <div className="space-y-4">
                                            <div className="flex flex-col">
                                                <label className="text-gray-500 text-sm mb-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            
                                            <div className="flex flex-col">
                                                <label className="text-gray-500 text-sm mb-1">Email</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    readOnly
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                            </div>
                                            
                                            <div className="flex flex-col">
                                                <label className="text-gray-500 text-sm mb-1">Phone</label>
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            
                                            <div className="flex flex-col">
                                                <label className="text-gray-500 text-sm mb-1">Gender</label>
                                                <select
                                                    name="gender"
                                                    value={formData.gender}
                                                    onChange={handleInputChange}
                                                    className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            
                                            <div className="flex flex-col">
                                                <label className="text-gray-500 text-sm mb-1">Date of Birth</label>
                                                <input
                                                    type="text"
                                                    name="dob"
                                                    value={formData.dob}
                                                    onChange={handleInputChange}
                                                    className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Address Information */}
                                    <div className="bg-gray-50 p-6 rounded-lg">
                                        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Address Information</h2>
                                        
                                        <div className="space-y-4">
                                            <div className="flex flex-col">
                                                <label className="text-gray-500 text-sm mb-1">Address Line 1</label>
                                                <input
                                                    type="text"
                                                    name="address.line1"
                                                    value={formData.address.line1}
                                                    onChange={handleInputChange}
                                                    className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            
                                            <div className="flex flex-col">
                                                <label className="text-gray-500 text-sm mb-1">Address Line 2</label>
                                                <input
                                                    type="text"
                                                    name="address.line2"
                                                    value={formData.address.line2}
                                                    onChange={handleInputChange}
                                                    className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            
                                            <div className="flex flex-col">
                                                <label className="text-gray-500 text-sm mb-1">City</label>
                                                <input
                                                    type="text"
                                                    name="address.city"
                                                    value={formData.address.city}
                                                    onChange={handleInputChange}
                                                    className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-6">
                                    <button 
                                        type="submit" 
                                        className={`bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors ${updating ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        disabled={updating}
                                    >
                                        {updating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={handleCancel}
                                        className="ml-4 border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors"
                                        disabled={updating}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Personal Information */}
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Personal Information</h2>
                                    
                                    <div className="space-y-4">
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 text-sm">Email</span>
                                            <span className="font-medium">{userData.email}</span>
                                        </div>
                                        
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 text-sm">Phone</span>
                                            <span className="font-medium">{userData.phone}</span>
                                        </div>
                                        
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 text-sm">Gender</span>
                                            <span className="font-medium">{userData.gender}</span>
                                        </div>
                                        
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 text-sm">Date of Birth</span>
                                            <span className="font-medium">{userData.dob}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Address Information */}
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Address Information</h2>
                                    
                                    <div className="space-y-4">
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 text-sm">Address Line 1</span>
                                            <span className="font-medium">{userData.address.line1}</span>
                                        </div>
                                        
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 text-sm">Address Line 2</span>
                                            <span className="font-medium">{userData.address.line2}</span>
                                        </div>
                                        
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 text-sm">City</span>
                                            <span className="font-medium">{userData.address.city}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Actions */}
                        {!isEditing && (
                            <div className="p-6 border-t">
                                <button 
                                    onClick={() => setIsEditing(true)} 
                                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Edit Profile
                                </button>
                                <button 
                                    className="ml-4 border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors"
                                    onClick={() => window.location.href = '/change-password'}
                                >
                                    Change Password
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
    
    // Regular user profile view - use the existing code for this case
    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            {/* Profile Header */}
            <div className="text-center py-6">
                <h2 className="text-3xl font-bold">
                    <span className="text-black">MY</span> <span className='text-blue-500'>PROFILE</span>
                </h2>
                <div className="h-1 w-48 bg-blue-500 mx-auto mt-2 mb-8"></div>
            </div>
            
            {/* Error and Success Messages */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            
            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                    <span className="block sm:inline">{successMessage}</span>
                </div>
            )}
            
            {/* Profile Container */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Profile Header */}
                <div className="bg-blue-50 p-6 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-md">
                        <img 
                            src={userData.image} 
                            alt={userData.name || 'Profile'} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{userData.name}</h1>
                        <p className="text-gray-600 mt-2">{userData.email}</p>
                        <div className="mt-4 inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            Active User
                        </div>
                    </div>
                </div>
                
                {/* Profile Information */}
                {isEditing ? (
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Personal Information */}
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Personal Information</h2>
                                
                                <div className="space-y-4">
                                    <div className="flex flex-col">
                                        <label className="text-gray-500 text-sm mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div className="flex flex-col">
                                        <label className="text-gray-500 text-sm mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            readOnly
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                    </div>
                                    
                                    <div className="flex flex-col">
                                        <label className="text-gray-500 text-sm mb-1">Phone</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div className="flex flex-col">
                                        <label className="text-gray-500 text-sm mb-1">Gender</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex flex-col">
                                        <label className="text-gray-500 text-sm mb-1">Date of Birth</label>
                                        <input
                                            type="text"
                                            name="dob"
                                            value={formData.dob}
                                            onChange={handleInputChange}
                                            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Address Information */}
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Address Information</h2>
                                
                                <div className="space-y-4">
                                    <div className="flex flex-col">
                                        <label className="text-gray-500 text-sm mb-1">Address Line 1</label>
                                        <input
                                            type="text"
                                            name="address.line1"
                                            value={formData.address.line1}
                                            onChange={handleInputChange}
                                            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div className="flex flex-col">
                                        <label className="text-gray-500 text-sm mb-1">Address Line 2</label>
                                        <input
                                            type="text"
                                            name="address.line2"
                                            value={formData.address.line2}
                                            onChange={handleInputChange}
                                            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div className="flex flex-col">
                                        <label className="text-gray-500 text-sm mb-1">City</label>
                                        <input
                                            type="text"
                                            name="address.city"
                                            value={formData.address.city}
                                            onChange={handleInputChange}
                                            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6">
                            <button 
                                type="submit" 
                                className={`bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors ${updating ? 'opacity-70 cursor-not-allowed' : ''}`}
                                disabled={updating}
                            >
                                {updating ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button 
                                type="button" 
                                onClick={handleCancel}
                                className="ml-4 border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors"
                                disabled={updating}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Personal Information */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Personal Information</h2>
                            
                            <div className="space-y-4">
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-sm">Email</span>
                                    <span className="font-medium">{userData.email}</span>
                                </div>
                                
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-sm">Phone</span>
                                    <span className="font-medium">{userData.phone}</span>
                                </div>
                                
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-sm">Gender</span>
                                    <span className="font-medium">{userData.gender}</span>
                                </div>
                                
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-sm">Date of Birth</span>
                                    <span className="font-medium">{userData.dob}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Address Information */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Address Information</h2>
                            
                            <div className="space-y-4">
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-sm">Address Line 1</span>
                                    <span className="font-medium">{userData.address.line1}</span>
                                </div>
                                
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-sm">Address Line 2</span>
                                    <span className="font-medium">{userData.address.line2}</span>
                                </div>
                                
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-sm">City</span>
                                    <span className="font-medium">{userData.address.city}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Actions */}
                {!isEditing && (
                    <div className="p-6 border-t">
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Edit Profile
                        </button>
                        <button 
                            className="ml-4 border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors"
                            onClick={() => window.location.href = '/change-password'}
                        >
                            Change Password
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}


export default Myprofile;
