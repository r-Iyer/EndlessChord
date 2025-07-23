import { api } from '../services/apiService';

let currentAbortController = null;

/**
 * Fetch songs for a given channel with options to exclude specific songs and indicate initial load.
 *
 * @param {Object} params
 * @param {string} params.channelId - The ID of the channel to fetch songs from.
 * @param {Array<string>} [params.excludeIds=[]] - Array of video IDs to exclude from results.
 * @param {boolean} [params.initial=false] - Flag to indicate initial fetch (adds `source=initial` query param).
 * @returns {Promise<Array>} - Resolves with an array of song objects.
 * @throws Throws error if the API request fails (including AbortError on cancellation).
 */
export const fetchSongsService = async ({
  channelId,
  excludeIds = [],
  source,
}) => {
  // Abort previous request if still in flight
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();

  const params = new URLSearchParams();
  params.append('source', source);
  if (excludeIds.length > 0) {
    params.append('excludeIds', JSON.stringify(excludeIds));
  }

  const endpoint = `/api/songs/${channelId}`;
  const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;

  // Let AbortError bubble up to caller
  const response = await api.get(url, {
    signal: currentAbortController.signal,
  });
  return response.data;
};

/**
 * Cancels any in-flight fetchSongsService call.
 */
export const cancelFetchSongs = () => {
  if (currentAbortController) {
    currentAbortController.abort();
  }
};

export const getSongById = async (videoId) => {
  try {
    const response = await api.get(`/api/songs/song/${videoId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      // Song not found
      return null;
    }
    // Re-throw for other types of errors (e.g. 500, network issues)
    throw error;
  }
};
