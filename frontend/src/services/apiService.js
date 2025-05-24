import axios from 'axios';
import AuthService from './authService';
import { API_URL } from '../constants/constants';

// Axios instance with default config
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

// Channel services
export const fetchChannels = async () => {
  try {
    const response = await api.get('/api/channels');
    return response.data;
  } catch (error) {
    console.error('Error fetching channels:', error);
    throw error;
  }
};

export const fetchChannelById = async (channelId) => {
  try {
    const response = await api.get(`/api/channels/${channelId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching channel ${channelId}:`, error);
    throw error;
  }
};

// Example of a protected endpoint that requires authentication
export const createChannel = async (channelData) => {
  try {
    const response = await api.post('/api/channels', channelData);
    return response.data;
  } catch (error) {
    console.error('Error creating channel:', error);
    throw error;
  }
};

// Example of updating user profile (authenticated)
export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put('/api/user/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Session tracking service (now authenticated)
export const trackSongPlay = async (songId) => {
  try {
    const response = await api.post('/api/analytics/song-play', { songId });
    console.log(`Tracked song play: ${songId}`);
    return response.data;
  } catch (error) {
    console.error(`Error tracking song play ${songId}:`, error);
    return false;
  }
};

// Alternative method: Manual auth headers for specific requests
export const fetchUserPlaylists = async () => {
  try {
    // Method 1: Using the configured axios instance (recommended)
    const response = await api.get('/api/user/playlists');
    return response.data;
    
    // Method 2: Manual headers (alternative approach)
    // const response = await axios.get(`${API_URL}/api/user/playlists`, {
    //   headers: AuthService.getAuthHeaders()
    // });
    // return response.data;
  } catch (error) {
    console.error('Error fetching user playlists:', error);
    throw error;
  }
};

// Method using AuthService's authenticatedFetch directly
export const fetchUserData = async () => {
  try {
    const response = await AuthService.authenticatedFetch(`${API_URL}/api/user/data`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

const apiService = {
  fetchChannels,
  fetchChannelById,
  createChannel,
  updateUserProfile,
  trackSongPlay,
  fetchUserPlaylists,
  fetchUserData,
};

export default apiService;