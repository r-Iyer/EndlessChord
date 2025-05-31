import { useEffect, useCallback } from 'react';

export default function usePlayerEffects({
  currentSong,
  setShowInfo,
  infoTimeoutRef,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  playerRef,
  setShowUI,
  uiTimeoutRef,
  setPlayerReady,
  playerReady,
  isPlaying
}) {
  // --- Show/hide song info ---
const showSongInfo = useCallback(() => {
  setShowInfo(true);
  
  if (infoTimeoutRef.current) {
    clearTimeout(infoTimeoutRef.current);
  }

  // Only auto-hide if playing
  if (isPlaying) {
    infoTimeoutRef.current = setTimeout(() => {
      setShowInfo(false);
    }, 8000);
  }
}, [setShowInfo, infoTimeoutRef, isPlaying]);

  
  useEffect(() => {
    if (currentSong) {
      showSongInfo();
    }
    return () => {
      if (infoTimeoutRef.current) clearTimeout(infoTimeoutRef.current);
    };
  }, [currentSong, infoTimeoutRef, showSongInfo]);
  
  // --- Auto-hide UI after inactivity ---
  useEffect(() => {
    const showAndResetTimer = () => {
      setShowUI(true);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      uiTimeoutRef.current = setTimeout(() => setShowUI(false), 2500);
    };
    
    window.addEventListener('mousemove', showAndResetTimer);
    window.addEventListener('touchstart', showAndResetTimer, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', showAndResetTimer);
      window.removeEventListener('touchstart', showAndResetTimer);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    };
  }, [setShowUI, uiTimeoutRef]);
  
  // --- Reset playerReady on song change ---
  useEffect(() => {
    setPlayerReady(false);
  }, [currentSong, setPlayerReady]);
  
  // --- Timer update: currentTime + duration ---
  useEffect(() => {
    let intervalId;
    const getPlayer = () => playerRef.current;
    
    if (
      currentSong &&
      playerReady &&
      getPlayer() &&
      typeof getPlayer().getCurrentTime === 'function'
    ) {
      intervalId = setInterval(() => {
        try {
          const player = getPlayer();
          const time = player.getCurrentTime() || 0;
          const dur = player.getDuration() || 0;
          setCurrentTime(Math.floor(time));
          if (dur) setDuration(Math.floor(dur));
        } catch {}
      }, 500);
    }
    
    return () => intervalId && clearInterval(intervalId);
  }, [currentSong, playerReady, setCurrentTime, setDuration, playerRef]);
  
  // --- Show SongInfo at beginning and near end ---
  useEffect(() => {
    if (!currentSong || !duration) return;
    
    let preEndTimeout = null;
    
    // Show at the beginning (first 2 seconds)
    if (currentTime <= 2) {
      showSongInfo();
    }
    
    // Show when 20 seconds remain (for songs > 30s)
    if (duration > 30) {
      const timeLeft = duration - currentTime;
      
      if (timeLeft > 20) {
        preEndTimeout = setTimeout(() => {
          showSongInfo();
        }, (timeLeft - 20) * 1000);
      } else if (timeLeft <= 20 && timeLeft > 0 && currentTime > 2) {
        showSongInfo();
      }
    }
    
    return () => {
      if (preEndTimeout) clearTimeout(preEndTimeout);
    };
  }, [currentSong, duration, currentTime, showSongInfo]);
  
  return { showSongInfo };
}