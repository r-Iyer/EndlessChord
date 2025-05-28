import { api } from './apiService';

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


const channelService = {
  fetchChannels,
  fetchChannelById,
};

export default channelService;