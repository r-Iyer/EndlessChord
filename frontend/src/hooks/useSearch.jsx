import { useState, useCallback } from 'react';
import { searchService } from '../services/searchService';

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
      params.delete('channel');
    } else {
      params.delete('search');
    }
    window.history.replaceState({}, '', `?${params.toString()}`);
  }, []);
  
  const getSearchFromURL = useCallback(() => {
    return new URLSearchParams(window.location.search).get('search');
  }, []);
  
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) return;
    
    try {
      // Reset states
      setUserInteracted(true);
      setBackendError(false);
      setIsPlaying(false);
      setIsLoading(true);
      setCurrentChannel(null);
      setSearchQuery(query);
      setIsSearchMode(true);
      setSearchInURL(query);
      
      // Clear current playback
      setCurrentSong(null);
      setNextSong(null);
      setQueue([]);
      
      // Use search service
      const songs = await searchService.searchSongs(query, {
        source: 'initial'
      });
      
      // Update playback state
      if (songs?.length > 0) {
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