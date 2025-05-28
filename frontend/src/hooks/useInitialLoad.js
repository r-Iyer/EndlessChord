import { useEffect } from 'react';
import authService from '../services/authService';
import { fetchChannels } from '../services/apiService';

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
    if (!isAuthChecked || (!authService.isAuthenticated() && !allowGuestAccess)) return;

    let mounted = true;

    const getChannelNameFromURL = () => {
      const params = new URLSearchParams(window.location.search);
      return params.get('channel');
    };

    const loadInitialData = async () => {
      try {
        const data = await fetchChannels();
        if (!mounted) return;
        setChannels(data);

        const urlSearchQuery = getSearchFromURL();
        if (urlSearchQuery) {
          handleSearch(urlSearchQuery);
        } else {
          const urlChannelName = getChannelNameFromURL();
          let channelToSelect = null;

          if (urlChannelName) {
            channelToSelect = data.find(
              c => c.name.replace(/\s+/g, '-').toLowerCase() === urlChannelName.replace(/\s+/g, '-').toLowerCase()
            );
          }

          if (
            channelToSelect &&
            (!currentChannel || currentChannel._id !== channelToSelect._id)
          ) {
            if (!isLoading) selectChannel(channelToSelect._id);
          } else if (data.length > 0 && !currentChannel) {
            if (!isLoading) selectChannel(data[0]._id);
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    loadInitialData();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthChecked, allowGuestAccess]);
};

export default useInitialLoad;
