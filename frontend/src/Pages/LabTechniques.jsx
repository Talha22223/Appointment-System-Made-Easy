import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { assets } from '../assets/assets_frontend/assets';
import { AppContext } from '../Context/AppContext';

const LabTechniques = () => {
    const { category } = useParams();
    const [filterLab, setFilterLab] = useState([]);
    const [allLabTechniques, setAllLabTechniques] = useState([]);
    const [activeFilter, setActiveFilter] = useState(category || 'All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const navigate = useNavigate();
    const { labTechniques: contextLabTechniques } = useContext(AppContext);
    
   
    const API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'https://appointment-backend-fwy2.onrender.com/api';

    const categories = [
        'All', 
        'Blood Tests',
        'Urine Tests',
        'Imaging',
        'Cardiac Tests',
        'Pathology',
        'Microbiology',
        'Biochemistry'
    ];

    // Fetch lab techniques from API and merge with existing
    const fetchLabTechniques = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_URL}/lab-techniques`);
            const apiLabTechniquesData = Array.isArray(response.data) ? response.data : [];
            
            // Merge existing context lab techniques with API lab techniques
            const existingLabTechniques = contextLabTechniques || [];
            const mergedLabTechniques = [
                ...existingLabTechniques,
                ...apiLabTechniquesData.filter(apiLab => 
                    !existingLabTechniques.some(staticLab => staticLab._id === apiLab._id)
                )
            ];
            
            // Filter only available lab techniques
            const availableLabTechniques = mergedLabTechniques.filter(lab => lab.available !== false);
            
            setAllLabTechniques(availableLabTechniques);
            console.log('Merged lab techniques:', availableLabTechniques);
        } catch (error) {
            console.error('Error fetching lab techniques:', error);
            setError('Failed to load lab techniques');
            // Fallback to context lab techniques if API fails
            const existingLabTechniques = contextLabTechniques || [];
            setAllLabTechniques(existingLabTechniques.filter(lab => lab.available !== false));
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        if (!allLabTechniques || allLabTechniques.length === 0) {
            setFilterLab([]);
            return;
        }

        let filtered = [...allLabTechniques];

        // Apply category filter
        if (category && category !== 'All') {
            filtered = filtered.filter(lab => 
                lab.category && lab.category.toLowerCase() === category.toLowerCase()
            );
            setActiveFilter(category);
        } else {
            setActiveFilter('All');
        }

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(lab =>
                lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lab.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lab.category?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return (a.price || 0) - (b.price || 0);
                case 'price-high':
                    return (b.price || 0) - (a.price || 0);
                case 'duration':
                    return (a.duration || '').localeCompare(b.duration || '');
                case 'name':
                default:
                    return (a.name || '').localeCompare(b.name || '');
            }
        });

        setFilterLab(filtered);
    };
    
    const handleFilterClick = (filter) => {
        if (filter === 'All') {
            setActiveFilter('All');
            navigate('/lab-techniques');
        } else {
            setActiveFilter(filter);
            navigate(`/lab-techniques/${filter}`);
        }
    };

    useEffect(() => {
        fetchLabTechniques();
    }, [contextLabTechniques]);

    useEffect(() => {
        applyFilter();
    }, [allLabTechniques, category, searchQuery, sortBy]);

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
                        onClick={fetchLabTechniques}
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Find Your Lab Test</h1>
            <p className="text-gray-600 mb-8">Browse through our extensive list of lab tests and diagnostic services.</p> 
            
            {/* Search and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search lab tests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                </div>
                <div className="sm:w-48">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="duration">Duration</option>
                    </select>
                </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <div className="lg:w-1/4">
                    <div className="bg-white rounded-lg shadow-md p-5 sticky top-24">
                        <h2 className="font-bold text-lg mb-4 text-gray-800">Categories</h2>
                        <div className="flex flex-wrap lg:flex-col gap-2">
                            {categories.map((filter, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleFilterClick(filter)}
                                    className={`px-4 py-2 rounded-full transition-all text-sm ${
                                        activeFilter === filter
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Lab Techniques Grid */}
                <div className="lg:w-3/4">
                    {filterLab && filterLab.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filterLab.map((item, index) => (
                                <div 
                                    onClick={() => {
                                        scrollTo(0,0);
                                        navigate(`/lab-booking/${item._id}`);
                                        console.log("Navigating to lab technique with ID:", item._id);
                                    }}
                                    key={index} 
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                                >
                                    <img 
                                        src={item.image || assets.profile_pic} 
                                        alt={item.name} 
                                        className="w-full h-48 object-cover bg-gray-50"
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
                                                    ? 'text-blue-600 bg-blue-100' 
                                                    : 'text-red-600 bg-red-100'
                                            }`}>
                                                {item.available !== false ? 'Available' : 'Not Available'}
                                            </p>
                                        </div>
                                        <p className="font-bold text-lg text-gray-900">{item.name}</p>
                                        <p className="text-gray-600 mb-1">{item.category}</p>
                                        {item.duration && <p className="text-sm text-gray-500 mb-2">Duration: {item.duration}</p>}
                                        {item.description && (
                                            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                                        )}
                                        <div className="flex justify-between items-center">
                                            {item.price && <p className="text-lg font-semibold text-green-600">${item.price}</p>}
                                            <button 
                                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-md transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    scrollTo(0,0);
                                                    navigate(`/lab-booking/${item._id}`);
                                                }}
                                            >
                                                Book Test
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-md p-10">
                            <p className="text-xl font-medium text-gray-700 mb-4">No lab tests found</p>
                            <p className="text-gray-500 mb-4">
                                {activeFilter === 'All' 
                                    ? 'No lab tests are currently available.' 
                                    : `No lab tests found for ${activeFilter} category.`
                                }
                            </p>
                            <button 
                                onClick={fetchLabTechniques}
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

export default LabTechniques;
