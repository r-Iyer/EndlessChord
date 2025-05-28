import { useCallback } from 'react';

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

  const setChannelNameInURL = useCallback((channelName) => {
    const params = new URLSearchParams(window.location.search);

    if (channelName) {
      params.set('channel', channelName);
    } else {
      params.delete('channel');
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, []);

  const selectChannel = useCallback(
    async (channelIdOrName) => {
      setUserInteracted(true);
      setBackendError(false);
      setIsPlaying(false);
      setCurrentSong(null);
      setNextSong(null);
      setQueue([]);
      setIsLoading(true);
      try {
        let channelData = null;
        if (channels.length > 0 && typeof channelIdOrName === 'string' && !/^[0-9a-fA-F]{24}$/.test(channelIdOrName)) {
          channelData = channels.find(
            c => c.name.replace(/\s+/g, '-').toLowerCase() === channelIdOrName.replace(/\s+/g, '-').toLowerCase()
          );
        }
        if (!channelData) {
          channelData = await fetchChannelById(channelIdOrName);
        }
        if (currentChannel && currentChannel._id === channelData._id) {
          setIsLoading(false);
          return;
        }
        setCurrentChannel(channelData);
        setChannelNameInURL(channelData.name.replace(/\s+/g, '-'));
        const songs = await fetchSongsForChannel(channelData._id);
        if (songs && songs.length > 0) {
          setCurrentSong(songs[0]);
          setNextSong(songs[1] || null);
          setQueue(songs.slice(2));
        } else {
          setCurrentSong(null);
          setNextSong(null);
          setQueue([]);
          setIsPlaying(false);
        }
      } catch (error) {
        setBackendError(true);
        setCurrentSong(null);
        setNextSong(null);
        setQueue([]);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    },
    [setUserInteracted, setBackendError, setIsPlaying, setCurrentSong, setNextSong, setQueue, setIsLoading, channels, currentChannel, setCurrentChannel, setChannelNameInURL, fetchSongsForChannel, fetchChannelById]);
    return {
    setChannelNameInURL,
    selectChannel
  };
}