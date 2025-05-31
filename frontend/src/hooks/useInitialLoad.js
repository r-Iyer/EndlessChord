import { useEffect } from 'react';
import authService from '../services/authService';
import { fetchChannels } from '../services/channelService';

/**
 * Hook to perform initial data load once the user is authenticated (or allowed as guest).
 *
 * Responsibilities:
 * 1. Wait until authentication check is complete and user is either authenticated or allowed as guest.
 * 2. Fetch the list of all channels from the backend.
 * 3. Populate `setChannels` with the results.
 * 4. If there is a search query in the URL, trigger `handleSearch`.
 * 5. Otherwise, look for a `?channel=<slug>` param in the URL:
 *    - If present and matches an existing channel, call `selectChannel` for that channel.
 *    - If not present (or invalid), default to selecting the first channel in the list.
 * 6. Prevent race conditions by ignoring results if the component using this hook unmounts.
 *
 * @param {Object} params
 * @param {boolean} params.isAuthChecked - True once the auth check (in useAuth) has finished.
 * @param {boolean} params.allowGuestAccess - True if the user is authenticated or has chosen guest access.
 * @param {Object|null} params.currentChannel - Currently selected channel (might be `null` initially).
 * @param {boolean} params.isLoading - True if a channel-selection fetch is in progress.
 * @param {Function} params.setChannels - Setter to populate the array of all channels.
 * @param {Function} params.getSearchFromURL - Function that returns a searchQuery if present in URL.
 * @param {Function} params.handleSearch - Callback to perform a search given a query string.
 * @param {Function} params.selectChannel - Callback to select a channel by its ID.
 */
const useInitialLoad = ({
  isAuthChecked,
  allowGuestAccess,
  currentChannel,
  isLoading,
  setChannels,
  getSearchFromURL,
  handleSearch,
  selectChannel,
}) => {
  useEffect(() => {
    // Only run once auth-check is done and user is either logged in or allowed as guest
    if (!isAuthChecked || (!authService.isAuthenticated() && !allowGuestAccess)) {
      return;
    }

    let mounted = true;

    // Read `?channel=<slug>` from the URL (slug is lowercased with hyphens)
    const getChannelNameFromURL = () => {
      const params = new URLSearchParams(window.location.search);
      return params.get('channel');
    };

    const loadInitialData = async () => {
      try {
        // 1. Fetch all channels
        const data = await fetchChannels();
        if (!mounted) return;
        setChannels(data || []);

        // 2. If there's a searchQuery in URL, run search and skip channel selection
        const urlSearchQuery = getSearchFromURL();
        if (urlSearchQuery) {
          if (!mounted) return;
          handleSearch(urlSearchQuery);
          return;
        }

        // 3. No search: look for channel slug in URL
        const urlChannelName = getChannelNameFromURL();
        let channelToSelect = null;

        if (urlChannelName) {
          const slugify = (name) => name.replace(/\s+/g, '-').toLowerCase();
          channelToSelect = data.find(
            (c) => slugify(c.name) === urlChannelName.replace(/\s+/g, '-').toLowerCase()
          );
        }

        // 4. If we found a valid channel slug and it's not already selected, select it
        if (
          channelToSelect &&
          (!currentChannel || currentChannel._id !== channelToSelect._id)
        ) {
          if (!isLoading) {
            selectChannel(channelToSelect._id);
          }
        } else if (data.length > 0 && !currentChannel) {
          // 5. If no channel slug or it didn't match, default to first channel in list
          if (!isLoading) {
            selectChannel(data[0]._id);
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        // We could set some global error state here if desired
      }
    };

    loadInitialData();

    return () => {
      // Prevent state updates if the component unmounts before async completes
      mounted = false;
    };
    // We disable exhaustive-deps because adding all dependencies would cause
    // this effect to rerun whenever selectChannel, handleSearch, etc. change,
    // potentially leading to infinite loops. These callbacks are assumed stable
    // (wrapped in useCallback upstream).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthChecked, allowGuestAccess]);
};

export default useInitialLoad;
