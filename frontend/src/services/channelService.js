import { api } from './apiService';

/**
 * Fetch the list of all available channels from the backend API.
 *
 * @returns {Promise<Array>} Resolves with an array of channel objects.
 * @throws Throws error if the API request fails.
 */
export const fetchChannels = async () => {
  try {
    const response = await api.get('/api/channels');
    return response.data;
  } catch (error) {
    console.error('Error fetching channels:', error);
    throw error; // Let caller handle the error as well
  }
};

/**
 * Fetch detailed data for a single channel by its ID.
 *
 * @param {string} channelId - The unique identifier of the channel.
 * @returns {Promise<Object>} Resolves with the channel object data.
 * @throws Throws error if the API request fails.
 */
export const fetchChannelById = async (channelId) => {
  try {
    const response = await api.get(`/api/channels/${channelId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching channel ${channelId}:`, error);
    throw error; // Propagate error to caller for handling
  }
};

/**
 * Centralized channel service exposing channel-related API calls.
 */
const channelService = {
  fetchChannels,
  fetchChannelById,
};

export default channelService;
