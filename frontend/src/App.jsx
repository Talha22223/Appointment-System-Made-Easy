import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './Context/AuthContext.jsx';
import Home from './Pages/Home';
import Doctors from './Pages/Doctors.jsx';
import LabTechniques from './Pages/LabTechniques.jsx';
import Pharmacists from './Pages/Pharmacists.jsx';
import About from './Pages/About.jsx';
import Contact from './Pages/Contact.jsx';
import Login from './Pages/Login.jsx';
import Myprofile from './Pages/Myprofile.jsx';
import Myappointments from './Pages/Myappointments.jsx';
import MyLabBookings from './Pages/MyLabBookings.jsx';
import MyPharmacistAppointments from './Pages/MyPharmacistAppointments.jsx';
import LabBooking from './Pages/LabBooking.jsx';
import Appointment from './Pages/Appointment.jsx';
import PharmacistAppointment from './Pages/PharmacistAppointment.jsx';
import AdminDoctors from './Pages/AdminDoctors.jsx';
import AdminDashboard from './Pages/AdminDashboard.jsx';
import AdminAppointments from './Pages/AdminAppointments.jsx';
import AdminLabBookings from './Pages/AdminLabBookings.jsx';
import AdminPharmacists from './Pages/AdminPharmacists.jsx';
import AdminPharmacistAppointments from './Pages/AdminPharmacistAppointments.jsx';
import Navbar from './Components/Navbar.jsx';
import Footer from './Components/Footer.jsx';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = React.useContext(AuthContext);

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className='mx-4 sm:mx-[10%]'>
          <Navbar />
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:speciality" element={<Doctors />} />
          <Route path="/pharmacists" element={<Pharmacists />} />
          <Route path="/pharmacists/:speciality" element={<Pharmacists />} />
          <Route path="/lab-techniques" element={<LabTechniques />} />
          <Route path="/lab-techniques/:category" element={<LabTechniques />} />
          <Route path="/about" element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/login' element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/myprofile"
            element={
              <ProtectedRoute>
                <Myprofile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/myappointments"
            element={
              <ProtectedRoute>
                <Myappointments />
              </ProtectedRoute>
            }
          />
          <Route path='/my-lab-bookings' element={<ProtectedRoute><MyLabBookings /></ProtectedRoute>} />
          <Route path='/my-pharmacist-appointments' element={<ProtectedRoute><MyPharmacistAppointments /></ProtectedRoute>} />
          <Route path='/appointment/doctorId/:doctorId' element={<Appointment />} />
          <Route path='/pharmacist-appointment/:pharmacistId' element={<PharmacistAppointment />} />
          <Route path='/lab-booking/:labTechniqueId' element={<LabBooking />} />

          {/* Admin routes */}
          <Route path='/admin/doctors' element={<ProtectedRoute><AdminDoctors /></ProtectedRoute>} />
          <Route path='/admin/pharmacists' element={<ProtectedRoute><AdminPharmacists /></ProtectedRoute>} />
          <Route path='/admin/lab-techniques' element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path='/admin/appointments' element={<ProtectedRoute><AdminAppointments /></ProtectedRoute>} />
          <Route path='/admin/pharmacist-appointments' element={<ProtectedRoute><AdminPharmacistAppointments /></ProtectedRoute>} />
          <Route path='/admin/lab-bookings' element={<ProtectedRoute><AdminLabBookings /></ProtectedRoute>} />

          {/* Add a catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </div>
    </Router>
    </AuthProvider>
  );
}

export default App;
