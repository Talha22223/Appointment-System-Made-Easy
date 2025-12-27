import axios from 'axios';

/**
 * Check if the server is online and reachable
 * @returns {Promise<boolean>} Whether the server is reachable
 */
export const checkServerStatus = async () => {
  try {
    // Try to reach the health endpoint or any public endpoint
    const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'https://appointment-backend-fwy2.onrender.com/api';
    const response = await axios.get(apiUrl.replace(/\/api$/, '') + '/health', {
      timeout: 3000 // 3 second timeout
    });
    
    return response.status === 200;
  } catch (err) {
    console.warn('Server health check failed:', err.message);
    return false;
  }
};

/**
 * Show a helpful server offline message
 */
export const showServerOfflineMessage = () => {
  alert(
    'Cannot connect to the server. Please ensure the backend server is running.'
  );
};
