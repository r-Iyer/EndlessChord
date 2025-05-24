import { useCallback } from 'react';
import { fetchSongsService } from '../services/songService';
import { searchService } from '../services/searchService';

export default function useSongQueue(
  currentChannel,
  currentSong,
  setCurrentSong,
  nextSong,
  setNextSong,
  queue,
  setQueue,
  isFetchingSongs,
  setIsFetchingSongs,
  isInitialLoad,
  setIsInitialLoad,
  history,
  searchQuery // Added search query parameter
) {
  /**
  * Fetches songs for a channel with various options
  * @param {Object} options - Configuration options
  * @param {string|null} options.channelId - Channel ID to fetch songs for (uses currentChannel._id if not provided)
  * @param {boolean} options.initial - Whether this is an initial load
  * @param {boolean} options.setAsCurrent - Whether to set the first result as current song
  * @param {boolean} options.appendToQueue - Whether to append results to existing queue
  * @returns {Promise<Array>} - Array of songs (only if not setting as current or appending)
  */
  const fetchSongs = useCallback(async (options = {}) => {
    const {
      channelId = currentChannel?._id,
      setAsCurrent = false,
      appendToQueue = false,
      initial = false,
    } = options;
    
    if (isFetchingSongs) return [];
    if (!channelId && !searchQuery) return [];
    
    setIsFetchingSongs(true);
    
    try {
      // Collect exclusion IDs
      const excludeIds = [
        currentSong?.videoId,
        nextSong?.videoId,
        ...(queue || []).map(song => song?.videoId),
        ...(history || []).map(song => song?.videoId)
      ].filter(Boolean);
      
      // Call service
      let data = [];
      if(searchQuery) {
        await searchService.searchSongs(searchQuery, {
          excludeIds: excludeIds
        });
      }
      else {
        data = await fetchSongsService({
          channelId,
          excludeIds,
          initial
        });
      }
      
      // Handle response
      if (data.length > 0) {
        if (setAsCurrent) {
          setCurrentSong(data[0]);
          setNextSong(data[1] || null);
          setQueue(data.slice(2));
        } else if (appendToQueue) {
          setQueue(prev => [...prev, ...data]);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error in fetchSongs:', error);
      return [];
    } finally {
      setIsFetchingSongs(false);
    }
  }, [currentChannel?._id, isFetchingSongs, searchQuery, setIsFetchingSongs, currentSong?.videoId, nextSong?.videoId, queue, history, setCurrentSong, setNextSong, setQueue]);
  
  // For backward compatibility and convenience
  const fetchSongsForChannel = useCallback((channelId) => {
    return fetchSongs({ channelId, appendToQueue: false, setAsCurrent: false, initial: true });
  }, [fetchSongs]);
  
  const fetchMoreSongs = useCallback((setAsCurrent = false) => {
    fetchSongs({ setAsCurrent, appendToQueue: !setAsCurrent, initial: false  });
  }, [fetchSongs]);
  
  return { 
    fetchSongs,
    fetchSongsForChannel,
    fetchMoreSongs
  };
}