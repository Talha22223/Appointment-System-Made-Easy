import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [state, setState] = useState('Sign Up');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Use navigate if you're using React Router
    const navigate = useNavigate();
    
    // Check authentication status on component mount
    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            // If using React Router: navigate('/myprofile');
            window.location.href = '/myprofile';
        }
    }, []);
    
    // Base URL for your API - adjust this to match your backend
     // Change this to your actual backend URL
    const API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'https://appointment-backend-fwy2.onrender.com/api';

    const onSubmitHandler = async (event) => {
      event.preventDefault();
      
      // Reset any previous errors
      setError('');
      
      // Basic validation
      if (!email || !password || (state === 'Sign Up' && !name)) {
        setError('Please fill in all fields');
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        return;
      }
      
      // Password validation (at least 6 characters)
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      
      setLoading(true);
      
      try {
        let response;
        
        if (state === 'Sign Up') {
          // Registration process with better debugging
          console.log('Attempting registration with:', { email, name });
          
          response = await axios.post(`${API_URL}/auth/register`, {
            name,
            email,
            password
          });
          
          console.log('Registration response:', response.data);
          
          if (response.data) {
            // Instead of auto-login, switch to login form and let the user log in manually
            setState('Login');
            setName('');
            setPassword('');
            setError(''); // Clear any errors
            
            // Show success message
            alert('Registration successful! Please log in with your credentials.');
            setLoading(false);
            return;
          }
        } else {
          // Login request - Add detailed debugging
          const loginData = {
            email: email.trim(),
            password: password
          };
          
          console.log('Attempting login with:', { 
            email: loginData.email,
            passwordLength: loginData.password.length,
            passwordExists: !!loginData.password
          });
          
          response = await axios.post(`${API_URL}/auth/login`, loginData, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          console.log('Login response:', response.data);
          
          // Store token in localStorage for future authenticated requests
          if (response.data && response.data.token) {
            localStorage.setItem('token', response.data.token);
            
            // Store user info if available
            if (response.data.user) {
              // Handle user data
              const user = {
                ...response.data.user,
                role: response.data.user.role || 'patient' // Default to patient if role is missing
              };
              
              localStorage.setItem('user', JSON.stringify(user));
              console.log('User data saved:', user);
              
              // Set a session cookie with an expiration time
              document.cookie = `isLoggedIn=true; path=/; max-age=${60*60*24}`; // 24 hours
              document.cookie = `isAdmin=${user.role === 'admin'}; path=/; max-age=${60*60*24}`; // 24 hours
              
              // Force page reload to refresh authentication state
              window.location.href = '/';
              return;
            }
          } else {
            // Response doesn't have expected data
            console.warn('Login response does not contain token:', response.data);
            setError('Server response missing authentication data');
          }
        }
      } catch (err) {
        console.error('Auth error:', err);
        console.error('Request data that was sent:', {
          email: email.trim(),
          passwordLength: password.length,
          passwordExists: !!password
        });
        
        // More detailed error handling
        if (err.response) {
          console.error('Error status:', err.response.status);
          console.error('Error response data:', err.response.data);
          
          // Show specific error message from server if available
          const errorMessage = err.response.data?.message || 
                              (state === 'Sign Up' ? 'Registration failed. Please try again.' : 'Invalid email or password.');
          setError(errorMessage);
        } else if (err.request) {
          console.error('No response received:', err.request);
          setError('No response from server. Please check your connection.');
        } else {
          console.error('Request setup error:', err.message);
          setError('An error occurred. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    return (
       <form className='min-h-[80vh] flex items-center bg-gray-50' action="">
        <div className='flex flex-col gap-4 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-800 text-sm shadow-lg bg-white'> 
          <div className="w-full text-center mb-2">
            <h1 className='text-2xl font-bold text-blue-600'>{state === 'Sign Up' ? 'Create Account' : 'Login'}</h1>  
            <p className="text-gray-500 mt-1">Please {state === 'Sign Up' ? 'sign up' : 'log in'} to book appointment</p>
          </div>
          
          {/* Show error message if any */}
          {error && (
            <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {state === 'Sign Up' && (
            <div className='w-full'>
              <label className="block text-gray-700 font-medium mb-1" htmlFor="name">Full Name</label>
              <input 
                id="name"
                className='w-full border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all' 
                type="text" 
                onChange={(e)=>setName(e.target.value)} 
                value={name} 
                required 
              />
            </div>
          )}
          
          <div className='w-full'>
            <label className="block text-gray-700 font-medium mb-1" htmlFor="email">Email</label>
            <input 
              id="email"
              className='w-full border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all' 
              type="email" 
              onChange={(e)=>setEmail(e.target.value)} 
              value={email} 
              required 
            />
          </div>
          
          <div className='w-full'>
            <label className="block text-gray-700 font-medium mb-1" htmlFor="password">Password</label>
            <input 
              id="password"
              className='w-full border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all' 
              type="password" 
              onChange={(e)=>setPassword(e.target.value)} 
              value={password} 
              required 
            />
          </div>
          
          <button 
            onClick={onSubmitHandler} 
            type='submit'
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Processing...' : (state === 'Sign Up' ? 'Create Account' : 'Login')}
          </button>
          
          <div className="w-full text-center mt-4">
            <p className="text-gray-600">
              {state === 'Sign Up' ? 'Already have an account?' : "Don't have an account?"}
              <button 
                type="button"
                onClick={() => {
                  setState(state === 'Sign Up' ? 'Login' : 'Sign Up');
                  setError('');
                }}
                className="text-blue-600 font-medium ml-1 hover:underline"
              >
                {state === 'Sign Up' ? 'Login' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
       </form>
    );
}

export default Login;
