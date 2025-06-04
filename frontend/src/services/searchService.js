import { api } from './apiService';

let searchAbortController = null;

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
  const { excludeIds = [], source = null } = options;

  // Abort previous search if still in flight
  if (searchAbortController) {
    searchAbortController.abort();
  }
  searchAbortController = new AbortController();

  const params = new URLSearchParams();
  params.append('q', query);
  if (excludeIds.length > 0) {
    params.append('excludeIds', JSON.stringify(excludeIds));
  }
  if (source) {
    params.append('source', source);
  }

  // Let AbortError bubble up to caller
  const response = await api.get(`/api/search?${params.toString()}`, {
    signal: searchAbortController.signal,
  });
  return response.data;
};

/**
 * Cancels any in-flight searchService call.
 */
export const cancelSearch = () => {
  if (searchAbortController) {
    searchAbortController.abort();
  }
};
