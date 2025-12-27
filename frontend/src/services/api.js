import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'https://appointment-backend-fwy2.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout for Render.com cold starts
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile')
};

// Doctor service
export const doctorService = {
  getAllDoctors: () => api.get('/doctors'),
  getDoctor: (id) => api.get(`/doctors/${id}`),
  addDoctor: (doctorData) => api.post('/doctors', doctorData),
  updateDoctor: (id, doctorData) => api.put(`/doctors/${id}`, doctorData),
  deleteDoctor: (id) => api.delete(`/doctors/${id}`)
};

// Appointment service
export const appointmentService = {
  bookAppointment: (appointmentData) => api.post('/appointments', appointmentData),
  getPatientAppointments: () => api.get('/appointments/patient'),
  getDoctorAppointments: () => api.get('/appointments/doctor'),
  getAppointment: (id) => api.get(`/appointments/${id}`),
  updateAppointmentStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status })
};

// Prescription service
export const prescriptionService = {
  createPrescription: (prescriptionData) => api.post('/prescriptions', prescriptionData),
  getPatientPrescriptions: () => api.get('/prescriptions/patient'),
  getDoctorPrescriptions: () => api.get('/prescriptions/doctor'),
  getPrescription: (id) => api.get(`/prescriptions/${id}`)
};

export default api;
