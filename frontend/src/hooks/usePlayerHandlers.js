import { useCallback } from 'react';
import { MINIMUM_QUEUE_SIZE } from '../config/constants';
import { api } from '../services/apiService';

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
  isInitialLoad,
  setIsInitialLoad,
  setShowInfo
) {
  const handlePlayerReady = (event) => {
    playerRef.current = event.target;
    setPlayerReady(true);
    
    if (isInitialLoad) {
      console.log("Autoplay was prevented. User interaction required.");
      setIsPlaying(false);
      setIsInitialLoad(false);
    } else {
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
  
  const handlePreviousSong = useCallback(() => {
    updatePlayCount(currentSong._id);
    if (history.length > 0) {
      const prevSong = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setQueue(q => [nextSong, ...q]);
      setNextSong(currentSong);
      setCurrentSong(prevSong);
    } else if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(0, true);
      setCurrentTime(0);
    }
  }, [updatePlayCount, currentSong, history, playerRef, setHistory, setQueue, setNextSong, setCurrentSong, nextSong, setCurrentTime]);
  
  const handleNextSong = useCallback(() => {
    updatePlayCount(currentSong._id);
    if (nextSong) {
      setHistory(prev => [...prev, currentSong]);
      setCurrentSong(nextSong);
      setNextSong(queue[0] || null);
      setQueue(queue.slice(1));
      if (queue.length < MINIMUM_QUEUE_SIZE) {
        fetchMoreSongs();
      }
    } else {
      fetchMoreSongs(true);
    }
  }, [updatePlayCount, currentSong, nextSong, setHistory, setCurrentSong, setNextSong, queue, setQueue, fetchMoreSongs]);
  
  const handleLaterSong = useCallback(() => {
    updatePlayCount(currentSong._id);
    
    if (queue.length >= 1) {
      setHistory(prev => [...prev, currentSong, nextSong].filter(Boolean));
      
      // Promote the later song
      const [laterSong, ...remainingQueue] = queue;
      
      setCurrentSong(laterSong);
      setNextSong(remainingQueue[0] || null);
      setQueue(remainingQueue.slice(1));
      
      if (remainingQueue.length < MINIMUM_QUEUE_SIZE) {
        fetchMoreSongs();
      }
    } else {
      // If no later song available, just fetch more
      fetchMoreSongs(true);
    }
  }, [currentSong, fetchMoreSongs, nextSong, queue, setCurrentSong, setHistory, setNextSong, setQueue, updatePlayCount]);
  
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
      setShowInfo(false);
      setIsPlaying(true);
      break;
      case window.YT.PlayerState.PAUSED:
      setShowInfo(true);
      setIsPlaying(false);
      break;
      case window.YT.PlayerState.ENDED:
      handleNextSong();
      break;
      default:
      break;
    }
  }, [setShowInfo, setIsPlaying, handleNextSong]);
  
  const handlePlayerError = useCallback((error) => {
    console.error('❌ Video Player Error:', error);
    handleNextSong();
  }, [handleNextSong]);
  
  return {
    handleSeek,
    handlePreviousSong,
    handleNextSong,
    handleLaterSong,
    togglePlayPause,
    handlePlayerReady,
    handlePlayerStateChange,
    handlePlayerError
  };
}
