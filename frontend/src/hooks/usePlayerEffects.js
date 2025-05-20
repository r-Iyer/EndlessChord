import { useEffect, useCallback } from 'react';

export default function usePlayerEffects(
  currentSong,
  setShowInfo,
  infoTimeoutRef,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  playerRef,
) {
  // Show/hide song info
  const showSongInfo = useCallback(() => {
    setShowInfo(true);
    if (infoTimeoutRef.current) clearTimeout(infoTimeoutRef.current);
    infoTimeoutRef.current = setTimeout(() => setShowInfo(false), 8000);
  }, [setShowInfo, infoTimeoutRef]);

  useEffect(() => {
    if (currentSong) {
      showSongInfo();
    }
    return () => { if (infoTimeoutRef.current) clearTimeout(infoTimeoutRef.current); };
    // eslint-disable-next-line
  }, [currentSong, showSongInfo]);

  // Timer update
  useEffect(() => {
    let intervalId;
    if (currentSong && playerRef.current && playerRef.current.getCurrentTime) {
      intervalId = setInterval(() => {
        try {
          const time = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          setCurrentTime(Math.floor(time));
          if (dur) setDuration(Math.floor(dur));
        } catch {}
      }, 500);
    }
    return () => intervalId && clearInterval(intervalId);
  }, [currentSong, playerRef, setCurrentTime, setDuration]);

  // Show SongInfo at the beginning and when 20s remain
  useEffect(() => {
    if (!currentSong || !duration) return;
    let preEndTimeout = null;
    if (duration > 30) {
      const timeLeft = duration - currentTime;
      if (timeLeft > 20) {
        preEndTimeout = setTimeout(() => {
          showSongInfo();
        }, (timeLeft - 20) * 1000);
      } else if (timeLeft <= 20 && timeLeft > 0) {
        showSongInfo();
      }
    }
    return () => {
      if (preEndTimeout) clearTimeout(preEndTimeout);
    };
  }, [currentSong, duration, currentTime, showSongInfo]);

  return { showSongInfo };
}
