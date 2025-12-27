import React from 'react';
import { assets } from '../assets/assets_frontend/assets';

const Header = () => {
    return (
        <div className='mt-6'>
        <div className='flex flex-col md:flex-row flex-wrap rounded-lg px-6 md:px-10 lg:px-20' style={{ backgroundColor: '#5f6FFF' }}>
            {/*---------leftside---------*/}
            <div className='md:w-1/2 flex flex-col justify-center gap-4  py-10 m-auto   md:py-[10vw] md:mb-[-30px]'>
                <p className='text-3xl md:text-4xl lg:text-5xl text-white font-semibold leading-tight md:leading-snug'>
                    Book Appointment 
                    <br className='hidden sm:block ' />
                    With Trusted Doctors
                </p>
                <div className='flex flex-col md:flex-row items-center gap-3 text-white text-sm font-light'>
                    <img  className='w-28'src={assets.group_profiles} alt="" />
                    <p>Simply browse through our extensive list of trusted doctors,<br />
                    schedule your appointment hassle-free.</p>
                </div>
                <a  className='flex items-center gap-2  bg-white rounded-full px-8 py-3 text-grap-600 text-sm m-auto md:m-0 hover:scale-105 transition-all duration-300 h-10 ' href="#speciality">Book appointment <img className='w-3' src={assets.arrow_icon} alt="" /> </a>
            </div>
            {/*---------rightside---------*/}
            <div className='md:w-1/2  relative flex justify-center items-center py-10 md:py-[5vw]'>
                <img  className='w-full md:absolute bottom-0 h-auto rounded-lg'src={assets.header_img} alt="" />
            </div>
        </div>
        </div>
    );
}

export default Header;
