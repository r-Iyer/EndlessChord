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
*
* @param {Object} params
* @param {boolean} params.isAuthChecked - True once the auth check (in useAuth) has finished.
* @param {boolean} params.allowGuestAccess - True if the user is authenticated or has chosen guest access.
* @param {Object|null} params.currentSelection - Currently selected channel or album (might be `null` initially).
* @param {boolean} params.isLoading - True if a selection fetch is in progress.
* @param {Function} params.setChannels - Setter to populate the array of all channels.
* @param {Function} params.setAlbums - Setter to populate the array of albums if authenticated.
* @param {Function} params.getSearchFromURL - Function that returns a searchQuery if present in URL.
* @param {Function} params.handleSearch - Callback to perform a search given a query string.
* @param {Function} params.selectChannel - Callback to select a channel by its ID.
* @param {Function} params.selectAlbum - Callback to select an album.
* @param {Function} params.setCurrentSelection - Setter to update the current selection (channel or album).
* @param {Function} params.setIsLoading - Setter to indicate loading state.
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
  user 
}) => {

  const hasLoadedRef = useRef(false);
  
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [user]);

  const loadInitialData = async () => {
    if (hasLoadedRef.current) return; // 🔒 skip if already ran
    hasLoadedRef.current = true;

    let mounted = true;

    const getSongIdFromURL = () => {
      const params = new URLSearchParams(window.location.search);
      return params.get('songId');
    };

    const getChannelNameFromURL = () => {
      const params = new URLSearchParams(window.location.search);
      return params.get('channel');
    };

    const slugify = (name) => name.replace(/\s+/g, '-').toLowerCase();

    try {
      setIsLoading(true);

      const [channels, albums] = await Promise.all([
        fetchChannels(),
        authService.isAuthenticated() ? getAlbums() : Promise.resolve([]),
      ]);

      if (mounted) {
        setChannels(channels || []);
        setAlbums(albums || []);
      }

      const urlSearchQuery = getSearchFromURL();
      if (urlSearchQuery) {
        if (mounted) await handleSearch(urlSearchQuery);
        return;
      }

      const urlChannelOrAlbum = getChannelNameFromURL();
      const urlSongId = getSongIdFromURL();

      if (urlSongId) {
        const song = await getSongById(urlSongId);
        if (song && mounted) {
          setCurrentSong(song);
          setNextSong(null);
        }
      } else {
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
          const defaultChannel =
            channels.find(c => c.name === DEFAULT_CHANNEL) || channels[0];
          if (defaultChannel) {
            await selectChannel(defaultChannel._id);
            setCurrentSelection({ type: 'channel', channel: defaultChannel, album: null });
          }
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      if (mounted && !isLoading) setIsLoading(false);
    }

    return () => { mounted = false; };
  };
  
  return { loadInitialData };
};

export default useInitialLoad;
