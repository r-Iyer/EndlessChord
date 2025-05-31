import { useCallback, useEffect } from 'react';

/**
 * Custom hook to manage fullscreen toggling and synchronize fullscreen state.
 *
 * @param {boolean} isFullscreen
 *   Current boolean flag indicating whether the target element is in fullscreen.
 *
 * @param {Function} setIsFullscreen
 *   Setter function to update the `isFullscreen` state in the consuming component.
 *
 * @param {{ current: HTMLElement | null }} fullscreenRef
 *   Ref object pointing to the element that should be toggled to fullscreen.
 *   If null or undefined, falls back to `document.documentElement`.
 *
 * @returns {{ toggleFullscreen: () => void }}
 *   - toggleFullscreen: Function to enter or exit fullscreen for the `fullscreenRef` element.
 */
export default function useFullscreen(isFullscreen, setIsFullscreen, fullscreenRef) {
  // Listen for changes to the document's fullscreen state so we can update `isFullscreen`.
  useEffect(() => {
    const handleFullscreenChange = () => {
      // The element currently in fullscreen may be on different vendor prefixes.
      const docEl = fullscreenRef?.current || document.documentElement;
      const isNowFullscreen =
        document.fullscreenElement === docEl ||
        document.webkitFullscreenElement === docEl ||
        document.msFullscreenElement === docEl;

      setIsFullscreen(isNowFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [setIsFullscreen, fullscreenRef]);

  /**
   * Toggles fullscreen on the referenced element (or `document.documentElement` as a fallback).
   * - If not currently fullscreen, requests fullscreen and attempts to lock orientation to landscape.
   * - If already fullscreen, exits fullscreen mode.
   */
  const toggleFullscreen = useCallback(() => {
    const elem = fullscreenRef?.current || document.documentElement;

    if (!isFullscreen) {
      // Enter fullscreen
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }

      // Attempt to lock screen orientation to landscape (optional).
      // If lock fails (e.g., unsupported), ignore the error.
      if (window.screen.orientation && typeof window.screen.orientation.lock === 'function') {
        window.screen.orientation.lock('landscape').catch(() => {});
      }
    } else {
      // Exit fullscreen if the element is currently fullscreen
      const docEl = fullscreenRef?.current || document.documentElement;
      const isElemFullscreen =
        document.fullscreenElement === docEl ||
        document.webkitFullscreenElement === docEl ||
        document.msFullscreenElement === docEl;

      if (isElemFullscreen) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }

        // Optionally: unlock orientation on exit (if previously locked)
        if (window.screen.orientation && typeof window.screen.orientation.unlock === 'function') {
          window.screen.orientation.unlock();
        }
      }
    }
  }, [isFullscreen, fullscreenRef]);

  return { toggleFullscreen };
}
