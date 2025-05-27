import { useCallback, useEffect, useRef } from 'react';
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
  history,
  searchQuery
) {
  // Refs to track latest state values
  const nextSongRef = useRef();
  const queueRef = useRef();

  // Sync refs with current state
  useEffect(() => {
    nextSongRef.current = nextSong;
    queueRef.current = queue;
  }, [nextSong, queue]);

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
      // Collect exclusion IDs using refs for fresh values
      const excludeIds = [
        currentSong?.videoId,
        nextSongRef.current?.videoId,
        ...(queueRef.current || []).map(song => song?.videoId),
        ...(history || []).map(song => song?.videoId)
      ].filter(Boolean);

      // Call service
      let data = [];
      if (searchQuery) {
        data = await searchService({
          query: searchQuery,
          options: { excludeIds, source: 'refresh' }
        });
      } else {
        data = await fetchSongsService({
          channelId,
          excludeIds,
          initial
        });
      }

      // Filter out invalid/null entries
      const validData = data.filter(song => 
        song?.videoId && 
        !excludeIds.includes(song.videoId)
      );

      if (validData.length > 0) {
        if (setAsCurrent) {
          setCurrentSong(validData[0]);
          setNextSong(validData[1] || null);
          setQueue(validData.slice(2));
        } else if (appendToQueue) {
          setQueue(prev => {
            // Get fresh state from refs
            const currentNext = nextSongRef.current;
            const safePrev = (prev || []).filter(Boolean);
            const mergedQueue = [...safePrev, ...validData];

            // Update nextSong only if it's currently null/undefined
            if (!currentNext && mergedQueue.length > 0) {
              setNextSong(mergedQueue[0]);
              return mergedQueue.slice(1);
            }

            return mergedQueue;
          });
        }
      }

      return validData;
    } catch (error) {
      console.error('Error in fetchSongs:', error);
      return [];
    } finally {
      setIsFetchingSongs(false);
    }
  }, [
    currentChannel?._id,
    isFetchingSongs,
    searchQuery,
    setIsFetchingSongs,
    currentSong?.videoId,
    history,
    setCurrentSong,
    setNextSong,
    setQueue
  ]);

  const fetchSongsForChannel = useCallback((channelId) => {
    return fetchSongs({ channelId, appendToQueue: false, setAsCurrent: false, initial: true });
  }, [fetchSongs]);

  const fetchMoreSongs = useCallback((setAsCurrent = false) => {
    fetchSongs({ setAsCurrent, appendToQueue: !setAsCurrent, initial: false });
  }, [fetchSongs]);

  return { 
    fetchSongs,
    fetchSongsForChannel,
    fetchMoreSongs
  };
}