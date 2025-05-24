import { api } from './apiService';

export const searchService = {
  searchSongs: async (query, options = {}) => {
    try {
      const { excludeIds = [], source = null } = options;
      const params = new URLSearchParams();
      
      params.append('q', query);
      
      if (excludeIds.length > 0) {
        params.append('excludeIds', JSON.stringify(excludeIds));
      }

      if (source) {
        params.append('source', source);
      }

      const response = await api.get(`/api/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Search service error:', error);
      throw error;
    }
  }
};