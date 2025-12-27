import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching user profile with token:', token ? 'Token exists' : 'No token');
      
      const response = await authService.getProfile();
      console.log('Profile response:', response.data);
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error.response?.data || error.message);
      // Only logout if it's an authentication error, not a network error
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('AuthContext useEffect - Token check:', token ? 'Token found' : 'No token');
    
    if (token && token !== 'undefined' && token !== 'null') {
      fetchUserProfile();
    } else {
      console.log('No valid token found, clearing any invalid token');
      localStorage.removeItem('token');
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login({ email, password });
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);
      return response.data.user;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(userData);
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);
      return response.data.user;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      loading, 
      error, 
      login, 
      register, 
      logout,
      isAuthenticated: !!currentUser,
      isDoctor: currentUser?.role === 'doctor',
      isAdmin: currentUser?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};
