import { createContext } from 'react';
import { doctors } from '../assets/assets_frontend/assets';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const AppContext = createContext();

// Sample lab techniques data using doctor images
const sampleLabTechniques = [
    {
        _id: 'lab1',
        name: 'Complete Blood Count (CBC)',
        description: 'A comprehensive blood test that evaluates your overall health and detects various disorders.',
        category: 'Blood Tests',
        duration: '30 mins',
        price: 45,
        image: doctors[0]?.image || '',
        requirements: 'No fasting required',
        preparation: 'No special preparation needed',
        available: true
    },
    {
        _id: 'lab2',
        name: 'Urine Analysis',
        description: 'A test that examines the content of urine for various health indicators.',
        category: 'Urine Tests',
        duration: '15 mins',
        price: 25,
        image: doctors[1]?.image || '',
        requirements: 'Clean catch urine sample',
        preparation: 'Collect first morning urine sample',
        available: true
    },
    {
        _id: 'lab3',
        name: 'Chest X-Ray',
        description: 'An imaging test to examine the chest, lungs, heart, and surrounding structures.',
        category: 'Imaging',
        duration: '10 mins',
        price: 85,
        image: doctors[2]?.image || '',
        requirements: 'Remove metal objects',
        preparation: 'Wear comfortable clothing without metal',
        available: true
    },
    {
        _id: 'lab4',
        name: 'ECG (Electrocardiogram)',
        description: 'A test that measures the electrical activity of the heart.',
        category: 'Cardiac Tests',
        duration: '20 mins',
        price: 55,
        image: doctors[3]?.image || '',
        requirements: 'No restrictions',
        preparation: 'Avoid caffeine 2 hours before test',
        available: true
    }
];

const AppContextProvider = ( props ) => {
    const [doctorsList, setDoctors] = useState(doctors);
    const [labTechniquesList, setLabTechniques] = useState(sampleLabTechniques);
    
    const API_URL = import.meta.env.VITE_API_URL || 'https://appointment-backend-fwy2.onrender.com/api';

    // Function to refresh doctors data and merge with existing
    const refreshDoctors = async () => {
        try {
            const response = await axios.get(`${API_URL}/doctors`);
            const apiDoctorsData = Array.isArray(response.data) ? response.data : [];
            
            // Merge existing static doctors with API doctors
            const mergedDoctors = [
                ...doctors, // Keep existing static doctors
                ...apiDoctorsData.filter(apiDoc => 
                    !doctors.some(staticDoc => staticDoc._id === apiDoc._id)
                ) // Add only new API doctors
            ];
            
            setDoctors(mergedDoctors);
            console.log('Context refreshed with doctors:', mergedDoctors.length);
        } catch (error) {
            console.error('Error refreshing doctors:', error);
        }
    };

    // Function to refresh lab techniques data and merge with existing
    const refreshLabTechniques = async () => {
        try {
            const response = await axios.get(`${API_URL}/lab-techniques`);
            const apiLabTechniquesData = Array.isArray(response.data) ? response.data : [];
            
            // Merge existing static lab techniques with API lab techniques
            const mergedLabTechniques = [
                ...sampleLabTechniques, // Keep existing static lab techniques
                ...apiLabTechniquesData.filter(apiLab => 
                    !sampleLabTechniques.some(staticLab => staticLab._id === apiLab._id)
                ) // Add only new API lab techniques
            ];
            
            setLabTechniques(mergedLabTechniques);
            console.log('Context refreshed with lab techniques:', mergedLabTechniques.length);
        } catch (error) {
            console.error('Error refreshing lab techniques:', error);
        }
    };

    // Load doctors and lab techniques on initial mount
    useEffect(() => {
        refreshDoctors();
        refreshLabTechniques();
    }, []);

    const value = {
        doctors: doctorsList,
        labTechniques: labTechniquesList,
        refreshDoctors,
        refreshLabTechniques,
    };
    
    return ( 
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;