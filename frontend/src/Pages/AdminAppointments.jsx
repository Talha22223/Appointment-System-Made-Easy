import React from 'react';
import Myappointments from './Myappointments';

const AdminAppointments = () => {
    // For admin view, we might want to show all appointments instead of just user's appointments
    return <Myappointments adminMode={true} />;
};

export default AdminAppointments;