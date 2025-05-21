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
      initial = isInitialLoad,
      setAsCurrent = false,
      appendToQueue = false
    } = options;
    
    // Guard clauses
    if (!channelId) return [];
    if (isFetchingSongs) return [];
    
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
      
      // Build query URL
      let queryUrl = `/api/channels/${channelId}/songs`;
      const params = new URLSearchParams();
      
      if (initial) {
        params.append('source', 'initial');
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
      
      /*// If this was an initial load, update the flag
      if (initial && isInitialLoad) {
        setIsInitialLoad(false);
      }*/
    }
  }, [currentChannel, currentSong, nextSong, queue, isFetchingSongs, isInitialLoad, setCurrentSong, setNextSong, setQueue, setIsFetchingSongs]);

  // For backward compatibility and convenience
  const fetchSongsForChannel = useCallback((channelId) => {
    return fetchSongs({ channelId, appendToQueue: false, setAsCurrent: false });
  }, [fetchSongs]);

  const fetchMoreSongs = useCallback((setAsCurrent = false) => {
    fetchSongs({ setAsCurrent, appendToQueue: !setAsCurrent });
  }, [fetchSongs]);

  return { 
    fetchSongs,
    fetchSongsForChannel, // Kept for backward compatibility
    fetchMoreSongs        // Kept for backward compatibility
  };
}