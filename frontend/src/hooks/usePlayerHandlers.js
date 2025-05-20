import { useCallback } from 'react';

export default function usePlayerHandlers(
  playerRef,
  isPlaying,
  setIsPlaying,
  setCurrentSong,
  nextSong,
  setNextSong,
  queue,
  setQueue,
  fetchMoreSongs,
) {
  const handleSeek = useCallback((time) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(Math.floor(time), true);
  }, [playerRef]);

  const handleNextSong = useCallback(() => {
    if (nextSong) {
      setCurrentSong(nextSong);
      setNextSong(queue[0] || null);
      setQueue(queue.slice(1));
      if (queue.length < 3) fetchMoreSongs();
    } else {
      fetchMoreSongs(true);
    }
  }, [nextSong, setCurrentSong, setNextSong, queue, setQueue, fetchMoreSongs]);

  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  }, [playerRef, isPlaying, setIsPlaying]);

  const handlePlayerReady = useCallback((event) => {
    playerRef.current = event.target;
    event.target.playVideo(); // <-- Always play on ready
  }, [playerRef]);

  const handlePlayerStateChange = useCallback((event) => {
    switch (event.data) {
      case window.YT.PlayerState.PLAYING:
        setIsPlaying(true);
        break;
      case window.YT.PlayerState.PAUSED:
        setIsPlaying(false);
        break;
      case window.YT.PlayerState.ENDED:
        handleNextSong();
        break;
      default:
        break;
    }
  }, [setIsPlaying, handleNextSong]);

  return {
    handleSeek,
    handleNextSong,
    togglePlayPause,
    handlePlayerReady,
    handlePlayerStateChange
  };
}
