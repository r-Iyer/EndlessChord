import { useCallback } from 'react';

export default function useSongQueue(
  currentChannel,
  currentSong,
  setCurrentSong,
  setNextSong,
  setQueue,
  isFetchingSongs,
  setIsFetchingSongs
) {
  const fetchSongsForChannel = useCallback(async (channelId) => {
    if (isFetchingSongs) return [];
    setIsFetchingSongs(true);
    try {
      const response = await fetch(`/api/channels/${channelId}/songs`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching songs:', error);
      return [];
    } finally {
      setIsFetchingSongs(false);
    }
  }, [isFetchingSongs, setIsFetchingSongs]);

  const fetchMoreSongs = useCallback((setAsCurrent = false) => {
    if (!currentChannel || isFetchingSongs) return;
    setIsFetchingSongs(true);
    fetch(`/api/channels/${currentChannel._id}/songs?exclude=${currentSong?.videoId || ''}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          if (setAsCurrent) {
            setCurrentSong(data[0]);
            setNextSong(data[1] || null);
            setQueue(data.slice(2));
          } else {
            setQueue((prevQueue) => [...prevQueue, ...data]);
          }
        }
      })
      .catch((error) => console.error('Error fetching more songs:', error))
      .finally(() => setIsFetchingSongs(false));
  }, [currentChannel, currentSong, setCurrentSong, setNextSong, setQueue, isFetchingSongs, setIsFetchingSongs]);

  return { fetchSongsForChannel, fetchMoreSongs };
}
