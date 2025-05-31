import { useState, useCallback } from 'react';

/**
 * Custom hook to handle "Play Favorites" logic.
 *
 * @param {Function} getFavorites
 *   Async function that returns an array of favorite songs.
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
export const useFavoritesHandlers = (getFavorites, {
  setCurrentChannel,
  setCurrentSong,
  setNextSong,
  setQueue,
  setUserInteracted
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetches favorite songs, then updates channel and queue state.
   * If there are no favorite songs, does nothing (but clears loading).
   * On error, sets the local error state and logs to console.
   */
  const playFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const favSongs = await getFavorites();

      if (Array.isArray(favSongs) && favSongs.length > 0) {
        // Use a virtual "Favorites" channel to distinguish from real channels
        setCurrentChannel({ name: 'Favorites', isVirtual: true });
        setCurrentSong(favSongs[0]);
        setNextSong(favSongs[1] || null);
        setQueue(favSongs.slice(2));
        setUserInteracted(true);
      }
      // If favSongs is empty or not an array, do nothing further
    } catch (err) {
      setError(err);
      console.error('Error playing favorites:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    getFavorites,
    setCurrentChannel,
    setCurrentSong,
    setNextSong,
    setQueue,
    setUserInteracted
  ]);

  return {
    playFavorites,
    isLoading,
    error
  };
};
