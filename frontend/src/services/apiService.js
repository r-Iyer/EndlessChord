import axios from 'axios';
import AuthService from './authService';
import { API_URL } from '../constants/constants';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth headers
api.interceptors.request.use(
  (config) => {
    // Get auth headers from AuthService
    const authHeaders = AuthService.getAuthHeaders();
    
    // Merge auth headers with existing headers
    config.headers = {
      ...config.headers,
      ...authHeaders,
    };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && AuthService.token) {
      AuthService.logout();
      window.location.reload(); // Redirect to login
    }
    
    return Promise.reject(error);
  }
);