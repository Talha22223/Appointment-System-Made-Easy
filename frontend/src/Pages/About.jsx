import React from 'react';
import { assets } from '../assets/assets_frontend/assets';

const About = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                    ABOUT <span className="text-blue-600">US</span>
                </h1>
                <div className="w-24 h-1 bg-blue-600 mx-auto mt-4"></div>
            </div>
            
            {/* Main content section */}
            <div className="md:flex items-center gap-8 mb-16">
                <div className="md:w-1/2 mb-8 md:mb-0">
                    <img 
                        src={assets.about_image} 
                        alt="Healthcare professionals" 
                        className="w-full h-auto rounded-lg shadow-md"
                    />
                </div>
                <div className="md:w-1/2">
                    <div className="bg-blue-50 border border-blue-100 p-6 md:p-8 rounded-lg">
                        <p className="text-gray-700 mb-4 leading-relaxed">
                            Welcome to Prescripto, your trusted partner in managing healthcare needs conveniently and efficiently. 
                            At Prescripto, we understand the challenges individuals face when it comes to scheduling doctor 
                            appointments and managing their health records.
                        </p>
                        <p className="text-gray-700 mb-6 leading-relaxed">
                            Prescripto is committed to excellence in healthcare technology. We continuously strive to enhance our 
                            platform by integrating the latest advancements to improve user experience and deliver superior service. 
                            Whether you're booking your first appointment or managing ongoing care, Prescripto is here to support you 
                            every step of the way.
                        </p>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">Our Vision</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Our Vision at Prescripto is to create a seamless healthcare experience for every user. We aim to bridge the 
                            gap between patients and healthcare providers, making it easier for you to access the care you need, when 
                            you need it.
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Why Choose Us Section */}
            <div className="mb-16">
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                        WHY <span className="text-blue-600">CHOOSE US</span>
                    </h2>
                    <div className="w-24 h-1 bg-blue-600 mx-auto mt-4"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Efficiency */}
                    <div className="bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                        <h3 className="text-xl font-bold text-center mb-4 text-blue-700">EFFICIENCY:</h3>
                        <p className="text-gray-700 text-center">
                            Streamlined Appointment Scheduling That Fits Into Your Busy Lifestyle.
                        </p>
                    </div>
                    
                    {/* Convenience */}
                    <div className="bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                        <h3 className="text-xl font-bold text-center mb-4 text-blue-700">CONVENIENCE:</h3>
                        <p className="text-gray-700 text-center">
                            Access To A Network Of Trusted Healthcare Professionals In Your Area.
                        </p>
                    </div>
                    
                    {/* Personalization */}
                    <div className="bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                        <h3 className="text-xl font-bold text-center mb-4 text-blue-700">PERSONALIZATION:</h3>
                        <p className="text-gray-700 text-center">
                            Tailored Recommendations And Reminders To Help You Stay On Top Of Your Health.
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Bottom highlight section */}
            <div className="bg-blue-600 text-white p-8 md:p-12 rounded-lg text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Your Health, Our Priority</h2>
                <p className="text-lg mb-6 max-w-3xl mx-auto">
                    Join thousands of satisfied users who have simplified their healthcare journey with Prescripto.
                </p>
                <button className="bg-white text-blue-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors duration-300">
                    Book An Appointment Today
                </button>
            </div>
        </div>
    );
}

export default About;
