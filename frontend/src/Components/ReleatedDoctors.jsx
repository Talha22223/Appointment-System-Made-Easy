import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../Context/AppContext';
import { useNavigate } from 'react-router-dom';

const ReleatedDoctors = ({ docId, speciality }) => {
    const { doctors } = useContext(AppContext);
    const [relDoc, setRelDoc] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (doctors && doctors.length > 0 && speciality) {
            // Fix: Properly filter doctors with the same speciality but different IDs
            const doctorsData = doctors.filter((doc) => 
                doc.speciality === speciality && doc._id !== docId
            );
            setRelDoc(doctorsData);
            console.log("Related doctors found:", doctorsData.length);
        }
    }, [doctors, speciality, docId]);

    if (!relDoc || relDoc.length === 0) {
        return null; // Don't render anything if no related doctors
    }

    return (
         <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2 text-gray-800">Similar Doctors</h1>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
                Other specialists in {speciality} you might want to consider.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {relDoc.slice(0, 4).map((item, index) => (
                    <div onClick={()=>{
                        navigate(`/appointment/doctorId/${item._id}`);
                        scrollTo(0,0); // Use /doctorId/ in the path
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
            
            {relDoc.length > 4 && (
                <div className="text-center mt-10">
                    <button 
                        className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                        onClick={() =>{ navigate('/doctors'); scrollTo(0,0)} }
                    >
                        View More Doctors
                    </button>
                </div>
            )}
        </div>
    );
}

export default ReleatedDoctors;
