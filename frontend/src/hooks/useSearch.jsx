import { useState, useCallback } from 'react';

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

  const setSearchInURL = useCallback((query) => {
    const params = new URLSearchParams(window.location.search);
    
    if (query) {
      params.set('search', query);
      // Remove channel parameter if we're in search mode
      params.delete('channel');
    } else {
      params.delete('search');
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, []);

  const getSearchFromURL = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('search');
  }, []);

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) return;
    
    setUserInteracted(true);
    setBackendError(false);
    setIsPlaying(false);
    setCurrentSong(null);
    setNextSong(null);
    setQueue([]);
    setIsLoading(true);
    setCurrentChannel(null); // Clear current channel as we're searching across all
    setSearchQuery(query);
    setIsSearchMode(true);
    
    // Update URL to show search parameter
    setSearchInURL(query);
    
    try {
      // Build the search URL with query parameters
      const queryUrl = `/api/search?q=${encodeURIComponent(query)}&custom=true`;
      
      const response = await fetch(queryUrl);
      const songs = await response.json();
      
      if (songs && songs.length > 0) {
        setCurrentSong(songs[0]);
        setNextSong(songs[1] || null);
        setQueue(songs.slice(2));
      } else {
        setCurrentSong(null);
        setNextSong(null);
        setQueue([]);
      }
    } catch (error) {
      console.error('Error searching songs:', error);
      setBackendError(true);
    } finally {
      setIsLoading(false);
    }
  }, [
    setUserInteracted, 
    setBackendError, 
    setIsPlaying, 
    setCurrentSong, 
    setNextSong, 
    setQueue, 
    setIsLoading, 
    setCurrentChannel,
    setSearchInURL
  ]);

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
    getSearchFromURL
  };
}