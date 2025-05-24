import { api } from '../services/apiService';

export const addFavorite = async (songId) => {
  const response = await api.post('/api/favorites', { songId });
  return response.data;
};

export const removeFavorite = async (songId) => {
  const response = await api.delete(`/api/favorites/${songId}`);
  return response.data;
};

export const getFavorites = async () => {
  const response = await api.get('/api/favorites');
  return response.data;
};