import { api } from './apiService';

let channelsAbortController = null;

/**
 * Fetch the list of all available channels from the backend API.
 * Cancels any previous in-flight fetchChannels call.
 *
 * @returns {Promise<Array>} Resolves with an array of channel objects.
 * @throws Throws error if the API request fails (unless it was aborted).
 */
export const fetchChannels = async () => {
  // Abort any previous fetchChannels request
  if (channelsAbortController) {
    channelsAbortController.abort();
  }
  channelsAbortController = new AbortController();

  try {
    const response = await api.get('/api/channels', {
      signal: channelsAbortController.signal,
    });
    return response.data;
  } catch (error) {
    // If the error was due to cancelation, just bail out silently
    if (error.name === 'CanceledError' || error.name === 'AbortError') {
      console.log('✅ Previous fetchChannels call was canceled');
      return;
    }
    console.error('Error fetching channels:', error);
    throw error; // Propagate non-abort errors
  }
};

/**
 * Fetch detailed data for a single channel by its ID.
 * Cancels any previous in-flight fetchChannelById call.
 *
 * @param {string} channelId - The unique identifier of the channel.
 * @returns {Promise<Object>} Resolves with the channel object data.
 * @throws Throws error if the API request fails (unless it was aborted).
 */
export const fetchChannelById = async (channelId, { signal } = {}) => {
  try {
    const response = await api.get(`/api/channels/${channelId}`, {
      signal,
    });
    return response.data;
  } catch (error) {
    if (error.name === 'CanceledError' || error.name === 'AbortError') {
      console.log(`✅ fetchChannelById(${channelId}) call was canceled`);
      return;
    }
    console.error(`Error fetching channel ${channelId}:`, error);
    throw error;
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
