import React from 'react';
import MyLabBookings from './MyLabBookings';

const AdminLabBookings = () => {
    // For admin view, we might want to show all lab bookings instead of just user's bookings
    return <MyLabBookings adminMode={true} />;
};

export default AdminLabBookings;