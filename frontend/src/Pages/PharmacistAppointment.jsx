import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import React from 'react';
import axios from 'axios';
import { assets } from '../assets/assets_frontend/assets';

const PharmacistAppointment = () => {
    const params = useParams();
    const pharmacistId = params.pharmacistId;
    
    const navigate = useNavigate();
    
    const [pharmacistInfo, setPharmacistInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [appointmentMethod, setAppointmentMethod] = useState('In Person');
    const [appointmentNotes, setAppointmentNotes] = useState('');
    const [purpose, setPurpose] = useState('Medication Consultation');
    const currencySymbol = '$'; 
    const [pharmacistSlots, setPharmacistSlots] = useState([]);
    const [slotIndex, setSlotIndex] = useState(0);
    const [slotTime, setSlotTime] = useState('');
    const [daysOfWeek] = useState(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    
        const API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'https://appointment-backend-fwy2.onrender.com/api';

    
    useEffect(() => {
        getAvailableSlots();
    }, [pharmacistInfo])
    
    const getAvailableSlots = async () => {
        setPharmacistSlots([]);
        let today = new Date();
        for(let i = 0; i < 7; i++){
            let currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);
            let endTime = new Date();
            endTime.setDate(today.getDate() + i);
            endTime.setHours(21, 0, 0, 0);
            
            if(today.getDate() === currentDate.getDate()){
                currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
                currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
            } else {
                currentDate.setHours(10);
                currentDate.setMinutes(0);
            }
            
            let timeSlots = []
            while(currentDate < endTime){
                let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                timeSlots.push({
                    datetime: new Date(currentDate),
                    time: formattedTime,
                    booked: false
                });
                currentDate.setMinutes(currentDate.getMinutes() + 30);
            }
            setPharmacistSlots(prevSlots => [...prevSlots, {
                date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + i), 
                slots: timeSlots
            }]);
        }
    }
    
    useEffect(() => {
        console.log("Available slots updated:", pharmacistSlots);
    }, [pharmacistSlots])
    
    useEffect(() => {
        const fetchPharmacistInfo = async () => {
            if (!pharmacistId) {
                console.log("Pharmacist ID is undefined or missing");
                setLoading(false);
                return;
            }
            
            try {
                const response = await axios.get(`${API_URL}/pharmacists/${pharmacistId}`);
                if (response.data) {
                    console.log("Pharmacist found:", response.data);
                    setPharmacistInfo(response.data);
                }
            } catch (error) {
                console.error("Error fetching pharmacist:", error);
            }
            
            setLoading(false);
        };
        
        fetchPharmacistInfo();
    }, [pharmacistId]);
    
    const handleBookAppointment = async () => {
        setBookingError('');
        setBookingSuccess(false);
        
        if (!slotTime) {
            setBookingError('Please select an appointment time');
            return;
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        
        setBookingLoading(true);
        
        try {
            const selectedDate = pharmacistSlots[slotIndex].date;
            const selectedSlot = pharmacistSlots[slotIndex].slots.find(s => s.time === slotTime);
            
            if (!selectedSlot) {
                throw new Error('Selected time slot is invalid');
            }
            
            const appointmentDateTime = new Date(selectedSlot.datetime).toISOString();
            
            if (!pharmacistInfo) {
                setBookingError('Pharmacist information is not available. Please try again.');
                setBookingLoading(false);
                return;
            }
            
            const pharmacistData = {
                _id: pharmacistInfo._id || pharmacistInfo.id,
                name: pharmacistInfo.name || 'Unknown Pharmacist',
                speciality: pharmacistInfo.speciality || 'General Pharmacy',
                image: pharmacistInfo.image || '',
                degree: pharmacistInfo.degree || '',
                experience: pharmacistInfo.experience || ''
            };
            
            console.log("Booking pharmacist appointment with data:", {
                pharmacistId: pharmacistInfo._id || pharmacistInfo.id,
                pharmacistData: pharmacistData,
                appointmentDate: appointmentDateTime,
                method: appointmentMethod,
                purpose: purpose,
                notes: appointmentNotes
            });
            
            const response = await axios.post(
                `${API_URL}/pharmacist-appointments`,
                {
                    pharmacistId: pharmacistInfo._id || pharmacistInfo.id,
                    pharmacistData: pharmacistData,
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
                console.log("Pharmacist appointment created successfully:", response.data);
                setBookingSuccess(true);
                setSlotTime('');
                setAppointmentNotes('');
                setPurpose('Medication Consultation');
                setAppointmentMethod('In Person');
                
                setTimeout(() => {
                    navigate('/my-pharmacist-appointments');
                }, 2000);
            }
        } catch (error) {
            console.error('Error booking pharmacist appointment:', error);
            
            let errorMessage = 'Failed to book appointment. Please try again later.';
            
            if (error.response) {
                if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!pharmacistInfo && !loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Pharmacist Not Found</h2>
                    <p className="mb-6">We couldn't find the pharmacist you're looking for.</p>
                    <button 
                        onClick={() => navigate('/pharmacists')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                    >
                        View All Pharmacists
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {pharmacistInfo && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="md:flex">
                        <div className="cursor-pointer md:w-1/3 h-64 md:h-auto">
                            <img 
                                src={pharmacistInfo.image || assets.profile_pic} 
                                alt={pharmacistInfo.name} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        
                        <div className="md:w-2/3 p-6">
                            <div className="mb-4">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{pharmacistInfo.name}</h1>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-gray-600">{pharmacistInfo.degree || 'B.Pharm'}</span>
                                    <span className="text-gray-400">-</span>
                                    <span className="text-gray-600">{pharmacistInfo.speciality}</span>
                                </div>
                                <p className="text-gray-500">Experience: {pharmacistInfo.experience || '1 Year'}</p>
                            </div>
                            
                            <div className="mb-4">
                                <h2 className="font-semibold text-gray-900 mb-2">About</h2>
                                <p className="text-gray-600">
                                    {pharmacistInfo.about || 'Experienced pharmacist providing medication consultation and advice.'}
                                </p>
                            </div>
                            
                            <div className="mb-4">
                                <p className="text-2xl font-bold text-green-600">
                                    Consultation Fee: {currencySymbol}{pharmacistInfo.fees || 30}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 border-t">
                        <h2 className="text-xl font-bold mb-4">Book Consultation Appointment</h2>
                        
                        {/* Purpose Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Purpose of Visit
                            </label>
                            <select
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="Medication Consultation">Medication Consultation</option>
                                <option value="Prescription Review">Prescription Review</option>
                                <option value="Drug Interaction Check">Drug Interaction Check</option>
                                <option value="Health Supplement Advice">Health Supplement Advice</option>
                                <option value="Medication Refill">Medication Refill</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        
                        {/* Method Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Consultation Method
                            </label>
                            <div className="flex gap-3">
                                {['In Person', 'Video Call', 'Phone Call'].map(method => (
                                    <button
                                        key={method}
                                        onClick={() => setAppointmentMethod(method)}
                                        className={`px-4 py-2 rounded-md ${
                                            appointmentMethod === method
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Date Selection */}
                        <div className="mb-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Select Date</h3>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {pharmacistSlots.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => { setSlotIndex(index); setSlotTime(''); }}
                                        className={`flex flex-col items-center min-w-[80px] px-4 py-3 rounded-lg cursor-pointer ${
                                            slotIndex === index
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <span className="text-sm">{daysOfWeek[item.date.getDay()]}</span>
                                        <span className="text-2xl font-bold">{item.date.getDate()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Time Slot Selection */}
                        <div className="mb-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Select Time</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {pharmacistSlots.length > 0 && pharmacistSlots[slotIndex]?.slots.map((slot, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSlotTime(slot.time)}
                                        disabled={slot.booked}
                                        className={`px-3 py-2 rounded-md text-sm ${
                                            slot.time === slotTime
                                                ? 'bg-blue-600 text-white'
                                                : slot.booked
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {slot.time}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Notes */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Notes (Optional)
                            </label>
                            <textarea
                                value={appointmentNotes}
                                onChange={(e) => setAppointmentNotes(e.target.value)}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Any specific concerns or medications you want to discuss..."
                            />
                        </div>
                        
                        {/* Error Message */}
                        {bookingError && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                {bookingError}
                            </div>
                        )}
                        
                        {/* Success Message */}
                        {bookingSuccess && (
                            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                                Appointment booked successfully! Redirecting...
                            </div>
                        )}
                        
                        {/* Book Button */}
                        <button
                            onClick={handleBookAppointment}
                            disabled={bookingLoading || !slotTime}
                            className={`w-full py-3 rounded-md font-semibold ${
                                bookingLoading || !slotTime
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            {bookingLoading ? 'Booking...' : 'Book Consultation'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacistAppointment;
