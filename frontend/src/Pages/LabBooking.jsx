import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';
import React from 'react';
import axios from 'axios';

import { assets } from '../assets/assets_frontend/assets';
import RelatedLabTechniques from '../Components/RelatedLabTechniques';
const API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'https://appointment-backend-fwy2.onrender.com/api';

const LabBooking = () => {
    const params = useParams();
    const labTechniqueId = params.labTechniqueId;
    
    const navigate = useNavigate();
    const { labTechniques } = useContext(AppContext);
    
    const [labInfo, setLabInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingNotes, setBookingNotes] = useState('');
    const currencySymbol = '$'; 
    const [labSlots, setLabSlots] = useState([]);
    const [slotIndex, setSlotIndex] = useState(0);
    const [slotTime, setSlotTime] = useState('');
    const [daysOfWeek] = useState(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

    useEffect(() => {
        getAvailableSlots();
    }, [labInfo]);

    const getAvailableSlots = async () => {
        setLabSlots([]);
        // Getting current date
        let today = new Date();
        for (let i = 0; i < 7; i++) {
            // Getting date with index
            let currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);
            // Setting end time of the date with index
            let endTime = new Date();
            endTime.setDate(today.getDate() + i);
            endTime.setHours(18, 0, 0, 0); // Lab closes at 6 PM
            
            // Setting Hours
            if (today.getDate() === currentDate.getDate()) {
                currentDate.setHours(currentDate.getHours() > 8 ? currentDate.getHours() + 1 : 8);
                currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
            } else {
                currentDate.setHours(8); // Lab opens at 8 AM
                currentDate.setMinutes(0);
            }
            
            let timeSlots = [];
            while (currentDate < endTime) {
                let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                // Add slot to array
                timeSlots.push({
                    datetime: new Date(currentDate),
                    time: formattedTime,
                    booked: false
                });
                // Incrementing 30 minutes
                currentDate.setMinutes(currentDate.getMinutes() + 30);
            }
            setLabSlots(prevSlots => [...prevSlots, { date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + i), slots: timeSlots }]);
        }
    };

    useEffect(() => {
        console.log("Available lab slots updated:", labSlots);
    }, [labSlots]);

    useEffect(() => {
        const fetchLabInfo = async () => {
            // Try to get from context first
            if (labTechniques && Array.isArray(labTechniques) && labTechniques.length > 0) {
                const foundLab = labTechniques.find(lab => lab._id === labTechniqueId);
                if (foundLab) {
                    console.log("Lab technique found in context:", foundLab.name);
                    setLabInfo(foundLab);
                    setLoading(false);
                    return;
                }
            }
            
            // If not in context, fetch from API
            try {
                const response = await axios.get(`${API_URL}/lab-techniques/${labTechniqueId}`);
                if (response.data) {
                    setLabInfo(response.data);
                }
            } catch (error) {
                console.error('Error fetching lab technique:', error);
            } finally {
                setLoading(false);
            }
        };
        
        if (labTechniqueId) {
            fetchLabInfo();
        } else {
            setLoading(false);
        }
    }, [labTechniques, labTechniqueId]);

    const handleBookLabTest = async () => {
        // Reset messages
        setBookingError('');
        setBookingSuccess(false);
        
        // Validate selection
        if (!slotTime) {
            setBookingError('Please select a booking time');
            return;
        }
        
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login
            navigate('/login');
            return;
        }
        
        setBookingLoading(true);
        
        try {
            // Construct booking datetime from selected date and time
            const selectedSlot = labSlots[slotIndex].slots.find(s => s.time === slotTime);
            
            if (!selectedSlot) {
                throw new Error('Selected time slot is invalid');
            }
            
            // Format the datetime properly for the backend
            const bookingDateTime = new Date(selectedSlot.datetime).toISOString();
            
            // Make sure we have lab technique data
            if (!labInfo) {
                setBookingError('Lab technique information is not available. Please try again.');
                setBookingLoading(false);
                return;
            }
            
            // Create complete lab technique data object to send with the request
            const labTechniqueData = {
                _id: labInfo._id,
                name: labInfo.name || 'Unknown Test',
                category: labInfo.category || 'Not specified',
                image: labInfo.image || '',
                duration: labInfo.duration || '',
                price: labInfo.price || 0
            };
            
            console.log("Booking lab test with data:", {
                labTechniqueId: labInfo._id,
                labTechniqueData: labTechniqueData,
                bookingDate: bookingDateTime,
                notes: bookingNotes
            });
            
            // Make API request to book lab test
            const response = await axios.post(
                `${API_URL}/lab-bookings`,
                {
                    labTechniqueId: labInfo._id,
                    labTechniqueData: labTechniqueData,
                    bookingDate: bookingDateTime,
                    notes: bookingNotes || " "
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data) {
                console.log("Lab booking created successfully:", response.data);
                setBookingSuccess(true);
                // Reset form fields
                setSlotTime('');
                setBookingNotes('');
                
                // Redirect to my lab bookings page after short delay
                setTimeout(() => {
                    navigate('/my-lab-bookings');
                }, 2000);
            }
        } catch (error) {
            console.error('Error booking lab test:', error);
            
            // Enhanced error message
            let errorMessage = 'Failed to book lab test. Please try again later.';
            
            if (error.response) {
                if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
                
                // Log detailed error information for debugging
                console.log("Error response status:", error.response.status);
                console.log("Error response data:", error.response.data);
            }
            
            setBookingError(errorMessage);
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (!labInfo && !loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Lab Test Not Found</h2>
                    <p className="mb-6">We couldn't find the lab test you're looking for. The test may have been removed or the ID is incorrect.</p>
                    <button 
                        onClick={() => navigate('/lab-techniques')}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                    >
                        View All Lab Tests
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {labInfo && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="md:flex">
                        <div className="cursor-pointer md:w-1/3 h-64 md:h-auto bg-green-50">
                            <img 
                                src={labInfo.image || assets.profile_pic} 
                                alt={labInfo.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.src = assets.profile_pic;
                                }}
                            />
                        </div>
                        
                        <div className="md:w-2/3 p-6">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
                                <div className="w-full">
                                    <h1 className="cursor-pointer text-2xl font-bold text-gray-800 flex items-center gap-2 mb-3">
                                        {labInfo.name} 
                                        <img src={assets.verified_icon} alt="Verified" className="w-5 h-5" />
                                    </h1>
                                    <div className="mb-4">
                                        <p className="cursor-pointer text-gray-600 text-lg flex items-center gap-2">
                                            {labInfo.category}
                                            <span className="cursor-pointer bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">{labInfo.duration}</span>
                                        </p>
                                    </div>
                                    
                                    {/* Lab Test Description */}
                                    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                        <p className="cursor-pointer font-medium text-gray-700 flex items-center gap-1 mb-2">
                                            About This Test
                                            <img src={assets.info_icon} alt="Info" className="w-4 h-4" />
                                        </p>
                                        <p className="text-gray-600 leading-relaxed cursor-pointer">{labInfo.description}</p>
                                    </div>
                                    
                                    {/* Requirements */}
                                    {labInfo.requirements && (
                                        <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
                                            <p className="font-medium text-yellow-700 mb-2">Requirements</p>
                                            <p className="text-gray-600">{labInfo.requirements}</p>
                                        </div>
                                    )}
                                    
                                    {/* Preparation Instructions */}
                                    {labInfo.preparation && (
                                        <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                                            <p className="font-medium text-blue-700 mb-2">Preparation Instructions</p>
                                            <p className="text-gray-600">{labInfo.preparation}</p>
                                        </div>
                                    )}
                                    
                                    <p className='text-gray-1000 font-bold cursor-pointer font-medium mt-4'>
                                        Test Fee: <span className='text-green-600'>{currencySymbol}{labInfo.price}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Slots Section */}
            <div className='mt-8'>
                <h2 className='text-xl font-bold mb-4'>Select Date & Time</h2>
                
                {/* Error/Success Messages */}
                {bookingError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                        <span className="block sm:inline">{bookingError}</span>
                    </div>
                )}
                
                {bookingSuccess && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                        <span className="block sm:inline">Lab test booked successfully! Redirecting to your bookings...</span>
                    </div>
                )}
                
                <div className='flex overflow-x-auto gap-3 pb-4'>
                    {labSlots.length > 0 && labSlots.map((day, index) => (
                        <div 
                            key={index}
                            onClick={() => setSlotIndex(index)}
                            className={`flex-shrink-0 cursor-pointer p-3 rounded-lg text-center min-w-[80px] border ${slotIndex === index ? 'bg-green-100 border-green-500' : 'bg-white border-gray-200'}`}
                        >
                            <p className='font-medium'>{daysOfWeek[new Date(day.date).getDay()]}</p>
                            <p className='text-lg font-bold mt-1'>{new Date(day.date).getDate()}</p>
                            <p className='text-xs text-gray-500'>{new Date(day.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                        </div>
                    ))}
                </div>
                
                {labSlots.length > 0 && labSlots[slotIndex]?.slots.length > 0 ? (
                    <div className='mt-4'>
                        <h3 className='text-lg font-medium mb-3'>Available Times</h3>
                        <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3'>
                            {labSlots[slotIndex].slots.map((slot, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setSlotTime(slot.time)}
                                    className={`p-2 border rounded-md text-center cursor-pointer ${slotTime === slot.time ? 'bg-green-500 text-white' : 'hover:bg-gray-50'}`}
                                >
                                    {slot.time}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className='mt-4 text-center p-4 bg-gray-50 rounded-md'>
                        <p>No slots available for this date</p>
                    </div>
                )}
                
                {slotTime && (
                    <div className='mt-6'>
                        <h3 className='text-lg font-medium mb-3'>Additional Information</h3>
                        
                        <div className="space-y-4">
                            {/* Notes */}
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                    Additional Notes (Optional)
                                </label>
                                <textarea 
                                    value={bookingNotes}
                                    onChange={(e) => setBookingNotes(e.target.value)}
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-green-300"
                                    placeholder="Any medical conditions, allergies, or special requirements..."
                                ></textarea>
                            </div>
                        </div>
                        
                        <div className='mt-6 flex justify-end'>
                            <button 
                                onClick={handleBookLabTest}
                                disabled={bookingLoading}
                                className={`bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors ${
                                    bookingLoading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                            >
                                {bookingLoading ? 'Processing...' : 'Book Lab Test'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Related Lab Techniques */}
            <RelatedLabTechniques labId={labTechniqueId} category={labInfo?.category}/>
        </div>
    );
};

export default LabBooking;
