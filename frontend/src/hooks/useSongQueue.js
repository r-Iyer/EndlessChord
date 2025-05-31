import { useEffect, useCallback, useRef } from 'react';
import { fetchSongsService } from '../services/songService';
import { searchService } from '../services/searchService';

/**
 * Hook to manage the song queue, including fetching new songs from either
 * a channel or a search query, while ensuring no duplicates and respecting
 * the current playback history.
 *
 * @param {Object|null} currentChannel
 *   The currently selected channel object. Expected to have an `_id` property.
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
  // We use refs to always access up-to-date values inside async callbacks
  const nextSongRef = useRef(nextSong);
  const queueRef = useRef(queue);
  const searchQueryRef = useRef(searchQuery);

  // Keep refs in sync whenever these state values change
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
   * - channelId: string (defaults to currentChannel?._id)
   * - setAsCurrent: boolean   → if true, update currentSong & nextSong & queue
   * - appendToQueue: boolean  → if true, append results to existing queue
   * - initial: boolean        → if true, indicates initial load (used by fetchSongsService)
   *
   * Returns an array of valid song objects (possibly empty).
   */
  const fetchSongs = useCallback(
    async (options = {}) => {
      const {
        channelId = currentChannel?._id,
        setAsCurrent = false,
        appendToQueue = false,
        initial = false,
      } = options;

      // Prevent multiple concurrent fetches
      if (isFetchingSongs) {
        return [];
      }

      // If neither channelId nor searchQuery is available, nothing to fetch
      if (!channelId && !searchQueryRef.current) {
        return [];
      }

      setIsFetchingSongs(true);

      try {
        // Build exclusion list of videoIds from currentSong, nextSong, queue, and history
        const excludeIds = [
          currentSong?.videoId,
          nextSongRef.current?.videoId,
          ...(queueRef.current || []).map((song) => song?.videoId),
          ...(history || []).map((song) => song?.videoId),
        ]
          .filter(Boolean);

        // Fetch data via searchService if a search query exists; otherwise via channel
        let data = [];
        if (searchQueryRef.current) {
          data = await searchService({
            query: searchQueryRef.current,
            options: { excludeIds, source: 'refresh' },
          });
        } else {
          data = await fetchSongsService({
            channelId,
            excludeIds,
            initial,
          });
        }

        // Filter out any invalid or already-excluded entries
        const validData = Array.isArray(data)
          ? data.filter(
              (song) =>
                song?.videoId &&
                !excludeIds.includes(song.videoId)
            )
          : [];

        if (validData.length > 0) {
          if (setAsCurrent) {
            // Replace currentSong / nextSong / queue
            setCurrentSong(validData[0]);
            setNextSong(validData[1] || null);
            setQueue(validData.slice(2));
          } else if (appendToQueue) {
            // Append new songs to existing queue
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
        setIsFetchingSongs(false);
      }
    },
    [
      currentChannel?._id,
      currentSong?.videoId,
      history,
      isFetchingSongs,
      setCurrentSong,
      setNextSong,
      setQueue,
      setIsFetchingSongs,
    ]
  );

  /**
   * Shorthand to fetch songs for a given channel ID, treating it as an initial load.
   * This will replace currentSong/nextSong/queue with what the service returns.
   *
   * @param {string} channelId
   * @returns {Promise<Array<Object>>} The array of songs fetched.
   */
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
