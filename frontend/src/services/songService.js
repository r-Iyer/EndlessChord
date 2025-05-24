import { api } from '../services/apiService';

export const fetchSongsService = async ({
  channelId,
  excludeIds = [],
  initial = false
}) => {
  const params = new URLSearchParams();
  
  if (initial) {
    params.append('source', 'initial');
  }
  if (excludeIds.length > 0) {
    params.append('excludeIds', JSON.stringify(excludeIds));
  }

  // Determine endpoint
  const endpoint = `/api/songs/${channelId}`;
  const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;

  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('API Error in fetchSongsService:', error);
    throw error; // Rethrow for component handling
  }
};