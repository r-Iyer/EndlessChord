import { api } from '../services/apiService';

/**
 * Fetch songs for a given channel with options to exclude specific songs and indicate initial load.
 *
 * @param {Object} params
 * @param {string} params.channelId - The ID of the channel to fetch songs from.
 * @param {Array<string>} [params.excludeIds=[]] - Array of video IDs to exclude from results.
 * @param {boolean} [params.initial=false] - Flag to indicate initial fetch (adds `source=initial` query param).
 * @returns {Promise<Array>} - Resolves with an array of song objects.
 * @throws Throws error if the API request fails.
 */
export const fetchSongsService = async ({
  channelId,
  excludeIds = [],
  initial = false,
}) => {
  const params = new URLSearchParams();

  params.append('source', initial ? 'initial' : 'refresh');


  if (excludeIds.length > 0) {
    // Exclude specified songs by sending their IDs as a JSON string
    params.append('excludeIds', JSON.stringify(excludeIds));
  }

  const endpoint = `/api/songs/${channelId}`;
  // Construct URL with query params if any
  const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;

  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('API Error in fetchSongsService:', error);
    throw error;
  }
};
