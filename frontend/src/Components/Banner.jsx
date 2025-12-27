import React from 'react';
import { assets } from '../assets/assets_frontend/assets';
import { useNavigate } from 'react-router-dom';
const Banner = () => {
      const navigate = useNavigate();
    return ( 
      
        <div className='flex   rounded-lg px-6 sm:px-10 md:px-14 lg:px-12 my-20 md:mx-10'style={{ backgroundColor: '#5f6FFF' }}>
          {/* ------Leftside--------- */}
          <div className='flex-1 py-8 smLpy-10 md:py-16 lg:py-20 flex flex-col justify-center gap-6 md:gap-8'>
             <div className='text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold text-white'> 
              <p >Book Appointment</p>
              <p className='mt-4'>With 100+ Trusted Doctors
                </p>  
             </div>
             <button onClick={()=>{
                navigate('/login');
                scrollTo(0,0)
             }} className='bg-white text-sm sm:text-base text-gray-600 px-6 py-3 w-40 text-center rounded-full mt-6 hover:scale-105 transition-all'>Create account</button>
            </div>  
            {/* ------Rightside--------- */}
          <div className='hidden md:block md:w-1/2 lg:w-[370px] relative'>
            <img className='w-full absolute bottom-0 max-w-md right-0' src={assets.appointment_img} alt="" /></div> 
        </div>
    );
}

export default Banner;
