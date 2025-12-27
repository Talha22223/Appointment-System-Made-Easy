import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { assets } from '../assets/assets_frontend/assets';

const TopPharmacists = () => {
    const [pharmacists, setPharmacists] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    const API_URL = import.meta.env.VITE_API_URL || 'https://appointment-backend-fwy2.onrender.com/api';
    
    useEffect(() => {
        fetchPharmacists();
    }, []);
    
    const fetchPharmacists = async () => {
        try {
            const response = await axios.get(`${API_URL}/pharmacists`);
            if (response.data && Array.isArray(response.data)) {
                setPharmacists(response.data.filter(p => p.available !== false).slice(0, 8));
            }
        } catch (error) {
            console.error('Error fetching pharmacists:', error);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                </div>
            </div>
        );
    }
    
    if (pharmacists.length === 0) {
        return null; // Don't show section if no pharmacists
    }
    
    return (
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2 text-gray-800">
                Top Pharmacists to Consult
            </h1>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
                Get expert medication advice and consultation from our trusted pharmacists.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pharmacists.map((item, index) => (
                    <div 
                        onClick={() => {
                            scrollTo(0, 0);
                            navigate(`/pharmacist-appointment/${item._id || item.id}`);
                        }} 
                        key={index} 
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                    >
                        <img 
                            src={item.image || assets.profile_pic} 
                            alt={item.name} 
                            className="w-full h-48 object-cover"
                            onError={(e) => { e.target.src = assets.profile_pic; }}
                        />
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">
                                    Available
                                </p>
                            </div>
                            <p className="font-bold text-lg text-gray-900">{item.name}</p>
                            <p className="text-gray-600 mb-3">{item.speciality || 'General Pharmacy'}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="text-center mt-10">
                <button 
                    className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                    onClick={() => { navigate('/pharmacists'); scrollTo(0, 0); }}
                >
                    View More Pharmacists
                </button>
            </div>
        </div>
    );
}

export default TopPharmacists;
