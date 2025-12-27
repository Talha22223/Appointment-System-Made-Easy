import React from 'react';
import {specialityData} from '../assets/assets_frontend/assets.js'
import { Link } from 'react-router-dom';
const Specialitymenu = () => {
    return (
        <div className='flex flex-col items-center gap-4 py-16 text-grap-800'  id='speciality'>
            <h1 className='text-3xl font-medium '>Find by Speciality</h1>
            <p className='sm:w-1/3 text-center text-sm'>Simple browse through our extensive list of trusted doctors,schedule  your appointment hassle-free</p>
            <div className='flex sm:justify-center gap-4 pt-5 w-full overflow-scroll scrollbar-hide px-4 md:px-8 lg:px-20'>
         {specialityData.map((item,index) => (
            <Link onClick={()=>{
                scrollTo(0,0);
            }} className='flex flex-col item-center text-xs cursor-pointer flex-shrink-0 hover:translate-y-[-10px] transition-all duration-500' key={index} to={`/doctors/${item.speciality}`}>
                <img  className='w-16 sm:w-24 mb-2 'src={item.image} alt="" />
                <p>{item.speciality}</p>
            </Link>
         ))}
            </div>
        </div>
    );
}

export default Specialitymenu;
