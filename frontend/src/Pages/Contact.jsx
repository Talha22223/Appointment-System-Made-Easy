import React from 'react';
import { assets } from '../assets/assets_frontend/assets';

const Contact = () => {
    return (
        <div className="container mx-auto px-4 py-8">
           <div className='text-center py-10'>
                <h2 className="text-3xl font-bold">
                    <span className="text-black">CONTACT</span> <span className='text-blue-500'>US</span>
                </h2>
                <div className="h-1 w-48 bg-blue-500 mx-auto mt-2"></div>
            </div> 
            
            <div className="flex flex-col md:flex-row items-center gap-12 max-w-5xl mx-auto">
                <div className="w-full md:w-1/2">
                    <img 
                        src={assets.contact_image} 
                        alt="Doctor with patients" 
                        className="w-full h-auto rounded-lg shadow-md"
                    />
                </div>
                
                <div className="w-full md:w-1/2 space-y-8">
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-700">OUR OFFICE</h3>
                        <p className="text-gray-600">54709 Islamabad Pakistan</p>
                        <p className="text-gray-600">G-6/4 , Islamabad, Pakistan</p>
                        <p className="text-gray-600">Tel: 051-228055</p>
                        <p className="text-gray-600">Email: prescripto@gmail.com</p>
                    </div>
                    
                    <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-semibold text-gray-700">CAREERS AT PRESCRIPTO</h3>
                        <p className="text-gray-600">Learn more about our teams and job openings.</p>
                        <button className="border border-gray-400 hover:bg-gray-100 text-gray-700 px-6 py-2 rounded transition duration-300">
                            Explore Jobs
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Contact;
