import { api } from './apiService';

/**
 * Service for playback-related API calls.
 */
export const playbackService = {
  /**
   * Increment the play count for a given song ID.
   *
   * @param {string} songId - The ID of the song to update play count for.
   * @returns {Promise<void>} Resolves when the API call succeeds.
   * @throws Throws error if the API request fails.
   */
  updatePlayCount: async (songId) => {
    try {
      await api.post('/api/songs/played', {
        songIds: [songId],
      });
    } catch (error) {
      console.error('Failed to update play count:', error);
      throw error;
    }
  },
};
