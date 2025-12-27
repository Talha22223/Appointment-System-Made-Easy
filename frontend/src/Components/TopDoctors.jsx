import React, { useContext } from 'react';

import { useNavigate } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';

const TopDoctors = () => {
    const {doctors} = useContext(AppContext);
    const navigate = useNavigate();
    
    return (
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2 text-gray-800">Top Doctors to Book</h1>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">Simply browse through our extensive list of trusted doctors.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {doctors.slice(0, 8).map((item, index) => (
                    <div onClick={()=>{
                        scrollTo(0,0);
                        navigate(`/appointment/doctorId/${item._id}`) // Use /doctorId/ in the path
                        console.log("Navigating to doctor with ID:", item._id);
                    }} key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">Available</p>
                            </div>
                            <p className="font-bold text-lg text-gray-900">{item.name}</p>
                            <p className="text-gray-600 mb-3">{item.speciality}</p>
                       
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="text-center mt-10">
                <button 
                    className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                    onClick={() =>{ navigate('/doctors'); scrollTo(0,0)} }
                >
                    View More Doctors
                </button>
            </div>
        </div>
    );
}

export default TopDoctors;

