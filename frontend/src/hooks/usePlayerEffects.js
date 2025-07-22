import { useEffect, useCallback, useRef } from 'react';

/**
* Manages various side effects related to the music player UI:
* 1. Automatically shows/hides song info when a new song starts or nears its end.
* 2. Auto-hides the UI after a period of mouse/touch/remote inactivity.
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
* @param {Object} params.playPauseRef
*   Ref to the play/pause button, used to autofocus when UI shows via remote key
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
  playPauseRef,
}) {

  const isFrozenRef = useRef(false);

  // ----------------------------------------------------------------------
  // 1. Callback to show song info overlay, and auto-hide after 8 seconds (if playing)
  // ----------------------------------------------------------------------
  const showSongInfo = useCallback(() => {
    if (isFrozenRef.current) return;
    setShowInfo(true);
    if (infoTimeoutRef.current) clearTimeout(infoTimeoutRef.current);
    
    if (isPlaying) {
      infoTimeoutRef.current = setTimeout(() => {
        setShowInfo(false);
      }, 8000);
    }
  }, [setShowInfo, isPlaying, infoTimeoutRef]);
  
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


const resetUIHideTimer = useCallback(() => {
  if (isFrozenRef.current) return;
  if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
  const isRemoteDevice = !('ontouchstart' in window) && !('onmousemove' in window);
  const timeout = isRemoteDevice ? 4000 : 2500;

  uiTimeoutRef.current = setTimeout(() => {
    setShowUI(false);
  }, timeout);
}, [setShowUI, uiTimeoutRef]);

const setPlayerTemporarilyFrozen = useCallback((freeze) => {
  isFrozenRef.current = freeze;
  if (freeze) {
    if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    if (infoTimeoutRef.current) clearTimeout(infoTimeoutRef.current);
    setShowUI(true);
  } else {
    resetUIHideTimer();
  }
}, [uiTimeoutRef, infoTimeoutRef, setShowUI, resetUIHideTimer]);



  
  // ----------------------------------------------------------------------
  // 2. Auto-hide the player UI after 2.5–4s of inactivity — show on mouse/touch/remote key interaction
  // ----------------------------------------------------------------------
  useEffect(() => {
    
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    let lastMoveTime = 0;
  
    const showUIWithTimeout = () => {
      setShowUI(true);
      resetUIHideTimer();
      setTimeout(() => {
        playPauseRef.current?.focus();
      }, 0);
    };
    
    const handleClickOrTouch = (e) => {
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
          el.closest('.slider') ||
          el.closest('.slider-input')
        );
      });
      
      if (clickedInsideControls) {
        setShowUI(true);
        setTimeout(() => {
          playPauseRef.current?.focus();
        }, 0);
        resetUIHideTimer();
        return;
      }
      
      if (document.activeElement?.tagName === 'BUTTON') {
        document.activeElement.blur();
      }
      
      setShowUI((prev) => {
        const shouldShow = !prev;
        if (shouldShow) resetUIHideTimer();
        return shouldShow;
      });
    };
    
    const handleMouseMove = (e) => {

      if (isFrozenRef.current) return;
      const now = Date.now();
      if (now - lastMoveTime < 300) return;
      lastMoveTime = now;
      showUIWithTimeout();
    };
    
const handleKeyDown = (e) => {
  if (isFrozenRef.current) return;
  const remoteKeys = [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Enter',
    'NumpadEnter',
    'MediaPlayPause',
    'Space',
  ];

  if (remoteKeys.includes(e.code)) {
    setShowUI((wasShown) => {
      if (!wasShown && playPauseRef?.current) {
        requestAnimationFrame(() => {
          playPauseRef.current?.focus();
          if (e.code === 'Space') {
            playPauseRef.current.click(); // Trigger click only for Spacebar
          }
        });
      }
      return true;
    });
    resetUIHideTimer();
  } else {
    resetUIHideTimer();// Any other keypress just show UI without focus shifting
  }
};


    
    if (isTouchDevice) {
      window.addEventListener('touchstart', handleClickOrTouch, { passive: true });
    } else {
      window.addEventListener('click', handleClickOrTouch);
      window.addEventListener('mousemove', handleMouseMove);
    }
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      if (isTouchDevice) {
        window.removeEventListener('touchstart', handleClickOrTouch);
      } else {
        window.removeEventListener('click', handleClickOrTouch);
        window.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('keydown', handleKeyDown);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    };
  }, [setShowUI, uiTimeoutRef, playPauseRef, resetUIHideTimer]);
  
  // ----------------------------------------------------------------------
  // 3. Reset player ready flag whenever the song changes
  // ----------------------------------------------------------------------
  useEffect(() => {
    setPlayerReady(false);
  }, [currentSong, setPlayerReady]);
  
  // ----------------------------------------------------------------------
  // 4. Poll player every 500ms to update currentTime and duration
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
  // 5. Show song info again at beginning and near end of song
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!currentSong || !duration) return;
    
    let preEndTimeoutId = null;
    const timeLeft = duration - currentTime;
    
    if (currentTime <= 2) {
      showSongInfo();
    }
    
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
  
  return { setPlayerTemporarilyFrozen  };
}
