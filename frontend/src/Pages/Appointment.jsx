import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';
import React from 'react';
import axios from 'axios';

import { assets } from '../assets/assets_frontend/assets';
import ReleatedDoctors from '../Components/ReleatedDoctors';
const API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'https://appointment-backend-fwy2.onrender.com/api';

const Appointment = () => {
    // Fix: Use the correct parameter name from URL
    const params = useParams();
    const doctorId = params.doctorId; // The parameter is doctorId, not docId
    
    const navigate = useNavigate();
    const { doctors } = useContext(AppContext);
    
    const [docInfo, setDocInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [appointmentMethod, setAppointmentMethod] = useState('In Person');
    const [appointmentNotes, setAppointmentNotes] = useState('');
    const [purpose, setPurpose] = useState('General Checkup');
    const currencySymbol = '$'; 
    const [docSlots, setDocSlots] = useState([]);
    const [slotIndex, setSlotIndex] = useState(0);
    const [slotTime , setSlotTime] = useState('');
    const [daysOfWeek]= useState(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    useEffect(() => {
 getAvailableSlots();
    },[docInfo])
 const getAvailableSlots =  async () => {
    setDocSlots([]);
    //Getting current date
    let today= new Date();
    for(let i=0; i<7; i++){
     //Getting date with index
     let currentDate= new Date(today);
     currentDate.setDate(today.getDate()+i);
     //Setting end time of the date with index
     let endTime= new Date();
     endTime.setDate(today.getDate()+i);
          endTime.setHours(21,0,0,0);
          //Setting Hours
          if(today.getDate()=== currentDate.getDate()){
            currentDate.setHours(currentDate.getHours()>10 ? currentDate.getHours()+ 1: 10)
            currentDate.setMinutes(currentDate.getMinutes()>30 ? 30:0);
            
          }
          else {
            currentDate.setHours(10);
            currentDate.setMinutes(0);

          }
            let timeSlots = []
          while(currentDate< endTime){
            let formattedTime =currentDate.toLocaleTimeString([],{ hour: '2-digit', minute: '2-digit',minutes: '2-digit', hour12: true });
 //add slot to arrray
 timeSlots.push({
    datetime: new Date(currentDate),
    time: formattedTime,
    booked: false
 });
 //Incrementing 30 minutes
 currentDate.setMinutes(currentDate.getMinutes()+30);

            }
            setDocSlots(prevSlots => [...prevSlots, {date: new Date(today.getFullYear(), today.getMonth(), today.getDate()+i), slots: timeSlots}]);


          
          }




    
 }
 useEffect(() => {
    console.log("Available slots updated:", docSlots);
 },[docSlots])
    useEffect(() => {
        const fetchDocInfo = () => {
            if (!doctors || !Array.isArray(doctors) || doctors.length === 0) {
                console.log("Doctors data not available yet:", doctors);
                return;
            }

            // Debug the parameter and doctors data
            console.log("Doctors data available:", doctors.length);
            console.log("URL parameters:", params);
            console.log("Looking for doctor with ID:", doctorId);
            
            if (!doctorId) {
                console.log("Doctor ID is undefined or missing");
                setLoading(false);
                return;
            }
            
            // Try to find the doctor by ID
            const foundDoc = doctors.find(doc => doc._id === doctorId);
            
            if (foundDoc) {
                console.log("Doctor found:", foundDoc.name);
                setDocInfo(foundDoc);
            } else {
                console.log("Doctor not found with ID:", doctorId);
            }
            
            setLoading(false);
        };
        
        fetchDocInfo();
    }, [doctors, doctorId, params]);

    // Add this function to check if ID is valid MongoDB ObjectId format
    const isValidMongoId = (id) => {
        return /^[0-9a-fA-F]{24}$/.test(id);
    };
    
    // IMPORTANT: Update the doctor ID mapping function with valid MongoDB IDs
    // These must match actual doctor IDs in your database
    const getMongoDoctorId = (id) => {
        // First check if the ID is already a valid MongoDB ID
        if (/^[0-9a-fA-F]{24}$/.test(id)) {
            return id;
        }
        
        // CRITICAL UPDATE: Replace these with REAL MongoDB ObjectIDs from your database
        // You'll need to check your database for valid doctor IDs
        const idMapping = {
            'doc1': '65f1a9b5802733bcca4d9dfc', // Replace with actual doctor IDs from your database
            'doc2': '65f1a9b5802733bcca4d9dfd', // Replace with actual doctor IDs from your database
            'doc3': '65f1a9b5802733bcca4d9dfe'  // Replace with actual doctor IDs from your database
        };
        
        return idMapping[id] || id;
    };
    
    // Add this function to get the current doctor ID being used
    const getCurrentDoctorId = () => {
        return docInfo?._id || getMongoDoctorId(doctorId) || doctorId || 'unknown';
    };
    
    const handleBookAppointment = async () => {
        // Reset messages
        setBookingError('');
        setBookingSuccess(false);
        
        // Validate selection
        if (!slotTime) {
            setBookingError('Please select an appointment time');
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
            // Construct appointment datetime from selected date and time
            const selectedDate = docSlots[slotIndex].date;
            const selectedSlot = docSlots[slotIndex].slots.find(s => s.time === slotTime);
            
            if (!selectedSlot) {
                throw new Error('Selected time slot is invalid');
            }
            
            // Format the datetime properly for the backend
            const appointmentDateTime = new Date(selectedSlot.datetime).toISOString();
            
            // Make sure we have doctor data
            if (!docInfo) {
                setBookingError('Doctor information is not available. Please try again.');
                setBookingLoading(false);
                return;
            }
            
            // Create complete doctor data object to send with the request
            const doctorData = {
              _id: docInfo._id,
              name: docInfo.name || 'Unknown Doctor',
              speciality: docInfo.speciality || 'Not specified',
              image: docInfo.image || '',
              degree: docInfo.degree || '',
              experience: docInfo.experience || ''
            };
            
            console.log("Booking appointment with data:", {
              doctorId: docInfo._id,
              doctorData: doctorData,
              appointmentDate: appointmentDateTime,
              method: appointmentMethod,
              purpose: purpose,
              notes: appointmentNotes
            });
            
            // Make API request to book appointment
            const response = await axios.post(
              `${API_URL}/appointments`,
              {
                doctorId: docInfo._id,
                doctorData: doctorData, // Send the full doctor data object
                appointmentDate: appointmentDateTime,
                method: appointmentMethod,
                purpose: purpose,
                notes: appointmentNotes || " "
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (response.data) {
                console.log("Appointment created successfully:", response.data);
                setBookingSuccess(true);
                // Reset form fields
                setSlotTime('');
                setAppointmentNotes('');
                setPurpose('General Checkup');
                setAppointmentMethod('In Person');
                
                // Redirect to my appointments page after short delay
                setTimeout(() => {
                    navigate('/myappointments');
                }, 2000);
            }
        } catch (error) {
            console.error('Error booking appointment:', error);
            
            // Enhanced error message
            let errorMessage = 'Failed to book appointment. Please try again later.';
            
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


    if (loading && (!doctors || doctors.length === 0)) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!docInfo && !loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Doctor Not Found</h2>
                    <p className="mb-6">We couldn't find the doctor you're looking for. The doctor may have been removed or the ID is incorrect.</p>
                    <button 
                        onClick={() => navigate('/doctors')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                    >
                        View All Doctors
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {docInfo && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="md:flex">
                        <div className=" cursor-pointer md:w-1/3 h-64 md:h-auto">
                            <img 
                                src={docInfo.image} 
                                alt={docInfo.name} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        
                        <div className="md:w-2/3 p-6">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
                                <div className="w-full">
                                    <h1 className=" cursor-pointer text-2xl font-bold text-gray-800 flex items-center gap-2 mb-3">
                                        {docInfo.name} 
                                        <img src={assets.verified_icon} alt="Verified" className="w-5 h-5" />
                                    </h1>
                                    <div className="mb-4">
                                        <p className=" cursor-pointer text-gray-600 text-lg flex items-center gap-2">
                                            {docInfo.degree} - {docInfo.speciality}
                                            <span className=" cursor-pointer bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{docInfo.experience}</span>
                                        </p>
                                    </div>
                                    {/* DOCTOR ABOUT*/}
                                    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                        <p className=" cursor-pointer font-medium text-gray-700 flex items-center gap-1 mb-2">
                                            About 
                                            <img src={assets.info_icon} alt="Info" className="w-4 h-4" />
                                        </p>
                                        <p className="text-gray-600 leading-relaxed cursor-pointer">{docInfo.about}</p>
                                    </div>
                                                                            <p className='text-gray-1000 font-bold cursor-pointer font-medium mt-4'>Appointment fee: <span className='text-gray-600'>{currencySymbol}{docInfo.fees}</span></p>

                                </div>
                            </div>
                            
                            
                          
                            
                         
                        </div>
                    </div>
                </div>
            )}

            {/* Appointment Slots Section */}
            <div className='mt-8'>
                <h2 className='text-xl font-bold mb-4'>Booking slots</h2>
                
                {/* Error/Success Messages */}
                {bookingError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                        <span className="block sm:inline">{bookingError}</span>
                    </div>
                )}
                
                {bookingSuccess && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                        <span className="block sm:inline">Appointment booked successfully! Redirecting to your appointments...</span>
                    </div>
                )}
                
                <div className='flex overflow-x-auto gap-3 pb-4'>
                    {docSlots.length > 0 && docSlots.map((day, index) => (
                        <div 
                            key={index}
                            onClick={() => setSlotIndex(index)}
                            className={`flex-shrink-0 cursor-pointer p-3 rounded-lg text-center min-w-[80px] border ${slotIndex === index ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200'}`}
                        >
                            <p className='font-medium'>{daysOfWeek[new Date(day.date).getDay()]}</p>
                            <p className='text-lg font-bold mt-1'>{new Date(day.date).getDate()}</p>
                            <p className='text-xs text-gray-500'>{new Date(day.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                        </div>
                    ))}
                </div>
                
                {docSlots.length > 0 && docSlots[slotIndex]?.slots.length > 0 ? (
                    <div className='mt-4'>
                        <h3 className='text-lg font-medium mb-3'>Available Times</h3>
                        <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3'>
                            {docSlots[slotIndex].slots.map((slot, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setSlotTime(slot.time)}
                                    className={`p-2 border rounded-md text-center cursor-pointer ${slotTime === slot.time ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'}`}
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
                        <h3 className='text-lg font-medium mb-3'>Appointment Details</h3>
                        
                        <div className="space-y-4">
                            {/* Purpose */}
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                    Purpose of Visit
                                </label>
                                <select 
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                    <option value="General Checkup">General Checkup</option>
                                    <option value="Follow-up">Follow-up</option>
                                    <option value="Consultation">Consultation</option>
                                    <option value="Emergency">Emergency</option>
                                    <option value="Routine Check">Routine Check</option>
                                </select>
                            </div>
                            
                            {/* Method */}
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                    Appointment Method
                                </label>
                                <select 
                                    value={appointmentMethod}
                                    onChange={(e) => setAppointmentMethod(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                    <option value="In Person">In Person</option>
                                    <option value="Video Call">Video Call</option>
                                    <option value="Phone Call">Phone Call</option>
                                </select>
                            </div>
                            
                            {/* Notes */}
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                    Additional Notes (Optional)
                                </label>
                                <textarea 
                                    value={appointmentNotes}
                                    onChange={(e) => setAppointmentNotes(e.target.value)}
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    placeholder="Any additional information for the doctor..."
                                ></textarea>
                            </div>
                        </div>
                        
                        <div className='mt-6 flex justify-end'>
                            <button 
                                
                                onClick={handleBookAppointment}
                                disabled={bookingLoading}
                                className={`bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors ${
                                    bookingLoading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                            >
                                {bookingLoading ? 'Processing...' : 'Book Appointment'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* ----List Related Doctors---- */}
            <ReleatedDoctors docId={doctorId} speciality={docInfo?.speciality}/>
        </div>
    );
}


export default Appointment;

