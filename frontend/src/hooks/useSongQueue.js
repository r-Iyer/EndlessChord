import { useCallback } from 'react';

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
    // Default options
    const {
      channelId = currentChannel?._id,
      setAsCurrent = false,
      appendToQueue = false,
      initial = false,
    } = options;
    
    // Guard clauses - modified to allow null channelId for search
							  
    if (isFetchingSongs) return [];
    if (!channelId && !searchQuery) return []; // Allow null channelId if we have a search query
    
    setIsFetchingSongs(true);

    try {
      // Collect all video IDs to exclude (current song, next song, and queue)
      const excludeIds = [];
      
      // Add current song if available
      if (currentSong?.videoId) {
        excludeIds.push(currentSong.videoId);
      }
      
      // Add next song if available
      if (nextSong?.videoId) {
        excludeIds.push(nextSong.videoId);
      }
      
      // Add all songs from queue
      if (queue && Array.isArray(queue)) {
        queue.forEach(song => {
          if (song?.videoId) {
            excludeIds.push(song.videoId);
          }
        });
      }

            // Add all songs from history
      if (history && Array.isArray(history)) {
        history.forEach(song => {
          if (song?.videoId) {
            excludeIds.push(song.videoId);
          }
        });
      }
      
      // Build query URL - modified to support search
      let queryUrl;
      const params = new URLSearchParams();
      
      if (!channelId) {
        // Search mode
        queryUrl = `/api/search`;
        params.append('q', searchQuery);
      } else {
        // Channel mode
        queryUrl = `/api/channels/${channelId}/songs`;
        if (initial) {
          params.append('source', 'initial');
        }
      }
      
      // Send all excluded IDs to backend
      if (excludeIds.length > 0) {
        params.append('excludeIds', JSON.stringify(excludeIds));
      }
      
      if (params.toString()) {
        queryUrl += `?${params.toString()}`;
      }
      
      // Fetch the data
      const response = await fetch(queryUrl);
      const data = await response.json();
      
      // Handle the results based on options
      if (data.length > 0) {
        if (setAsCurrent) {
          setCurrentSong(data[0]);
          setNextSong(data[1] || null);
          setQueue(data.slice(2));
        } else if (appendToQueue) {
          setQueue(prevQueue => [...prevQueue, ...data]);
        } else {
          return data; // Return data if not updating state
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching songs:', error);
      return [];
    } finally {
      setIsFetchingSongs(false);
    }
  }, [currentChannel, currentSong, nextSong, queue, isFetchingSongs, setCurrentSong, setNextSong, setQueue, setIsFetchingSongs, searchQuery, history]);

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