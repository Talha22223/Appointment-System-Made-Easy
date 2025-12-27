import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets_frontend/assets';
import { AuthContext } from '../Context/AuthContext.jsx';

const AdminPharmacists = () => {
  const { isAdmin } = useContext(AuthContext);
  const [pharmacists, setPharmacists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'https://appointment-backend-fwy2.onrender.com/api';

  
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchPharmacists();
  }, [isAdmin]);
  
  const fetchPharmacists = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/pharmacists`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setPharmacists(response.data);
      }
    } catch (err) {
      console.error('Error fetching pharmacists:', err);
      setError('Failed to load pharmacists.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleAvailability = async (pharmacistId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/pharmacists/${pharmacistId}`,
        { available: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setPharmacists(prev => prev.map(p => 
        (p._id || p.id) === pharmacistId 
          ? { ...p, available: !currentStatus } 
          : p
      ));
    } catch (err) {
      console.error('Error updating pharmacist:', err);
      alert('Failed to update pharmacist status.');
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pharmacists Management</h1>
        <p className="text-gray-600">View and manage all pharmacists</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pharmacist
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Speciality
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Experience
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pharmacists.map((pharmacist) => (
              <tr key={pharmacist._id || pharmacist.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img 
                      src={pharmacist.image || assets.profile_pic} 
                      alt={pharmacist.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => { e.target.src = assets.profile_pic; }}
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{pharmacist.name}</div>
                      <div className="text-sm text-gray-500">{pharmacist.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {pharmacist.speciality || 'General Pharmacy'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {pharmacist.experience || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${pharmacist.fees || 30}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    pharmacist.available !== false
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {pharmacist.available !== false ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleToggleAvailability(pharmacist._id || pharmacist.id, pharmacist.available)}
                    className={`px-3 py-1 rounded ${
                      pharmacist.available !== false
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {pharmacist.available !== false ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {pharmacists.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No pharmacists found
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPharmacists;
