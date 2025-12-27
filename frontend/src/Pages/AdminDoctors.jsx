import React from 'react';
import { useLocation } from 'react-router-dom';
import Myprofile from './Myprofile';

const AdminDoctors = () => {
    return <Myprofile initialTab="doctors" />;
};

export default AdminDoctors;