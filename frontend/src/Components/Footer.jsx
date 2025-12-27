import React from 'react';
import { assets } from '../assets/assets_frontend/assets';

const Footer = () => {
    return (
        <div className="md:mx-10">
            <div className="flex flex-col sm:grid sm:grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
                {/* Left Section */}
                <div>
                    <img  className='mb-5 w-40'src={assets.logo} alt="" />
                    <p className='w-full md:w-2/3 text-gray-600 leading-6'> 
                    Prescripto is a smart healthcare platform that makes it easy to book appointments, get digital prescriptions, and access medical records anytime, anywhere.
                    </p>
                </div>

                {/* Center Section */}
                <div>
                    <p className='text-xl font-medium mb-5'>COMPANY</p>
                    <ul className='flex flex-col gap-2 text-gray-600 cursor-pointer '>
                        <li className='hover:text-blue-600'>Home</li>
                        <li className='hover:text-blue-600'>About us</li>
                        <li className='hover:text-blue-600'>Contact us</li>
                        <li className='hover:text-blue-600'>Privacy policy</li>
                    </ul>
                </div>

                {/* Right Section */}
                <div >
                    <p  className='text-xl font-medium mb-5' >GET IN TOUCH</p>
                    <ul className='flex flex-col gap-2 text-gray-600 cursor-pointer'>
                        <li className='hover:text-blue-600'>+92-3095690628</li>
                        <li className='hover:text-blue-600'>talhawaris12@icloud.com</li>
                    </ul>
                </div>
            </div>
            <div>
                {/* Copyright Text */}
                <hr />
                <p className='py-5 text-sm text-center'>Copyright 2025@ Prescripto - All Rights Reserved</p>
            </div>
        </div>
    );
}

export default Footer;
