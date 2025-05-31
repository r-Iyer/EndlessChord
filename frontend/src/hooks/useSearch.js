import { useState, useCallback } from 'react';
import { searchService } from '../services/searchService';

/**
 * Custom hook for managing search functionality:
 *  - Keeps track of the current search query and mode.
 *  - Synchronizes the `search` query parameter in the URL.
 *  - Clears existing playback and channel state when performing a search.
 *  - Updates current song, next song, and queue based on search results.
 *
 * @param {Function} setUserInteracted - Marks that the user has interacted (used for analytics or UI).
 * @param {Function} setBackendError - Flags when a backend error occurs.
 * @param {Function} setIsPlaying - Toggles playback state.
 * @param {Function} setCurrentSong - Sets the currently playing song.
 * @param {Function} setNextSong - Sets the next song in the queue.
 * @param {Function} setQueue - Sets the remaining song queue.
 * @param {Function} setIsLoading - Toggles loading state for network calls.
 * @param {Function} setCurrentChannel - Clears or sets the current channel (we clear it on search).
 *
 * @returns {Object}
 *   - searchQuery: The current search input string.
 *   - isSearchMode: Boolean indicating whether we're in “search mode” (vs. browsing channels).
 *   - handleSearch: Async function to initiate a new search given a query string.
 *   - clearSearch: Function to exit search mode and clear the query (removes `search` from URL).
 *   - getSearchFromURL: Reads the `search` parameter from the URL, if present.
 */
export default function useSearch(
  setUserInteracted,
  setBackendError,
  setIsPlaying,
  setCurrentSong,
  setNextSong,
  setQueue,
  setIsLoading,
  setCurrentChannel
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  /**
   * Updates the URL to include `?search=<query>`. Removes `channel` param if present.
   * If `query` is an empty string, removes `search` from the URL entirely.
   */
  const setSearchInURL = useCallback((query) => {
    const params = new URLSearchParams(window.location.search);

    if (query) {
      params.set('search', query);
      params.delete('channel');
    } else {
      params.delete('search');
    }

    // Build the new path (without a leading “?” if there are no params)
    const queryString = params.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, []);

  /**
   * Reads the current `search` parameter from the URL (or returns null if absent).
   */
  const getSearchFromURL = useCallback(() => {
    return new URLSearchParams(window.location.search).get('search');
  }, []);

  /**
   * Initiates a new search:
   * 1. Ignores empty or whitespace-only queries.
   * 2. Marks user interaction and clears any previous backend errors.
   * 3. Stops playback, clears current channel, and sets loading state.
   * 4. Updates local `searchQuery` and enters search mode.
   * 5. Clears existing playback (currentSong, nextSong, queue).
   * 6. Calls `searchService` with the query.
   *    - If results are returned, updates `currentSong`, `nextSong`, and `queue`.
   *    - If no results, leaves playback cleared (no song will play).
   * 7. On error, flags backend error for UI to handle.
   * 8. Finally, clears the loading state.
   */
  const handleSearch = useCallback(
    async (query) => {
      const trimmed = query.trim();
      if (!trimmed) {
        return;
      }

      try {
        setUserInteracted(true);
        setBackendError(false);
        setIsPlaying(false);
        setIsLoading(true);

        // Clear any channel context when doing a search
        setCurrentChannel(null);

        // Enter search mode and sync URL
        setSearchQuery(trimmed);
        setIsSearchMode(true);
        setSearchInURL(trimmed);

        // Clear existing playback
        setCurrentSong(null);
        setNextSong(null);
        setQueue([]);

        // Perform the actual search
        const songs = await searchService({
          query: trimmed,
          options: {
            excludeIds: [],
            source: 'initial',
          },
        });

        // If searchService returns an array of songs, update playback state
        if (Array.isArray(songs) && songs.length > 0) {
          setCurrentSong(songs[0]);
          setNextSong(songs[1] || null);
          setQueue(songs.slice(2));
        }
      } catch (error) {
        console.error('Search failed:', error);
        setBackendError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [
      setUserInteracted,
      setBackendError,
      setIsPlaying,
      setCurrentSong,
      setNextSong,
      setQueue,
      setIsLoading,
      setCurrentChannel,
      setSearchInURL,
    ]
  );

  /**
   * Clears search mode:
   * 1. Resets the local query state.
   * 2. Exits search mode.
   * 3. Removes `search` from the URL.
   * Note: This does not automatically restore a “default” channel; the
   *       consumer should handle re-selecting a channel if needed.
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearchMode(false);
    setSearchInURL('');
  }, [setSearchInURL]);

  return {
    searchQuery,
    isSearchMode,
    handleSearch,
    clearSearch,
    getSearchFromURL,
  };
}
