import { useState, useCallback, useRef } from 'react';
import { cancelFetchSongs } from '../services/songService';
import { cancelSearch } from '../services/searchService';

/**
 * Custom hook for managing “Play Favorites” logic.
 *
 * @param {Function} getFavorites
 *   Async function that returns an array of favorite songs (accepts an optional AbortSignal).
 *
 * @param {Object} setters
 * @param {Function} setters.setCurrentSelection
 *   Sets the current selection object. For favorites, we use a virtual channel type.
 * @param {Function} setters.setCurrentSong
 *   Sets the currently playing song.
 * @param {Function} setters.setNextSong
 *   Sets the next song in the queue.
 * @param {Function} setters.setQueue
 *   Sets the remaining song queue (after current & next).
 * @param {Function} setters.setUserInteracted
 *   Marks that the user has initiated interaction (used for analytics or UI).
 * @param {Function} setters.setIsLoading
 *   Shows a loading indicator while favorites are being fetched.
 *
 * @returns {Object}
 *   - playFavorites: Async function to load & play favorite songs.
 *   - error: Any error thrown during `getFavorites`.
 */
export const useFavoritesHandlers = (
  getFavorites,
  {
    setCurrentSelection,
    setCurrentSong,
    setNextSong,
    setQueue,
    setUserInteracted,
    setIsLoading,
  }
) => {
  const [error, setError] = useState(null);

  // If getFavorites itself supports cancellation, store its controller here
  const favoritesAbortRef = useRef(null);

  /**
   * Fetches favorite songs, then updates selection and queue state.
   * If there are no favorite songs, does nothing (but clears loading).
   * On error, sets the local error state and logs to console.
   */
  const playFavorites = useCallback(async () => {
    // Cancel any in‐flight search call:
    cancelSearch();

    // Cancel any in‐flight song fetch:
    cancelFetchSongs();

    // If there's an in‐flight getFavorites, abort it
    if (favoritesAbortRef.current) {
      favoritesAbortRef.current.abort();
    }

    const controller = new AbortController();
    favoritesAbortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      //  Fetch favorite songs (pass signal if supported)
      const favSongs = await getFavorites(controller.signal);

      // If this fetch was aborted, bail silently
      if (controller.signal.aborted) return;

      // If we have favorites, set up the “Favorites” virtual channel & queue
      if (Array.isArray(favSongs) && favSongs.length > 0) {

        // Set currentSelection to virtual Favorites channel
        setCurrentSelection({
          type: 'channel',
          channel: { name: 'Favorites', isVirtual: true },
          album: null
        });

        // Clear previous playback before setting new songs
        setCurrentSong(null);
        setNextSong(null);
        setQueue([]);

        // Now set new songs
        setCurrentSong(favSongs[0]);
        setNextSong(favSongs[1] || null);
        setQueue(favSongs.slice(2));

        setUserInteracted(true);
      }

    } catch (err) {
      // If getFavorites threw because of abort, do nothing
      if (err.name === 'AbortError') {
        return;
      }

      // Otherwise it’s a real error
      console.error('Error playing favorites:', err);
      setError(err);
    } finally {
      // Only clear loading if this call wasn’t aborted
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
      favoritesAbortRef.current = null;
    }
  }, [
    getFavorites,
    setCurrentSelection,
    setCurrentSong,
    setNextSong,
    setQueue,
    setUserInteracted,
    setIsLoading
  ]);

  return {
    playFavorites,
    error
  };
};
