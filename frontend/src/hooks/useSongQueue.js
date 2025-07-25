import { useEffect, useCallback, useRef } from 'react';
import {
  fetchSongsService,
  cancelFetchSongs,
} from '../services/songService';
import { searchService, cancelSearch } from '../services/searchService';
import { INITIAL, REFRESH } from '../constants/constants';

/**
* Hook to manage the song queue, including fetching new songs from either
* a channel or a search query, while ensuring no duplicates and respecting
* the current playback history.
*
* @param {Object|null} setCurrentSelection
*   The currently selected object. Expected to have an `_id` property.
*
* @param {Object|null} currentSong
*   The currently playing song object. Expected to have a `videoId` property.
*
* @param {Function} setCurrentSong
*   Setter to update the currentSong.
*
* @param {Object|null} nextSong
*   The next song in the queue. Expected to have a `videoId` property.
*
* @param {Function} setNextSong
*   Setter to update the nextSong.
*
* @param {Array<Object>} queue
*   Array of upcoming song objects (each with a `videoId`).
*
* @param {Function} setQueue
*   Setter to update the queue array.
*
* @param {boolean} isFetchingSongs
*   True if a fetch operation is currently in progress.
*
* @param {Function} setIsFetchingSongs
*   Setter to toggle the isFetchingSongs flag.
*
* @param {Array<Object>} history
*   Array of previously played song objects (each with a `videoId`).
*
* @param {string} searchQuery
*   Current search query string (if in search mode). If nonempty, songs
*   are fetched via searchService rather than channel.
*
* @returns {Object}
*   - fetchSongs: Async function to fetch songs (options: channelId, setAsCurrent, appendToQueue, initial).
*   - fetchSongsForChannel: Function to fetch songs for a specific channel (initial load).
*   - fetchMoreSongs: Function to fetch or append more songs to the queue.
*/
export default function useSongQueue(
  currentSelection,
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
  // Refs to always grab latest values inside async callbacks
  const nextSongRef = useRef(nextSong);
  const queueRef = useRef(queue);
  const searchQueryRef = useRef(searchQuery);
  
  // Ref to prevent overlapping fetchSongs calls
  const ongoingFetchRef = useRef(false);
  
  useEffect(() => {
    nextSongRef.current = nextSong;
    queueRef.current = queue;
    searchQueryRef.current = searchQuery;
  }, [nextSong, queue, searchQuery]);
  
  /**
  * Core function to fetch songs. Depending on whether searchQueryRef.current
  * is nonempty, it calls the searchService or fetchSongsService. It excludes
  * any video IDs already in currentSong, nextSongRef, queueRef, or history.
  *
  * Options:
  * - channelId: string (defaults to currentSelection?.channel?._id)
  * - setAsCurrent: boolean   → if true, update currentSong & nextSong & queue
  * - appendToQueue: boolean  → if true, append results to existing queue
  * - initial: boolean        → if true, indicates initial load (used by fetchSongsService)
  *
  * Returns an array of valid song objects (possibly empty).
  */
  const fetchSongs = useCallback(
    async (options = {}) => {
      const {
        channelId = currentSelection?.channel?._id,
        setAsCurrent = false,
        appendToQueue = false,
        initial = false,
      } = options;
      
      // For non-initial loads: skip if already fetching
      if (!initial && ongoingFetchRef.current) {
        return [];
      }
      
      // For initial load: cancel ongoing fetches before proceeding
      if (initial && ongoingFetchRef.current) {
        cancelFetchSongs();
        cancelSearch();
      }
      
      // If no channel and no search, nothing to fetch
      if (!channelId && !searchQueryRef.current) {
        return [];
      }
      
      ongoingFetchRef.current = true;
      setIsFetchingSongs(true);
      
      try {
        // Build excludeIds from currentSong, nextSong, queue, history
        const excludeIds = [
          currentSong?.videoId,
          nextSongRef.current?.videoId,
          ...(queueRef.current || []).map((song) => song?.videoId),
          // only spread history when initial is false
          ...(!initial
            ? (history || []).map((song) => song?.videoId)
            : []),
          ].filter(Boolean);
          
          
          let data = [];
          let source = initial ? INITIAL : REFRESH;
          
          if (searchQueryRef.current) {
            // Cancel any in-flight channel fetch before performing a new search
            cancelFetchSongs();
            
            try {
              data = await searchService({
                query: searchQueryRef.current,
                options: { excludeIds, source },
              });
            } catch (error) {
              // If search was canceled, return early (no change)
              if (error.name === 'CanceledError' || error.name === 'AbortError') {
                return [];
              }
              throw error;
            }
          } else {
            // Cancel any in-flight search fetch before fetching channel songs
            cancelSearch();
            
            try {
              data = await fetchSongsService({
                channelId,
                excludeIds,
                source,
              });
            } catch (error) {
              // If channel fetch was canceled, return early
              if (error.name === 'CanceledError' || error.name === 'AbortError') {
                return [];
              }
              throw error;
            }
          }
          
          // Filter out any invalid or already-excluded entries
          const validData = Array.isArray(data)
          ? data.filter((song) => song?.videoId && !excludeIds.includes(song.videoId))
          : [];
          
          if (validData.length > 0) {
            if (setAsCurrent) {
              setCurrentSong(validData[0]);
              setNextSong(validData[1] || null);
              setQueue(validData.slice(2));
            } else if (appendToQueue) {
              setQueue((prevQueue) => {
                const existingQueue = Array.isArray(prevQueue)
                ? prevQueue.filter(Boolean)
                : [];
                const mergedQueue = [...existingQueue, ...validData];
                
                // If nextSong was null, promote the first new item
                const currentNext = nextSongRef.current;
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
          ongoingFetchRef.current = false;
          setIsFetchingSongs(false);
        }
      },
      [currentSelection?.channel?._id, currentSong?.videoId, history, setCurrentSong, setNextSong, setQueue, setIsFetchingSongs]
    );
    
    const fetchSongsForChannel = useCallback(
      (channelId) => {
        return fetchSongs({
          channelId,
          setAsCurrent: false,
          appendToQueue: false,
          initial: true,
        });
      },
      [fetchSongs]
    );
    
    /**
    * Shorthand to fetch more songs:
    * - If `setAsCurrent` is true, replace the currentSong/nextSong/queue with fresh results.
    * - Otherwise, append results to the existing queue.
    *
    * @param {boolean} setAsCurrent
    * @returns {void}
    */
    const fetchMoreSongs = useCallback(
      (setAsCurrent = false) => {
        fetchSongs({
          setAsCurrent,
          appendToQueue: !setAsCurrent,
          initial: false,
        });
      },
      [fetchSongs]
    );
    
    return {
      fetchSongs,
      fetchSongsForChannel,
      fetchMoreSongs,
    };
  }
