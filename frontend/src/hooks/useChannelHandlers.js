import { useCallback, useRef, useEffect } from 'react';
import { cancelSearch } from '../services/searchService';

/**
 * Custom hook to handle channel selection and URL synchronization.
 *
 * @param {Function} setUserInteracted - Marks that the user interacted (e.g., clicked).
 * @param {Function} setBackendError - Flags when a backend error occurs.
 * @param {Function} setIsPlaying - Toggles playback state.
 * @param {Function} setCurrentSong - Sets the currently playing song.
 * @param {Function} setNextSong - Sets the next song in the queue.
 * @param {Function} setQueue - Sets the remaining song queue.
 * @param {Function} setHistory - Clears or updates play history when channel changes.
 * @param {Function} setIsLoading - Toggles loading state for channel changes.
 * @param {Function} setIsFetchingSongs – Setter to toggle isFetchingSongs.
 * @param {Function} setCurrentChannel - Updates the current channel object.
 * @param {Function} fetchChannelById - Async function to fetch channel by its ID or name.
 * @param {Function} fetchSongsForChannel - Async function to fetch songs given a channel ID.
 * @param {Object|null} currentChannel - The currently selected channel.
 * @param {Array<Object>} channels - List of all available channels (may include { _id, name, ... }).
 *
 * @returns {Object} 
 *   - setChannelNameInURL: (channelName: string) => void  
 *       Updates the browser URL to include `?channel=<channel-name>`.  
 *   - selectChannel: async (channelIdOrName: string) => void  
 *       Orchestrates selecting a channel by ID or slugified name:  
 *       resets relevant UI state, fetches channel data and songs, updates state, handles errors.
 */
export default function useChannelHandlers(
  setUserInteracted,
  setBackendError,
  setIsPlaying,
  setCurrentSong,
  setNextSong,
  setQueue,
  setHistory,
  setIsLoading,
  setIsFetchingSongs,
  setCurrentChannel,
  fetchChannelById,
  fetchSongsForChannel,
  currentChannel,
  channels
) {
  const callIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Updates the browser's URL query string to include or remove the `channel` parameter.
   * If `channelName` is falsy, removes the parameter entirely.
   */
  const setChannelNameInURL = useCallback((channelName) => {
    const params = new URLSearchParams(window.location.search);

    if (channelName) {
      params.set('channel', channelName);
    } else {
      params.delete('channel');
    }

    const queryString = params.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, []);

  /**
   * Handles user-initiated channel selection.
   *
   * 1. Marks that the user interacted and resets any previous error flags.
   * 2. Stops playback and clears current song/queue/history.
   * 3. Sets a loading state while fetching channel data and songs.
   * 4. Attempts to resolve `channelIdOrName` to a channel object:
   *    - If `channels` list is non-empty and `channelIdOrName` isn't a 24-hex ID, tries matching by slugified name or _id.
   *    - Otherwise, calls `fetchChannelById(channelIdOrName)`.
   * 5. If the new channel is the same as `currentChannel`, simply clears loading.
   * 6. Updates URL, sets `currentChannel`, fetches songs via `fetchSongsForChannel`.
   * 7. If songs exist, places the first in `currentSong`, second in `nextSong`, rest in `queue`.
   *    If no songs, ensures playback is stopped and queue is empty.
   * 8. On any error (network, missing channel, etc.), sets the backend error flag and resets playback state.
   * 9. Finally, clears the loading flag.
   */
  const selectChannel = useCallback(
    async (channelIdOrName) => {
      // Cancel any previous requests
      cancelSearch();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const signal = abortController.signal;

      callIdRef.current += 1;
      const callId = callIdRef.current;
      const isStale = () => callId !== callIdRef.current || signal.aborted;

      // Reset playback and state
      setUserInteracted(true);
      setBackendError(false);
      setIsPlaying(false);
      setCurrentSong(null);
      setNextSong(null);
      setQueue([]);
      setHistory([]); // Clear play history when switching channels
      setIsLoading(true);
      setIsFetchingSongs(true);

      try {
        let channelData = null;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(channelIdOrName);
        const slugify = (name) => name.replace(/\s+/g, '-').toLowerCase();

        // Resolving from loaded channels
        if (channels.length > 0) {
          channelData = channels.find((c) =>
            isObjectId
              ? c._id === channelIdOrName
              : slugify(c.name) === slugify(channelIdOrName)
          );
        }

        // Only fetch from API if channels are not loaded or not found
        if (!channelData && channels.length === 0) {
          try {
            channelData = await fetchChannelById(channelIdOrName, { signal });
          } catch (error) {
            if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
              throw error;
            }
            return; // Exit silently on abort
          }
        }

        if (isStale()) return;

        // Validate channel
        if (!channelData?._id) {
          throw new Error(`Channel "${channelIdOrName}" not found`);
        }

        // Update channel and URL
        setCurrentChannel(channelData);
        setChannelNameInURL(slugify(channelData.name));

        // Fetch songs with cancellation support
        let songs = [];
        try {
          songs = await fetchSongsForChannel(channelData._id, { signal });
        } catch (error) {
          if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
            throw error;
          }
          return; // Exit silently on abort
        }

        if (isStale()) return;

        // Update state with new songs
        if (Array.isArray(songs) && songs.length > 0) {
          setCurrentSong(songs[0]);
          setNextSong(songs[1] || null);
          setQueue(songs.slice(2));
          setIsPlaying(false);
        } else {
          setIsPlaying(false);
        }
      } catch (error) {
        if (!isStale()) {
          console.error('Channel selection error:', error);
          setBackendError(true);
          setIsPlaying(false);
        }
      } finally {
        if (!isStale()) {
          setIsFetchingSongs(false);
          setIsLoading(false);
        }
      }
    },
    [setUserInteracted, setBackendError, setIsPlaying, setCurrentSong, setNextSong, setQueue, setHistory, setIsLoading, setIsFetchingSongs, setCurrentChannel, fetchChannelById, fetchSongsForChannel, channels, setChannelNameInURL]
  );

  return {
    setChannelNameInURL,
    selectChannel,
  };
}
