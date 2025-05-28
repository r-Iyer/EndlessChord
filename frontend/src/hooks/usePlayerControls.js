import { useEffect, useCallback } from 'react';

/**
 * usePlayerControls
 * - attaches global keyboard controls (Q/E, Space, Arrow keys)
 * - returns a double-click handler for seeking
 */
export function usePlayerControls({
  onPrevious,
  onNext,
  onPlayPause,
  onFullscreenToggle,
  onCCToggle,
  onSeekBackward,
  onSeekForward
}) {
  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable
    ) return;

    switch (e.code) {
      case 'KeyQ':
        e.preventDefault(); onPrevious(); break;
      case 'KeyE':
        e.preventDefault(); onNext(); break;
      case 'Space':
        e.preventDefault(); onPlayPause(); break;
      case 'ArrowLeft':
        e.preventDefault(); onSeekBackward(); break;
      case 'ArrowRight':
        e.preventDefault(); onSeekForward(); break;
      case 'KeyF':
        e.preventDefault(); onFullscreenToggle(); break;
      case 'KeyC':
        e.preventDefault(); onCCToggle(); break;
      default:
        break;
    }
  }, [onPrevious, onNext, onPlayPause, onSeekBackward, onSeekForward, onFullscreenToggle, onCCToggle]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Double-click seeking handler
  const handleDoubleClick = useCallback((e) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - left;
    if (clickX < width / 2) onSeekBackward();
    else onSeekForward();
  }, [onSeekBackward, onSeekForward]);

  return { handleDoubleClick };
}