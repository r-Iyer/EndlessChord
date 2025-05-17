import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

// Axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Session tracking service
export const trackSongPlay = async (songId) => {
  try {
    // This could be an actual endpoint or analytics event
    // For now just log to console
    console.log(`Tracked song play: ${songId}`);
    return true;
  } catch (error) {
    console.error(`Error tracking song play ${songId}:`, error);
    return false;
  }
};

const apiService = {
  fetchChannels,
  fetchChannelById,
  trackSongPlay,
};

export default apiService;