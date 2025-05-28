import { useState, useCallback } from 'react';

export const useFavoritesHandlers = (getFavorites, setters) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const playFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const favSongs = await getFavorites();
      
      if (favSongs.length > 0) {
        setters.setCurrentChannel({ name: "Favorites", isVirtual: true });
        setters.setCurrentSong(favSongs[0]);
        setters.setNextSong(favSongs[1] || null);
        setters.setQueue(favSongs.slice(2));
        setters.setUserInteracted(true);
      }
    } catch (err) {
      setError(err);
      console.error('Error playing favorites:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getFavorites, setters]);

  return {
    playFavorites,
    isLoading,
    error
  };
};