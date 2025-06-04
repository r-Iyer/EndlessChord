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
 * @param {Function} setters.setCurrentChannel
 *   Sets the current channel object. For favorites, we use a virtual channel.
 * @param {Function} setters.setCurrentSong
 *   Sets the currently playing song.
 * @param {Function} setters.setNextSong
 *   Sets the next song in the queue.
 * @param {Function} setters.setQueue
 *   Sets the remaining song queue (after current & next).
 * @param {Function} setters.setUserInteracted
 *   Marks that the user has initiated interaction (used for analytics or UI).
 *
 * @returns {Object}
 *   - playFavorites: Async function to load & play favorite songs.
 *   - isLoading: Boolean indicating whether favorites are loading.
 *   - error: Any error thrown during `getFavorites`.
 */
export const useFavoritesHandlers = (
  getFavorites,
  {
    setCurrentChannel,
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
   * Fetches favorite songs, then updates channel and queue state.
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

      // If we have favorites, set up the “Favorites” channel & queue
      if (Array.isArray(favSongs) && favSongs.length > 0) {
        setCurrentChannel({ name: 'Favorites', isVirtual: true });
        setCurrentSong(favSongs[0]);
        setNextSong(favSongs[1] || null);
        setQueue(favSongs.slice(2));
        setUserInteracted(true);
        setIsLoading(false);
      }
      // If no favorites, we simply leave playback cleared
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
  }, [getFavorites, setCurrentChannel, setCurrentSong, setIsLoading, setNextSong, setQueue, setUserInteracted]);

  return {
    playFavorites,
    error
  };
};
