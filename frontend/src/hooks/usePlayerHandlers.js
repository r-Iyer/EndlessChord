import { useCallback } from 'react';
import { MINIMUM_QUEUE_SIZE } from '../config/constants';
import api from '../services/apiService';

export default function usePlayerHandlers(
  playerRef,
  isPlaying,
  setIsPlaying,
  currentSong,
  setCurrentSong,
  nextSong,
  setNextSong,
  queue,
  setQueue,
  fetchMoreSongs,
  history,
  setHistory,
  setCurrentTime,
  setPlayerReady,
  isInitialialLoad,
  setIsInitialLoad,
  setShowInfo
) {
  const handlePlayerReady = (event) => {
    playerRef.current = event.target;
    setPlayerReady(true);
    
    
    // Check if player is actually playing
    if (isInitialialLoad) {
      console.log("Autoplay was prevented. User interaction required.");
      setIsPlaying(false);
      setIsInitialLoad(false);
    } else {
      // Try to play and handle potential failure due to autoplay policy
      event.target.playVideo();
      setIsPlaying(true);
    }
  };
  const handleSeek = useCallback((time) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(Math.floor(time), true);
  }, [playerRef]);
  
  const updatePlayCount = useCallback(async (songId) => {
    try {
      await api.post('/api/songs/played', {
        songIds: [songId],
      });
      
    } catch (error) {
      console.error('Failed to update play count:', error);
    }
  }, []);
  
  
  // New handlePreviousSong to pop from history
  const handlePreviousSong = useCallback(() => {
    updatePlayCount(currentSong._id);
    if (history.length > 0) {
      const prevSong = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setQueue(q => [currentSong, ...q]);
      setNextSong(currentSong);
      setCurrentSong(prevSong);
    } else if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(0, true);
      setCurrentTime(0);
    }
  }, [updatePlayCount, currentSong, history, playerRef, setHistory, setQueue, setNextSong, setCurrentSong, setCurrentTime]);
  // Modified handleNextSong to push currentSong to history
  const handleNextSong = useCallback(() => {
    updatePlayCount(currentSong._id);
    if (nextSong) {
      setHistory(prev => [...prev, currentSong]);
      setCurrentSong(nextSong);
      setNextSong(queue[0] || null);
      setQueue(queue.slice(1));
      if (queue.length < MINIMUM_QUEUE_SIZE) fetchMoreSongs();
    } else {
      fetchMoreSongs(true);
    }
  }, [updatePlayCount, currentSong, nextSong, setHistory, setCurrentSong, setNextSong, queue, setQueue, fetchMoreSongs]);
  
  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  }, [playerRef, isPlaying, setIsPlaying]);
  
  const handlePlayerStateChange = useCallback((event) => {
    switch (event.data) {
      case window.YT.PlayerState.PLAYING:
      setShowInfo(false)
      setIsPlaying(true);
      break;
      case window.YT.PlayerState.PAUSED:
      setShowInfo(true)
      setIsPlaying(false);
      break;
      case window.YT.PlayerState.ENDED:
      handleNextSong();
      break;
      default:
      break;
    }
  }, [setShowInfo, setIsPlaying, handleNextSong]);
  
  return {
    handleSeek,
    handlePreviousSong,
    handleNextSong,
    togglePlayPause,
    handlePlayerReady,
    handlePlayerStateChange
  };
}
