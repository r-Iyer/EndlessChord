import { api } from './apiService';

export const playbackService = {
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

  // Add other playback-related API calls here
};