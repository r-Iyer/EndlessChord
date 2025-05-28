import { useEffect, useCallback } from 'react';

function usePlayerShortcuts({ onSeek, onPlayPause, onNext, onPrevious, currentTime, duration }) {
  const handleKeyDown = useCallback((e) => {
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable
    ) {
      return;
    }

    switch (e.code) {
      case 'KeyQ':
        e.preventDefault();
        onPrevious();
        break;
      case 'KeyE':
        e.preventDefault();
        onNext();
        break;
      case 'Space':
        e.preventDefault();
        onPlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onSeek(Math.max(currentTime - 5, 0));
        break;
      case 'ArrowRight':
        e.preventDefault();
        onSeek(Math.min(currentTime + 5, duration));
        break;
      default:
        break;
    }
  }, [onPrevious, onNext, onPlayPause, onSeek, currentTime, duration]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export default usePlayerShortcuts;
