import { useRef, useEffect, useState, useMemo } from 'react';
import YouTube from 'react-youtube';
import './VideoPlayer.css';

/**
 * Request fullscreen on the given element and attempt to lock screen orientation to landscape.
 * Fallbacks included for vendor-prefixed fullscreen methods.
 * @param {HTMLElement} element - The element to fullscreen
 */
export function requestFullscreenWithOrientation(element) {
  if (!element) return;

  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }

  if (window.screen.orientation?.lock) {
    window.screen.orientation.lock('landscape').catch(() => {
      // Ignore errors, e.g. user rejected lock
    });
  }
}

/**
 * VideoPlayer renders a YouTube player for the current song with control over playback,
 * captions, and fullscreen orientation lock.
 * 
 * Props:
 * - currentSong: object with videoId of the YouTube video to play
 * - isPlaying: boolean to play or pause video
 * - isCCEnabled: boolean to toggle closed captions
 * - onReady: callback for YouTube player ready event
 * - onStateChange: callback for player state changes
 * - onError: callback for player errors
 * - playerRef: React ref to expose YouTube player instance
 */
function VideoPlayer({
  currentSong,
  isPlaying,
  isCCEnabled,
  onReady,
  onStateChange,
  onError,
  playerRef
}) {
  const containerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Reset player ready state when videoId changes
  useEffect(() => {
    setIsPlayerReady(false);
  }, [currentSong?.videoId]);

  // Sync play/pause with isPlaying prop once player is ready
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current?.getPlayerState) return;
    try {
      const state = playerRef.current.getPlayerState();
      // State -1 = unstarted, 5 = video cued, ignore those states
      if (state !== -1 && state !== 5) {
        if (isPlaying) playerRef.current.playVideo();
        else playerRef.current.pauseVideo();
      }
    } catch (error) {
      // Fail silently, player API may not be ready yet
      console.warn('YouTube player state sync error:', error);
    }
  }, [isPlaying, isPlayerReady, playerRef]);

  // Toggle captions on/off by loading/unloading the captions module
  useEffect(() => {
    const player = playerRef.current;
    if (!isPlayerReady || !player) return;

    try {
      if (isCCEnabled) {
        if (player.loadModule) player.loadModule('captions');
        player.setOption('captions', 'track', { languageCode: 'en' });
      } else {
        if (player.unloadModule) player.unloadModule('captions');
      }
    } catch (error) {
      console.warn('YouTube captions toggle error:', error);
    }
  }, [isCCEnabled, isPlayerReady, playerRef]);

  // Lock orientation to landscape on fullscreen enter for containerRef
  useEffect(() => {
    function handleFullscreenChange() {
      const fullscreenElement =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;

      if (fullscreenElement === containerRef.current && window.screen.orientation?.lock) {
        window.screen.orientation.lock('landscape').catch(() => {});
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Memoized YouTube player options - stable reference to avoid unnecessary reloads
  const opts = useMemo(() => ({
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 1,           // Autoplay video on ready
      controls: 0,           // Hide controls UI (custom controls expected)
      fs: 0,                 // Disable fullscreen button (custom fullscreen)
      modestbranding: 1,     // Minimal YouTube branding
      rel: 0,                // No related videos at end
      iv_load_policy: 3,     // Disable video annotations/interactive cards
      showinfo: 0,           // Deprecated but kept to hide info
      cc_load_policy: 1      // Closed captions on by default (can override)
    }
  }), []);

  // Handle YouTube player ready event
  const handleReady = (event) => {
    playerRef.current = event.target;
    setIsPlayerReady(true);
    if (typeof onReady === 'function') {
      onReady(event);
    }
  };

  // Show fallback UI if no song selected
  if (!currentSong) {
    return (
      <div className="empty-player-container" role="region" aria-live="polite">
        <div className="empty-player-message">
          Select a channel to start watching
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="youtube-container" tabIndex={-1}>
      <div className="video-wrapper">
        <YouTube
          videoId={currentSong.videoId}
          opts={opts}
          onReady={handleReady}
          onStateChange={onStateChange}
          onError={onError}
          className="youtube-player"
          iframeClassName="youtube-iframe"
        />
      </div>
    </div>
  );
}

export default VideoPlayer;
