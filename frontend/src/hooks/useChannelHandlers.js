import { useCallback } from 'react';

/**
 * Custom hook to handle channel selection and URL synchronization.
 *
 * @param {Function} setUserInteracted - Marks that the user interacted (e.g., clicked).
 * @param {Function} setBackendError - Flags when a backend error occurs.
 * @param {Function} setIsPlaying - Toggles playback state.
 * @param {Function} setCurrentSong - Sets the currently playing song.
 * @param {Function} setNextSong - Sets the next song in the queue.
 * @param {Function} setQueue - Sets the remaining song queue.
 * @param {Function} setIsLoading - Toggles loading state for channel changes.
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
  setIsLoading,
  setCurrentChannel,
  fetchChannelById,
  fetchSongsForChannel,
  currentChannel,
  channels
) {
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

    // If there are no other query params, remove the trailing "?"
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
   * 2. Stops playback and clears current song/queue.
   * 3. Sets a loading state while fetching channel data and songs.
   * 4. Attempts to resolve `channelIdOrName` to a channel object:
   *    - If `channels` list is non-empty and `channelIdOrName` isn't a 24-hex ID, tries matching by slugified name.
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
      setUserInteracted(true);
      setBackendError(false);

      // Stop any current playback and clear song references
      setIsPlaying(false);
      setCurrentSong(null);
      setNextSong(null);
      setQueue([]);

      setIsLoading(true);

      try {
        let channelData = null;

        // If we have a channel list and the identifier is not a 24-hex string,
        // try to match against slugified names in `channels`.
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(channelIdOrName);
        const slug = (name) => name.replace(/\s+/g, '-').toLowerCase();

        if (
          channels.length > 0 &&
          typeof channelIdOrName === 'string' &&
          !isObjectId
        ) {
          channelData = channels.find(
            (c) =>
              slug(c.name) === slug(channelIdOrName)
          );
        }

        // If not found or provided a direct ID, fetch from backend
        if (!channelData) {
          channelData = await fetchChannelById(channelIdOrName);
        }

        // If backend returned null/undefined, treat as error
        if (!channelData || !channelData._id) {
          throw new Error(`Channel "${channelIdOrName}" not found.`);
        }

        // If the user clicked on the same channel currently selected, no further fetch needed
        if (currentChannel && currentChannel._id === channelData._id) {
          setIsLoading(false);
          return;
        }

        // Update global state with the new channel
        setCurrentChannel(channelData);

        // Update the URL to reflect the selected channel (slugify the name)
        setChannelNameInURL(slug(channelData.name));

        // Fetch songs for this channel; expect an array (possibly empty)
        const songs = await fetchSongsForChannel(channelData._id);

        if (Array.isArray(songs) && songs.length > 0) {
          // First song → now playing; second → next; rest → queue
          setCurrentSong(songs[0]);
          setNextSong(songs[1] || null);
          setQueue(songs.slice(2));
        } else {
          // No songs available: clear playback and queue
          setCurrentSong(null);
          setNextSong(null);
          setQueue([]);
          setIsPlaying(false);
        }
      } catch (error) {
        console.error('Error selecting channel:', error);
        setBackendError(true);

        // Reset playback state on error
        setCurrentSong(null);
        setNextSong(null);
        setQueue([]);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    },
    [
      setUserInteracted,
      setBackendError,
      setIsPlaying,
      setCurrentSong,
      setNextSong,
      setQueue,
      setIsLoading,
      channels,
      currentChannel,
      setCurrentChannel,
      setChannelNameInURL,
      fetchChannelById,
      fetchSongsForChannel
    ]
  );

  return {
    setChannelNameInURL,
    selectChannel
  };
}
