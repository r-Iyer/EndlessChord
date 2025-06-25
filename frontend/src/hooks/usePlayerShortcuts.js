import { useEffect, useCallback } from 'react';

/**
* Hook to add keyboard and touch shortcuts for a media player:
*  - Q: Previous
*  - E: Next
*  - Space: Play/Pause
*  - ←: Seek -5s (disabled)
*  - →: Seek +5s (disabled)
*  - F: Fullscreen
*  - C: Captions
*  - R: Restart
*  - Double-tap left/right on mobile: Seek -/+ 5s (disabled)
*
* @param {Object} params
* @param {Function} params.onSeek
* @param {Function} params.onPlayPause
* @param {Function} params.onNext
* @param {Function} params.onPrevious
* @param {number} params.currentTime
* @param {number} params.duration
* @param {Function} [params.onFullscreenToggle]
* @param {Function} [params.onCCToggle]
* @param {Function} [params.setShowUI]
* @param {Object} [params.uiTimeoutRef]
* @param {Object} [params.containerRef]
*/
function usePlayerShortcuts({
  onSeek,
  onPlayPause,
  onNext,
  onPrevious,
  currentTime,
  duration,
  onFullscreenToggle,
  onCCToggle,
  setShowUI,
  uiTimeoutRef,
  containerRef,
  playPauseRef
}) {
  
  
  const showAndResetUI = useCallback(() => {
    if (!setShowUI || !uiTimeoutRef) return;
    setShowUI(true);
    setTimeout(() => {
      playPauseRef.current?.focus();
    }, 0);
    if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    uiTimeoutRef.current = setTimeout(() => {
      setShowUI(false);
    }, 2500);
  }, [playPauseRef, setShowUI, uiTimeoutRef]);
  
  const handleKeyDown = useCallback(
    (e) => {
      const target = e.target;
      const tag = target.tagName;
      const type = target.type;
      
      const isTextEditable =
      (tag === 'INPUT' && type !== 'range') ||
      tag === 'TEXTAREA' ||
      target.isContentEditable;
      
      if (isTextEditable) return;
      
      switch (e.code) {
        case 'KeyQ':
        e.preventDefault();
        showAndResetUI();
        onPrevious();
        break;
        
        case 'KeyE':
        e.preventDefault();
        showAndResetUI();
        onNext();
        break;
        case 'Space':
        case 'Enter':
        e.preventDefault();
        showAndResetUI();
        onPlayPause();
        break;
        
        // case 'ArrowLeft':
        //   showAndResetUI();
        //   onSeek(Math.max(currentTime - 5, 0));
        //   showBlinkMessage('-5 seconds');
        //   break;
        
        // case 'ArrowRight':
        //   showAndResetUI();
        //   onSeek(Math.min(currentTime + 5, duration));
        //   showBlinkMessage('+5 seconds');
        //   break;
        
        case 'KeyF':
        e.preventDefault();
        showAndResetUI();
        onFullscreenToggle?.();
        break;
        
        case 'KeyC':
        e.preventDefault();
        showAndResetUI();
        onCCToggle?.();
        break;
        
        case 'KeyR':
        e.preventDefault();
        showAndResetUI();
        onSeek(0);
        break;
        
        default:
        break;
      }
    },
    [onPrevious, onNext, onPlayPause, onSeek, onFullscreenToggle, onCCToggle, showAndResetUI]
  );
  
  const handleTouchStart = useCallback(
    (e) => {
      // --- Double-tap to seek is currently disabled ---
      // const now = Date.now();
      // const touch = e.touches?.[0];
      // if (!touch) return;
      
      // const x = touch.clientX;
      // const width = window.innerWidth;
      // const side = x < width / 2 ? 'left' : 'right';
      // const delta = now - lastTapRef.current.time;
      
      // if (delta < 300 && lastTapRef.current.side === side) {
      //   showAndResetUI();
      //   if (side === 'left') {
      //     onSeek(Math.max(currentTime - 5, 0));
      //     showBlinkMessage('-5 seconds');
      //   } else {
      //     onSeek(Math.min(currentTime + 5, duration));
      //     showBlinkMessage('+5 seconds');
      //   }
      // }
      
      // lastTapRef.current = { time: now, side };
    },
    []
  );
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleKeyDown, handleTouchStart]);
  
  useEffect(() => {
    if (containerRef?.current) {
      containerRef.current.tabIndex = -1;
      containerRef.current.focus();
    }
  }, [containerRef]);
}

export default usePlayerShortcuts;
