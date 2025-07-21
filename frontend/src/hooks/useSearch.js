import { useState, useCallback, useRef } from 'react';
import { cancelFetchSongs } from '../services/songService';
import { searchService } from '../services/searchService';
import { INITIAL } from '../constants/constants';

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
 * @param {Function} setCurrentSelection - Clears or sets the current selection (we clear it on search).
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
  setCurrentSelection
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Ref to track the latest search call so we can ignore stale results
  const callIdRef = useRef(0);

/**
 * Updates (or removes) the `?search=` parameter in the URL.
 * Also removes `songId` param if present. Leaves other params intact.
 */
const setSearchInURL = useCallback((query) => {
  const params = new URLSearchParams(window.location.search);

  params.delete('songId'); // always remove songId
  if (query) {
    params.set('search', query);
    params.delete('channel'); // optionally clear channel
  } else {
    params.delete('search');
  }

  const queryString = params.toString();
  const newUrl = queryString
    ? `${window.location.pathname}?${queryString}`
    : window.location.pathname;

  window.history.replaceState({}, '', newUrl);
}, []);


  /**
   * Reads the current `?search=` value from the URL (if any).
   */
  const getSearchFromURL = useCallback(() => {
    return new URLSearchParams(window.location.search).get('search');
  }, []);

  /**
   * Initiates a new search:
   *  1. Trims the query. If empty, do nothing.
   *  2. Cancel any in-flight song requests (aka cancelFetchSongs).
   *  3. Bump callIdRef so that any old search results become “stale.”
   *  4. Enter “search mode,” update URL, clear channel & playback state, set loading = true.
   *  5. Await searchService(...). If this call is still the latest, populate currentSong/nextSong/queue.
   *  6. In case of AbortError/CanceledError, bail quietly (no error flag, no loading toggle).
   *  7. In case of a genuine error, set backendError = true.
   *  8. Finally, if this call is still the latest _and_ we remain in search mode, set loading = false.
   */
  const handleSearch = useCallback(
    async (query) => {
      const trimmed = query.trim();
      if (!trimmed) {
        return;
      }

      // Cancel any in-flight song fetch first
      cancelFetchSongs();

      // Bump callId so that any previous/ongoing search becomes stale
      callIdRef.current += 1;
      const thisCallId = callIdRef.current;

      // Enter “search mode” and update URL
      setUserInteracted(true);
      setBackendError(false);
      setIsPlaying(false);
      setIsLoading(true);

      setCurrentSelection(null);
      setSearchQuery(trimmed);
      setIsSearchMode(true);
      setSearchInURL(trimmed);

      // Clear any existing playback state
      setCurrentSong(null);
      setNextSong(null);
      setQueue([]);

      try {
        // Fire off the actual search
        const songs = await searchService({
          query: trimmed,
          options: {
            excludeIds: [],
            source: INITIAL,
          },
        });

        // If, in the meantime, another search has started, bail
        if (thisCallId !== callIdRef.current) {
          return;
        }

        // Populate playback state from search results
        if (Array.isArray(songs) && songs.length > 0) {
          setCurrentSong(songs[0]);
          setNextSong(songs[1] || null);
          setQueue(songs.slice(2));
        }
        setIsLoading(false);
      } catch (error) {
        // If the search was canceled by cancelFetchSongs, just bail quietly
        if (error.name === 'CanceledError' || error.name === 'AbortError') {
          return;
        }

        // Otherwise, it’s a genuine failure
        console.error('Search failed:', error);
        setBackendError(true);
      } finally {
        // Only clear loading if this call is still the latest AND we remain in search mode
        if (thisCallId === callIdRef.current && isSearchMode) {
          setIsLoading(false);
        }
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
      setCurrentSelection,
      setSearchInURL,
      isSearchMode,
    ]
  );

  /**
   * Clears the search state entirely:
   *  • Empties the searchQuery
   *  • Exits search mode
   *  • Removes `?search=` from the URL
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
