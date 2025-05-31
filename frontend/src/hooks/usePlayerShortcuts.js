import { useEffect, useCallback } from 'react';

/**
 * Hook to add keyboard shortcuts for player controls:
 *  - Q: Previous song
 *  - E: Next song
 *  - Space: Toggle play/pause
 *  - ArrowLeft: Seek backward by 5 seconds
 *  - ArrowRight: Seek forward by 5 seconds
 *
 * Ignores key events when focus is in an input, textarea, or contenteditable element.
 *
 * @param {Object} params
 * @param {Function} params.onSeek
 *   Callback to seek to a specific time (in seconds). Receives the target time.
 * @param {Function} params.onPlayPause
 *   Callback to toggle play/pause.
 * @param {Function} params.onNext
 *   Callback to skip to the next song.
 * @param {Function} params.onPrevious
 *   Callback to skip to the previous song.
 * @param {number} params.currentTime
 *   Current playback time (in seconds).
 * @param {number} params.duration
 *   Total duration of the current song (in seconds).
 */
function usePlayerShortcuts({
  onSeek,
  onPlayPause,
  onNext,
  onPrevious,
  currentTime,
  duration,
}) {
  /**
   * Handler for keydown events. Checks if the focused element is editable;
   * if not, intercepts specific keys to control playback.
   */
  const handleKeyDown = useCallback(
    (e) => {
      const target = e.target;
      const tag = target.tagName;

      // Ignore shortcuts if typing in an input, textarea, or contenteditable area
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        target.isContentEditable
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
          // Seek backward by 5 seconds, ensuring we don't go below 0
          onSeek(Math.max(currentTime - 5, 0));
          break;

        case 'ArrowRight':
          e.preventDefault();
          // Seek forward by 5 seconds, ensuring we don't exceed duration
          onSeek(Math.min(currentTime + 5, duration));
          break;

        default:
          break;
      }
    },
    [onPrevious, onNext, onPlayPause, onSeek, currentTime, duration]
  );

  // Register the handler on mount and clean up on unmount or dependency change
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export default usePlayerShortcuts;
