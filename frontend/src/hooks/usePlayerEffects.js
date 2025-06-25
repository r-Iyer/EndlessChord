import { useEffect, useCallback } from 'react';

/**
 * Manages various side effects related to the music player UI:
 * 1. Automatically shows/hides song info when a new song starts or nears its end.
 * 2. Auto-hides the UI after a period of mouse/touch inactivity.
 * 3. Resets the `playerReady` flag whenever the current song changes.
 * 4. Updates `currentTime` and `duration` every 500ms while a song is playing and the player is ready.
 *
 * @param {Object} params
 * @param {Object|null} params.currentSong
 *   The currently playing song object (or null if none).
 * @param {Function} params.setShowInfo
 *   Setter to control whether the song info overlay is visible.
 * @param {Object} params.infoTimeoutRef
 *   A ref (e.g., `useRef(null)`) used to track the timeout ID for auto-hiding song info.
 * @param {number} params.currentTime
 *   The current playback time (in seconds) of the song.
 * @param {Function} params.setCurrentTime
 *   Setter to update the current playback time.
 * @param {number} params.duration
 *   The total duration (in seconds) of the current song.
 * @param {Function} params.setDuration
 *   Setter to update the song duration.
 * @param {Object} params.playerRef
 *   A ref pointing to the player instance, which must expose `getCurrentTime()` and `getDuration()`.
 * @param {Function} params.setShowUI
 *   Setter to control whether the main player UI is visible.
 * @param {Object} params.uiTimeoutRef
 *   A ref used to track the timeout ID for auto-hiding the UI.
 * @param {Function} params.setPlayerReady
 *   Setter to control whether the player is “ready” (e.g., after buffering).
 * @param {boolean} params.playerReady
 *   True when the player has finished loading and is ready to report time updates.
 * @param {boolean} params.isPlaying
 *   True if audio playback is currently in progress.
 *
 * @returns {Object}
 *   - showSongInfo: A callback to force-show the song info overlay (and restart its auto-hide timer).
 */
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
  isPlaying,
}) {
  // ----------------------------------------------------------------------
  // 1. Callback to show song info overlay, and auto-hide after 8 seconds (if playing)
  // ----------------------------------------------------------------------
  const showSongInfo = useCallback(() => {
    setShowInfo(true);

    // Clear any existing timeout so we don't stack multiple hides
    if (infoTimeoutRef.current) {
      clearTimeout(infoTimeoutRef.current);
    }

    // Only auto-hide if music is playing
    if (isPlaying) {
      infoTimeoutRef.current = setTimeout(() => {
        setShowInfo(false);
      }, 8000);
    }
  }, [setShowInfo, isPlaying, infoTimeoutRef]);

  // When `currentSong` changes, immediately show info and start auto-hide timer
  useEffect(() => {
    if (currentSong) {
      showSongInfo();
    }
    return () => {
      if (infoTimeoutRef.current) {
        clearTimeout(infoTimeoutRef.current);
      }
    };
  }, [currentSong, showSongInfo, infoTimeoutRef]);

  // ----------------------------------------------------------------------
  // 2. Auto-hide the player UI after 2.5s of inactivity — show on click or hover
  // ----------------------------------------------------------------------
  useEffect(() => {
    const handleClick = (e) => {
      const path = e.composedPath();

      const clickedInsideControls = path.some((el) => {
        if (!(el instanceof HTMLElement)) return false;
        return (
          el.tagName === 'BUTTON' ||
          el.classList.contains('control-button') ||
          el.classList.contains('song-button') ||
          el.classList.contains('slider') ||
          el.closest('.control-button') ||
          el.closest('.song-button') ||
          el.closest('.slider')
        );
      });

      if (clickedInsideControls) return;

      setShowUI((prev) => {
        const shouldShow = !prev;
        if (shouldShow) {
          if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
          uiTimeoutRef.current = setTimeout(() => {
            setShowUI(false);
          }, 2500);
        }
        return shouldShow;
      });
    };

    let lastMoveTime = 0;
    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastMoveTime < 300) return; // throttle every 300ms
      lastMoveTime = now;

      setShowUI(true);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      uiTimeoutRef.current = setTimeout(() => {
        setShowUI(false);
      }, 2500);
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleMouseMove);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    };
  }, [setShowUI, uiTimeoutRef]);

  // ----------------------------------------------------------------------
  // 3. Whenever the song changes, mark the player as not-ready (so it can reinitialize)
  // ----------------------------------------------------------------------
  useEffect(() => {
    setPlayerReady(false);
  }, [currentSong, setPlayerReady]);

  // ----------------------------------------------------------------------
  // 4. Poll player every 500ms to update currentTime and duration while playing
  // ----------------------------------------------------------------------
  useEffect(() => {
    let intervalId = null;

    const getPlayerInstance = () => playerRef.current;

    if (
      currentSong &&
      playerReady &&
      getPlayerInstance() &&
      typeof getPlayerInstance().getCurrentTime === 'function'
    ) {
      intervalId = setInterval(() => {
        try {
          const player = getPlayerInstance();
          const time = player.getCurrentTime() || 0;
          const dur = player.getDuration() || 0;
          setCurrentTime(Math.floor(time));
          if (dur) {
            setDuration(Math.floor(dur));
          }
        } catch {
          // Silent catch: player might not be fully initialized yet
        }
      }, 500);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentSong, playerReady, setCurrentTime, setDuration, playerRef]);

  // ----------------------------------------------------------------------
  // 5. Show song info again at the beginning (first 2s) and near the end (20s before end)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!currentSong || !duration) return;

    let preEndTimeoutId = null;
    const timeLeft = duration - currentTime;

    // If we're within the first 2 seconds, show info immediately
    if (currentTime <= 2) {
      showSongInfo();
    }

    // For songs longer than 30s, schedule a show when only 20s remain
    if (duration > 30) {
      if (timeLeft > 20) {
        preEndTimeoutId = setTimeout(() => {
          showSongInfo();
        }, (timeLeft - 20) * 1000);
      } else if (timeLeft > 0 && timeLeft <= 20 && currentTime > 2) {
        showSongInfo();
      }
    }

    return () => {
      if (preEndTimeoutId) {
        clearTimeout(preEndTimeoutId);
      }
    };
  }, [currentSong, duration, currentTime, showSongInfo]);

  return { showSongInfo };
}
