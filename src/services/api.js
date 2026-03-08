import axios from 'axios';

// Base URL - change this to your deployed backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/login', credentials),
  getMe: () => api.get('/me'),
  createUser: (userData) => api.post('/create-user', userData),
  createAdmin: (adminData) => api.post('/create-admin', adminData),
  getUsers: () => api.get('/users'),
  getSetupStatus: () => api.get('/setup-status'),
  setupSystem: (payload) => api.post('/setup', payload)
};

// VFD API calls
export const vfdAPI = {
  sendVfdData: (data) => api.post('/vfd-data', data),
  getMyDeviceData: () => api.get('/my-device-data'),
  getDeviceHistory: (deviceId, limit = 50) => 
    api.get(`/device-history/${deviceId}`, { params: { limit } }),
  getAllVfdData: () => api.get('/all-vfd-data'),
  getDevices: () => api.get('/devices'),
  getStatistics: () => api.get('/statistics'),
  deleteVfdData: (ids) => api.delete('/vfd-data', { data: { ids } }),
  sendMotorCommand: (deviceId, command) => api.post('/motor-control', { deviceId, command }),
  getMotorStatus: (deviceId) => api.get(`/motor-status/${deviceId}`),
  getAllMotorStatus: () => api.get('/all-motor-status')
};

export default api;
