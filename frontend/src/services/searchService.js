import { api } from './apiService';

/**
 * Search service to query songs or content with optional exclusions and source metadata.
 *
 * @param {Object} params
 * @param {string} params.query - The search query string.
 * @param {Object} [params.options={}] - Additional options for the search.
 * @param {Array<string>} [params.options.excludeIds=[]] - Array of song IDs to exclude from results.
 * @param {string|null} [params.options.source=null] - Optional source identifier for tracking.
 * @returns {Promise<Array>} - Resolves with the search results array.
 * @throws Throws error if the request fails.
 */
export const searchService = async ({ query, options = {} }) => {
  try {
    const { excludeIds = [], source = null } = options;
    const params = new URLSearchParams();

    params.append('q', query);

    if (excludeIds.length > 0) {
      // Send excludeIds as JSON string to backend for filtering
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
};
