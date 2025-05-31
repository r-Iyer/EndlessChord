import { api } from '../services/apiService';

/**
 * Add a song to the user's favorites.
 *
 * @param {string} songId - The ID of the song to add to favorites.
 * @returns {Promise<Object>} The response data from the API.
 * @throws Throws error if the API request fails.
 */
export const addFavorite = async (songId) => {
  try {
    const response = await api.post('/api/favorites', { songId });
    return response.data;
  } catch (error) {
    console.error(`Error adding favorite song ${songId}:`, error);
    throw error;
  }
};

/**
 * Remove a song from the user's favorites.
 *
 * @param {string} songId - The ID of the song to remove from favorites.
 * @returns {Promise<Object>} The response data from the API.
 * @throws Throws error if the API request fails.
 */
export const removeFavorite = async (songId) => {
  try {
    const response = await api.delete(`/api/favorites/${songId}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing favorite song ${songId}:`, error);
    throw error;
  }
};

/**
 * Get the list of all favorite songs for the current user.
 *
 * @returns {Promise<Array>} An array of favorite song objects.
 * @throws Throws error if the API request fails.
 */
export const getFavorites = async () => {
  try {
    const response = await api.get('/api/favorites');
    return response.data;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    throw error;
  }
};
