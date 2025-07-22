import { useEffect, useRef } from 'react';
import authService from '../services/authService';
import { fetchChannels } from '../services/channelService';
import { getAlbums } from '../services/albumService.js';
import { getSongById } from '../services/songService.js';
import { DEFAULT_CHANNEL } from '../constants/constants';

/**
 * Hook to perform initial data load once the user is authenticated (or allowed as guest).
 *
 * Responsibilities:
 * 1. Wait until authentication check is complete and user is either authenticated or allowed as guest.
 * 2. Fetch the list of all channels from the backend.
 * 3. If authenticated, also fetch the list of albums (playlists).
 * 4. Populate `setChannels` and `setAlbums` with the results.
 * 5. If there is a search query in the URL, trigger `handleSearch`.
 * 6. Otherwise, look for a `?channel=<slug>` param in the URL:
 *    - If it matches a channel (by slugified name), select that channel.
 *    - Else, if it matches an album ID, select that album.
 *    - If neither, default to the channel named "Hindi Latest" if available, else the first channel.
 * 7. Handles both channels and albums selection via `currentSelection`.
 * 8. Prevents race conditions by cancelling updates if the component unmounts.
 */
const useInitialLoad = ({
  isAuthChecked,
  allowGuestAccess,
  currentSelection,
  isLoading,
  setChannels,
  setAlbums,
  getSearchFromURL,
  handleSearch,
  selectChannel,
  selectAlbum,
  setCurrentSelection,
  setIsLoading,
  setCurrentSong,
  setNextSong,
  setQueue,
  user,
  fetchSongsForChannel,
  fetchSearchResults
}) => {
  const hasLoadedRef = useRef(false);

  // Reset the flag on user change
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [user]);

  const loadInitialData = async () => {
    if (hasLoadedRef.current) return; // 🔒 Prevent multiple triggers
    hasLoadedRef.current = true;

    let mounted = true;

    // Read all URL params
    const params = new URLSearchParams(window.location.search);
    const urlSongId = params.get('songId');
    const urlChannelOrAlbum = params.get('channel');
    const urlSearchQuery = getSearchFromURL();

    const slugify = (name) => name.replace(/\s+/g, '-').toLowerCase();

    try {
      setIsLoading(true);

      // Fetch channels and albums in parallel
      const [channels, albums] = await Promise.all([
        fetchChannels(),
        authService.isAuthenticated() ? getAlbums() : Promise.resolve([]),
      ]);

      if (!mounted) return;

      setChannels(channels || []);
      setAlbums(albums || []);

      // Handle search from URL (without songId)
      if (urlSearchQuery && !urlSongId) {
        await handleSearch(urlSearchQuery);
        return;
      }

      // Handle songId if present
      if (urlSongId) {
        const song = await getSongById(urlSongId);
        if (song && mounted) {
          // Immediately set currentSong for instant playback
          setCurrentSong(song);

          // Reset queue and nextSong immediately, they will be updated asynchronously
          setNextSong(null);
          setQueue([]);

          // Start fetching queue and nextSong in the background (doesn't block playback)
          (async () => {
            // If channel param is present, fetch songs from that channel
            if (urlChannelOrAlbum) {
              const channel = channels.find(c => slugify(c.name) === slugify(urlChannelOrAlbum));
              if (channel) {
                const songs = await fetchSongsForChannel(channel._id);
                const filtered = (songs || []).filter(s => s._id !== song._id);
                if (mounted) {
                  setQueue(filtered.slice(1));
                  setNextSong(filtered.length > 0 ? filtered[0] : null);
                  setCurrentSelection({ type: 'channel', channel, album: null });
                }
                return;
              }
            }

            // Else, fallback to search results if search exists
            if (urlSearchQuery) {
              const searchSongs = await fetchSearchResults({
                query: urlSearchQuery,
                options: { excludeIds: [song.videoId] },
              });
              if (mounted) {
                setQueue(searchSongs || []);
                setNextSong((searchSongs && searchSongs[0]) || null);
                setCurrentSelection(null);
              }
              return;
            }

            // Final fallback: empty queue
            if (mounted) {
              setQueue([]);
              setNextSong(null);
            }
          })();

          return;
        }
      }

      // Handle direct channel or album selection
      let foundChannel = null;
      let foundAlbum = null;

      if (urlChannelOrAlbum) {
        foundChannel = channels.find(c => slugify(c.name) === slugify(urlChannelOrAlbum));
        if (!foundChannel) {
          foundAlbum = albums.find(a => a._id === urlChannelOrAlbum);
        }
      }

      if (foundChannel) {
        await selectChannel(foundChannel._id);
        setCurrentSelection({ type: 'channel', channel: foundChannel, album: null });
      } else if (foundAlbum) {
        await selectAlbum(foundAlbum);
        setCurrentSelection({ type: 'album', channel: null, album: foundAlbum });
      } else {
        // Default to Hindi Latest or first channel
        const defaultChannel =
          channels.find(c => c.name === DEFAULT_CHANNEL) || channels[0];
        if (defaultChannel) {
          await selectChannel(defaultChannel._id);
          setCurrentSelection({ type: 'channel', channel: defaultChannel, album: null });
        }
      }
    } catch (err) {
      console.error('Initial Load Error:', err);
    } finally {
      if (mounted) setIsLoading(false);
    }

    // Cleanup to prevent updates after unmount
    return () => { mounted = false; };
  };

  return { loadInitialData };
};

export default useInitialLoad;
