import { useCallback } from 'react';

export default function usePlayerHandlers(
  playerRef,
  isPlaying,
  setIsPlaying,
  isMuted,
  setIsMuted,
  currentSong,
  setCurrentSong,
  nextSong,
  setNextSong,
  queue,
  setQueue,
  fetchMoreSongs,
  showInfo,
  setShowInfo,
  infoTimeoutRef,
  duration,
  setCurrentTime
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

  const handleVideoEnd = useCallback(() => {
    setShowInfo(true);
    if (nextSong) {
      setCurrentSong(nextSong);
      setNextSong(queue[0] || null);
      setQueue(queue.slice(1));
      if (queue.length < 3) fetchMoreSongs();
    } else {
      fetchMoreSongs(true);
    }
  }, [nextSong, setCurrentSong, setNextSong, queue, setQueue, fetchMoreSongs, setShowInfo]);

  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  }, [playerRef, isPlaying, setIsPlaying]);

  const toggleMute = useCallback(() => {
    if (playerRef.current?.internalPlayer) {
      if (isMuted) {
        playerRef.current.internalPlayer.unMute().catch(() => {});
      } else {
        playerRef.current.internalPlayer.mute().catch(() => {});
      }
      setIsMuted(!isMuted);
    }
  }, [playerRef, isMuted, setIsMuted]);

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
        handleVideoEnd();
        break;
      default:
        break;
    }
  }, [setIsPlaying, handleVideoEnd]);

  const handleSkipForward = () => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      const newTime = Math.min((playerRef.current.getCurrentTime() || 0) + 5, duration);
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(Math.floor(newTime));
    }
  };

  const handleSkipBackward = () => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      const newTime = Math.max((playerRef.current.getCurrentTime() || 0) - 5, 0);
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(Math.floor(newTime));
    }
  };

  return {
    handleSeek,
    handleNextSong,
    handleVideoEnd,
    togglePlayPause,
    toggleMute,
    handlePlayerReady,
    handlePlayerStateChange,
    handleSkipForward,
    handleSkipBackward
  };
}
