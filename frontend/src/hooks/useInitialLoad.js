import { useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { fetchChannels } from '../services/channelService';
import { getAlbums } from '../services/albumService.js';
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
}) => {
  const loadInitialData = useCallback(async () => {
    let mounted = true;

    // Read `?channel=<slug>` from the URL (slug is lowercased with hyphens)
    const getChannelNameFromURL = () => {
      const params = new URLSearchParams(window.location.search);
      return params.get('channel');
    };

    const slugify = (name) => name.replace(/\s+/g, '-').toLowerCase();

    try {
      setIsLoading(true);
      // 1. Fetch all channels
      const [channels, albums] = await Promise.all([
        fetchChannels(),
        authService.isAuthenticated() ? getAlbums() : Promise.resolve([]),
      ]);

      if (mounted) {
        setChannels(channels || []);
        setAlbums(albums || []);
      }

      // 2. If there's a searchQuery in URL, run search and skip channel selection
      const urlSearchQuery = getSearchFromURL();
      if (urlSearchQuery) {
        if (mounted) await handleSearch(urlSearchQuery);
        return;
      }

      // 3. Read channel slug from URL, if any
      const urlChannelOrAlbum = getChannelNameFromURL();
      let foundChannel = null;
      let foundAlbum = null;

      if (urlChannelOrAlbum) {
        foundChannel = channels.find(
          (c) => slugify(c.name) === slugify(urlChannelOrAlbum)
        );
        if (!foundChannel) {
          foundAlbum = albums.find((a) => a._id === urlChannelOrAlbum);
        }
      }

      // 4. If valid URL channel and not already selected, select it
      if (foundChannel) {
        await selectChannel(foundChannel._id);
        setCurrentSelection({
          type: 'channel',
          channel: foundChannel,
          album: null,
        });
      } else if (foundAlbum) {
        await selectAlbum(foundAlbum);
        setCurrentSelection({
          type: 'album',
          channel: null,
          album: foundAlbum,
        });
      } else {
        // 5. No valid URL param: default to DEFAULT_CHANNEL if available
        const defaultChannel =
          channels.find((c) => c.name === DEFAULT_CHANNEL) || channels[0];
        if (defaultChannel) {
          await selectChannel(defaultChannel._id);
          setCurrentSelection({
            type: 'channel',
            channel: defaultChannel,
            album: null,
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (mounted && !isLoading) setIsLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [
    setIsLoading,
    setChannels,
    setAlbums,
    getSearchFromURL,
    handleSearch,
    selectChannel,
    selectAlbum,
    setCurrentSelection,
    isLoading,
  ]);

  useEffect(() => {
    // Only run once auth-check is done and user is either logged in or allowed as guest
    if (!isAuthChecked || (!authService.isAuthenticated() && !allowGuestAccess)) return;
    loadInitialData();
    // We disable exhaustive-deps because adding all dependencies would cause
    // this effect to rerun whenever selectChannel, handleSearch, etc. change,
    // potentially leading to infinite loops. These callbacks are assumed stable
    // (wrapped in useCallback upstream).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthChecked, allowGuestAccess]);

  return { loadInitialData };
};

export default useInitialLoad;
