import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets_frontend/assets';
import { AuthContext } from '../Context/AuthContext.jsx';

const MyLabBookings = ({ adminMode = false }) => {
    const { currentUser, isAdmin } = useContext(AuthContext);
    const [labBookings, setLabBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    
    const API_URL = import.meta.env.VITE_API_URL || 'https://appointment-backend-fwy2.onrender.com/api';
    
    // Use a default image fallback
    const defaultLabImage = assets.profile_pic;
    
    // Filter states
    const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled
    
    // Fetch lab bookings on component mount
    useEffect(() => {
        fetchLabBookings();
    }, []);
    
    const fetchLabBookings = async () => {
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            
            console.log('MyLabBookings - isAdmin:', isAdmin, 'adminMode:', adminMode);
            
            let endpoint = `${API_URL}/lab-bookings/patient`;
            
            // Only use admin endpoint if explicitly in admin mode, not just if user is admin
            if (adminMode) {
                endpoint = `${API_URL}/lab-bookings`;
                console.log('Using admin endpoint for lab bookings');
            } else {
                console.log('Using patient endpoint for lab bookings');
            }
            
            const response = await axios.get(endpoint, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            console.log('Raw lab bookings data:', response.data);
            
            if (response.data && Array.isArray(response.data)) {
                // Process lab bookings
                const sanitizedLabBookings = response.data.map(booking => {
                    // Prepare lab technique data
                    let labTechniqueData;
                    
                    // If lab technique is already populated as an object
                    if (booking.labTechnique && typeof booking.labTechnique === 'object' && booking.labTechnique.name) {
                        labTechniqueData = {
                            ...booking.labTechnique,
                            name: booking.labTechnique.name || 'Unknown Test',
                            category: booking.labTechnique.category || 'Not specified',
                            image: booking.labTechnique.image || assets.profile_pic
                        };
                    } 
                    // Fallback for missing lab technique data
                    else {
                        labTechniqueData = {
                            name: 'Unknown Test',
                            category: 'Not specified',
                            image: assets.profile_pic
                        };
                    }
                    
                    return {
                        ...booking,
                        labTechnique: labTechniqueData,
                        status: booking.status || 'pending',
                        bookingDate: booking.bookingDate || new Date().toISOString()
                    };
                });
                
                setLabBookings(sanitizedLabBookings);
            }
        } catch (err) {
            console.error('Error fetching lab bookings:', err);
            console.error('Error details:', err.response?.data || err.message);
            
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            
            setError(`Failed to load lab bookings: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Cancel lab booking function
    const cancelLabBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this lab booking?')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            
            await axios.put(`${API_URL}/lab-bookings/${bookingId}/cancel`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            // Refresh the lab bookings list
            fetchLabBookings();
        } catch (err) {
            console.error('Error cancelling lab booking:', err);
            alert('Failed to cancel lab booking. Please try again.');
        }
    };

    // Accept lab booking function
    const acceptLabBooking = async (bookingId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            
            await axios.put(`${API_URL}/lab-bookings/${bookingId}/status`, 
                { status: 'confirmed' }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            // Refresh the lab bookings list
            fetchLabBookings();
        } catch (err) {
            console.error('Error accepting lab booking:', err);
            alert('Failed to accept lab booking. Please try again.');
        }
    };

    // Reject lab booking function
    const rejectLabBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to reject this lab booking?')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            
            await axios.put(`${API_URL}/lab-bookings/${bookingId}/status`, 
                { status: 'rejected' }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            // Refresh the lab bookings list
            fetchLabBookings();
        } catch (err) {
            console.error('Error rejecting lab booking:', err);
            alert('Failed to reject lab booking. Please try again.');
        }
    };
    
    // Filter lab bookings based on selected filter
    const getFilteredLabBookings = () => {
        if (!labBookings || labBookings.length === 0) {
            return [];
        }
        
        const today = new Date();
        
        switch (filter) {
            case 'upcoming':
                return labBookings.filter(booking => {
                    const bookingDate = new Date(booking.bookingDate);
                    return bookingDate >= today && booking.status !== 'cancelled';
                });
            case 'past':
                return labBookings.filter(booking => {
                    const bookingDate = new Date(booking.bookingDate);
                    return bookingDate < today && booking.status !== 'cancelled';
                });
            case 'cancelled':
                return labBookings.filter(booking => booking.status === 'cancelled');
            case 'rejected':
                return labBookings.filter(booking => booking.status === 'rejected');
            default:
                return labBookings;
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
                            <><span className="text-black">MANAGE</span> <span className='text-green-500'>LAB BOOKINGS</span></>
                        ) : (
                            <><span className="text-black">MY</span> <span className='text-green-500'>LAB BOOKINGS</span></>
                        )}
                    </h2>
                    <div className="h-1 w-48 bg-green-500 mx-auto mt-2 mb-8"></div>
                </div>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500"></div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="text-center py-6">
                <h2 className="text-3xl font-bold">
                    {isAdmin || adminMode ? (
                        <><span className="text-black">MANAGE</span> <span className='text-green-500'>LAB BOOKINGS</span></>
                    ) : (
                        <><span className="text-black">MY</span> <span className='text-green-500'>LAB BOOKINGS</span></>
                    )}
                </h2>
                <div className="h-1 w-48 bg-green-500 mx-auto mt-2 mb-8"></div>
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
                    className={`px-4 py-2 rounded-full text-sm ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    All Bookings
                </button>
                <button 
                    onClick={() => setFilter('upcoming')}
                    className={`px-4 py-2 rounded-full text-sm ${filter === 'upcoming' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Upcoming
                </button>
                <button 
                    onClick={() => setFilter('past')}
                    className={`px-4 py-2 rounded-full text-sm ${filter === 'past' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Past
                </button>
                <button 
                    onClick={() => setFilter('cancelled')}
                    className={`px-4 py-2 rounded-full text-sm ${filter === 'cancelled' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Cancelled
                </button>
                <button 
                    onClick={() => setFilter('rejected')}
                    className={`px-4 py-2 rounded-full text-sm ${filter === 'rejected' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Rejected
                </button>
            </div>
            
            {/* Lab Bookings List */}
            {getFilteredLabBookings().length > 0 ? (
                <div className="space-y-4">
                    {getFilteredLabBookings().map((booking) => {
                        console.log(`Rendering lab booking ${booking._id}:`, {
                            labTechniqueName: booking.labTechnique?.name,
                            labTechniqueImage: booking.labTechnique?.image
                        });
                        
                        return (
                            <div key={booking._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="md:flex">
                                    <div className="md:flex-shrink-0 bg-green-50">
                                        <img 
                                            className="h-48 w-full object-cover md:w-48" 
                                            src={booking.labTechnique?.image || defaultLabImage} 
                                            alt={booking.labTechnique?.name || 'Lab Test'}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = defaultLabImage;
                                            }}
                                        />
                                    </div>
                                    <div className="p-6 w-full">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xl font-semibold text-gray-900">
                                                    {booking.labTechnique?.name || 'Unknown Test'}
                                                </p>
                                                <p className="text-gray-600">
                                                    {booking.labTechnique?.category || 'Category not specified'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                                                    {(booking.status || 'pending').charAt(0).toUpperCase() + (booking.status || 'pending').slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-gray-500 text-sm">Date & Time</p>
                                                <p className="font-medium">
                                                    {formatDate(booking.bookingDate)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-sm">Booking ID</p>
                                                <p className="font-medium">{booking._id}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-sm">Duration</p>
                                                <p className="font-medium">{booking.labTechnique?.duration || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-sm">Price</p>
                                                <p className="font-medium text-green-600">${booking.labTechnique?.price || 'N/A'}</p>
                                            </div>
                                            {/* Show patient info for admin */}
                                            {(isAdmin || adminMode) && booking.user && (
                                                <>
                                                    <div>
                                                        <p className="text-gray-500 text-sm">Patient Name</p>
                                                        <p className="font-medium">{booking.user.name || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-sm">Patient Email</p>
                                                        <p className="font-medium">{booking.user.email || 'N/A'}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        
                                        {booking.notes && (
                                            <div className="mt-4">
                                                <p className="text-gray-500 text-sm">Notes</p>
                                                <p className="font-medium">{booking.notes}</p>
                                            </div>
                                        )}
                                        
                                        <div className="mt-6 flex flex-wrap gap-3">
                                            {/* Role-based action buttons */}
                                            {isAdmin || adminMode ? (
                                                // Admin users can accept/reject pending lab bookings
                                                booking.status === 'pending' && new Date(booking.bookingDate) > new Date() && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => acceptLabBooking(booking._id)}
                                                            className="bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-md transition-colors"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => rejectLabBooking(booking._id)}
                                                            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-md transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )
                                            ) : (
                                                // Regular users can only cancel their lab bookings
                                                (booking.status === 'pending' || booking.status === 'confirmed') && new Date(booking.bookingDate) > new Date() && (
                                                    <button
                                                        onClick={() => cancelLabBooking(booking._id)}
                                                        className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-md transition-colors"
                                                    >
                                                        Cancel Booking
                                                    </button>
                                                )
                                            )}
                                            
                                            <button 
                                                onClick={() => navigate(`/lab-booking-details/${booking._id}`)}
                                                className="px-4 py-2 text-green-600 border border-green-600 rounded-md hover:bg-green-50"
                                            >
                                                View Details
                                            </button>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No lab bookings found</h3>
                    <p className="mt-2 text-gray-600">
                        {filter === 'all' ? "You haven't booked any lab tests yet." : `No ${filter} lab bookings found.`}
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => navigate('/lab-techniques')}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                            Book a Lab Test
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyLabBookings;
