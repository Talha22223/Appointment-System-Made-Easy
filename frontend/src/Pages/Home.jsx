import React from 'react';
import Header from '../Components/Header';
import Specialitymenu from '../Components/Specialitymenu';
import TopDoctors from '../Components/TopDoctors';
import TopPharmacists from '../Components/TopPharmacists';
import TopLabTechniques from '../Components/TopLabTechniques';
import Banner from '../Components/Banner';
import AIChatbot from '../Components/AIChatbot';

const Home = () => {
    return (
        <div>
            <Header/>
            <Specialitymenu/>
            <TopDoctors/>
            <TopPharmacists/>
            <TopLabTechniques/>
            <Banner/>
            <AIChatbot/>
        </div>
    );
}

export default Home;
