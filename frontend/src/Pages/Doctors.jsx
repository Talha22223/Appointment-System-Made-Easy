import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { assets } from '../assets/assets_frontend/assets';

const Doctors = () => {
    const { speciality } = useParams();
    const [filterDoc, setFilterDoc] = useState([]);
    const [allDoctors, setAllDoctors] = useState([]);
    const [activeFilter, setActiveFilter] = useState(speciality || 'All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { doctors: contextDoctors } = useContext(AppContext);
    
    const API_URL = import.meta.env.VITE_API_URL || 'https://appointment-backend-fwy2.onrender.com/api';
    
    const specialities = [
        'All', 
        'General physician', // Updated to match backend
        'Gynecologist', 
        'Dermatologist', 
        'Pediatricians',
        'Neurologist', 
        'Gastroenterologist'
    ];

    // Fetch doctors from API and merge with existing
    const fetchDoctors = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_URL}/doctors`);
            const apiDoctorsData = Array.isArray(response.data) ? response.data : [];
            
            // Merge existing context doctors with API doctors
            const mergedDoctors = [
                ...contextDoctors, // Keep existing static doctors
                ...apiDoctorsData.filter(apiDoc => 
                    !contextDoctors.some(staticDoc => staticDoc._id === apiDoc._id)
                ) // Add only new API doctors that don't already exist
            ];
            
            // Filter only available doctors
            const availableDoctors = mergedDoctors.filter(doctor => doctor.available !== false);
            
            setAllDoctors(availableDoctors);
            console.log('Merged doctors:', availableDoctors);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setError('Failed to load doctors');
            // Fallback to context doctors if API fails
            setAllDoctors(contextDoctors.filter(doctor => doctor.available !== false));
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        if (!allDoctors || allDoctors.length === 0) {
            setFilterDoc([]);
            return;
        }

        if (speciality && speciality !== 'All') {
            const filtered = allDoctors.filter(doc => 
                doc.speciality && doc.speciality.toLowerCase() === speciality.toLowerCase()
            );
            setFilterDoc(filtered);
            setActiveFilter(speciality);
        } else {
            setFilterDoc(allDoctors);
            setActiveFilter('All');
        }
    };
    
    const handleFilterClick = (filter) => {
        if (filter === 'All') {
            setFilterDoc(allDoctors || []);
            setActiveFilter('All');
            navigate('/doctors');
        } else {
            const filtered = allDoctors ? allDoctors.filter(doc => 
                doc.speciality && doc.speciality.toLowerCase() === filter.toLowerCase()
            ) : [];
            setFilterDoc(filtered);
            setActiveFilter(filter);
            navigate(`/doctors/${filter}`);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, [contextDoctors]); // Re-fetch when context doctors change

    useEffect(() => {
        applyFilter();
    }, [allDoctors, speciality]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                    <button 
                        onClick={fetchDoctors}
                        className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Find Your Doctor</h1>
            <p className="text-gray-600 mb-8">Browse through the doctors specialist to find the right care for you.</p> 
            
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <div className="lg:w-1/4">
                    <div className="bg-white rounded-lg shadow-md p-5 sticky top-24">
                        <h2 className="font-bold text-lg mb-4 text-gray-800">Specialities</h2>
                        <div className="flex flex-wrap lg:flex-col gap-2">
                            {specialities.map((filter, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleFilterClick(filter)}
                                    className={`px-4 py-2 rounded-full transition-all text-sm ${
                                        activeFilter === filter
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Doctors Grid */}
                <div className="lg:w-3/4">
                    {filterDoc && filterDoc.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filterDoc.map((item, index) => (
                                <div 
                                    onClick={() => {
                                        scrollTo(0,0);
                                        navigate(`/appointment/doctorId/${item._id}`);
                                        console.log("Navigating to doctor with ID:", item._id);
                                    }}
                                    key={index} 
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                                >
                                    <img 
                                        src={item.image || assets.profile_pic} 
                                        alt={item.name} 
                                        className="w-full h-48 object-cover"
                                        onError={(e) => {
                                            // Only fallback to default if no custom image was provided
                                            if (!item.image || item.image === '') {
                                                e.target.src = assets.profile_pic;
                                            }
                                        }}
                                    />
                                    <div className="p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                                                item.available !== false
                                                    ? 'text-green-600 bg-green-100' 
                                                    : 'text-red-600 bg-red-100'
                                            }`}>
                                                {item.available !== false ? 'Available' : 'Not Available'}
                                            </p>
                                        </div>
                                        <p className="font-bold text-lg text-gray-900">{item.name}</p>
                                        <p className="text-gray-600 mb-1">{item.speciality}</p>
                                        {item.degree && <p className="text-sm text-gray-500 mb-2">{item.degree}</p>}
                                        {item.experience && <p className="text-sm text-gray-500 mb-3">Experience: {item.experience}</p>}
                                        <div className="flex justify-between items-center">
                                            {item.fees && <p className="text-lg font-semibold text-green-600">${item.fees}</p>}
                                            <button 
                                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-md transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    scrollTo(0,0);
                                                    navigate(`/appointment/doctorId/${item._id}`);
                                                }}
                                            >
                                                Book Appointment
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-md p-10">
                            <p className="text-xl font-medium text-gray-700 mb-4">No doctors found</p>
                            <p className="text-gray-500 mb-4">
                                {activeFilter === 'All' 
                                    ? 'No doctors are currently available.' 
                                    : `No doctors found for ${activeFilter} speciality.`
                                }
                            </p>
                            <button 
                                onClick={fetchDoctors}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                Refresh
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Doctors;

