import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../Context/AppContext';
import { useNavigate } from 'react-router-dom';

const RelatedLabTechniques = ({ labId, category }) => {
    const { labTechniques } = useContext(AppContext);
    const [relLab, setRelLab] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (labTechniques && labTechniques.length > 0 && category) {
            // Filter lab techniques with the same category but different IDs
            const labData = labTechniques.filter((lab) => 
                lab.category === category && lab._id !== labId
            );
            setRelLab(labData);
            console.log("Related lab techniques found:", labData.length);
        }
    }, [labTechniques, category, labId]);

    if (!relLab || relLab.length === 0) {
        return null; // Don't render anything if no related lab techniques
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2 text-gray-800">Similar Lab Tests</h1>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
                Other tests in {category} category you might want to consider.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {relLab.slice(0, 4).map((item, index) => (
                    <div onClick={() => {
                        navigate(`/lab-booking/${item._id}`);
                        scrollTo(0,0);
                        console.log("Navigating to lab technique with ID:", item._id);
                    }} key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-48 object-cover bg-green-50"
                        />
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">Available</p>
                            </div>
                            <p className="font-bold text-lg text-gray-900">{item.name}</p>
                            <p className="text-gray-600 mb-3">{item.category}</p>
                            {item.price && <p className="text-green-600 font-semibold">${item.price}</p>}
                        </div>
                    </div>
                ))}
            </div>
            
            {relLab.length > 4 && (
                <div className="text-center mt-10">
                    <button 
                        className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
                        onClick={() => { navigate('/lab-techniques'); scrollTo(0,0) }}
                    >
                        View More Lab Tests
                    </button>
                </div>
            )}
        </div>
    );
}

export default RelatedLabTechniques;