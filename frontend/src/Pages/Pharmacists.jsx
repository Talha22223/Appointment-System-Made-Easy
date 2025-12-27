import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { assets } from '../assets/assets_frontend/assets';

const Pharmacists = () => {
    const { speciality } = useParams();
    const [filterPharmacists, setFilterPharmacists] = useState([]);
    const [allPharmacists, setAllPharmacists] = useState([]);
    const [activeFilter, setActiveFilter] = useState(speciality || 'All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    
        const API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'https://appointment-backend-fwy2.onrender.com/api';

    
    const specialities = [
        'All', 
        'General Pharmacy',
        'Clinical Pharmacy',
        'Hospital Pharmacy', 
        'Community Pharmacy',
        'Pediatric Pharmacy', 
        'Oncology Pharmacy',
        'Geriatric Pharmacy'
    ];

    // Fetch pharmacists from API
    const fetchPharmacists = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_URL}/pharmacists`);
            const apiPharmacistsData = Array.isArray(response.data) ? response.data : [];
            
            // Filter only available pharmacists
            const availablePharmacists = apiPharmacistsData.filter(pharmacist => pharmacist.available !== false);
            
            setAllPharmacists(availablePharmacists);
            console.log('Pharmacists:', availablePharmacists);
        } catch (error) {
            console.error('Error fetching pharmacists:', error);
            setError('Failed to load pharmacists');
            setAllPharmacists([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        if (!allPharmacists || allPharmacists.length === 0) {
            setFilterPharmacists([]);
            return;
        }

        if (speciality && speciality !== 'All') {
            const filtered = allPharmacists.filter(pharmacist => 
                pharmacist.speciality && pharmacist.speciality.toLowerCase() === speciality.toLowerCase()
            );
            setFilterPharmacists(filtered);
            setActiveFilter(speciality);
        } else {
            setFilterPharmacists(allPharmacists);
            setActiveFilter('All');
        }
    };
    
    const handleFilterClick = (filter) => {
        if (filter === 'All') {
            setFilterPharmacists(allPharmacists || []);
            setActiveFilter('All');
            navigate('/pharmacists');
        } else {
            const filtered = allPharmacists ? allPharmacists.filter(pharmacist => 
                pharmacist.speciality && pharmacist.speciality.toLowerCase() === filter.toLowerCase()
            ) : [];
            setFilterPharmacists(filtered);
            setActiveFilter(filter);
            navigate(`/pharmacists/${filter}`);
        }
    };

    useEffect(() => {
        fetchPharmacists();
    }, []);

    useEffect(() => {
        applyFilter();
    }, [allPharmacists, speciality]);

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
                        onClick={fetchPharmacists}
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Find Your Pharmacist</h1>
            <p className="text-gray-600 mb-8">Browse through our pharmacists to find medication consultation and advice.</p> 
            
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
                
                {/* Pharmacists Grid */}
                <div className="lg:w-3/4">
                    {filterPharmacists && filterPharmacists.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filterPharmacists.map((item, index) => (
                                <div 
                                    onClick={() => {
                                        scrollTo(0,0);
                                        navigate(`/pharmacist-appointment/${item._id}`);
                                        console.log("Navigating to pharmacist with ID:", item._id);
                                    }}
                                    key={index} 
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                                >
                                    <img 
                                        src={item.image || assets.profile_pic} 
                                        alt={item.name} 
                                        className="w-full h-48 object-cover"
                                        onError={(e) => {
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
                                                    navigate(`/pharmacist-appointment/${item._id}`);
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
                            <p className="text-xl font-medium text-gray-700 mb-4">No pharmacists found</p>
                            <p className="text-gray-500 mb-4">
                                {activeFilter === 'All' 
                                    ? 'No pharmacists are currently available.' 
                                    : `No pharmacists found for ${activeFilter} speciality.`
                                }
                            </p>
                            <button 
                                onClick={fetchPharmacists}
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

export default Pharmacists;
