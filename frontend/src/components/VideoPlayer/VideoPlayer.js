import { useRef, useEffect, useState, useMemo } from 'react';
import YouTube from 'react-youtube';
import { VolumeX } from 'lucide-react';
import './VideoPlayer.css';

const isFirestick = /Fire TV|AFT/.test(navigator.userAgent);

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
* Check if the YouTube iframe is present and loaded with a valid src.
* This prevents widgetapi.js null src errors.
*/
function isIframeLoaded(player) {
  try {
    const iframe = player?.getIframe?.();
    return iframe && typeof iframe.src === 'string' && iframe.src !== '';
  } catch {
    return false;
  }
}

/**
* VideoPlayer renders a YouTube player for the current song with control over playback,
* captions, and fullscreen orientation lock. It also tells YouTube to pick the adaptive ("auto")
* quality based on the user’s bandwidth.
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
  playerRef,
  isFullscreen
}) {
  const containerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [showMutedBanner, setShowMutedBanner] = useState(false);
  const isFirstLoadRef = useRef(true);

  // Track whether the video is paused
  const [isPaused, setIsPaused] = useState(false);

  // Reset player ready, paused when videoId changes
  useEffect(() => {
    setIsPlayerReady(false);
    setIsPaused(false);
  }, [currentSong?.videoId]);

  // Sync play/pause with isPlaying prop once player is ready
  useEffect(() => {
    if (
      !isPlayerReady ||
      !playerRef?.current ||
      typeof playerRef?.current?.getPlayerState !== 'function'
    ) return;

    if (!isIframeLoaded(playerRef.current)) return;

    try {
      const state = playerRef.current?.getPlayerState();
      // State -1 = unstarted, 5 = video cued, ignore those states
      if (state !== -1 && state !== 5) {
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      }
    } catch (error) {
      console.warn('YouTube player state sync error:', error);
    }
  }, [isPlaying, isPlayerReady, playerRef]);

  /**
  * Unmute on any click, key press, or touch event
  */
useEffect(() => {
  const unmuteIfMuted = (e) => {
    if (playerRef.current?.isMuted()) {
      playerRef.current.unMute();
      setIsPlayerReady(true);
      playerRef.current.playVideo(); 
      setShowMutedBanner(false);
    }
  };

  window.addEventListener('keydown', unmuteIfMuted);
  window.addEventListener('click', unmuteIfMuted);
  window.addEventListener('touchstart', unmuteIfMuted, { passive: false });

  return () => {
    window.removeEventListener('keydown', unmuteIfMuted);
    window.removeEventListener('click', unmuteIfMuted);
    window.removeEventListener('touchstart', unmuteIfMuted);
  };
}, [playerRef]);


  /**
  * Toggle captions on/off
  */
  useEffect(() => {
    const player = playerRef.current;
    if (!isPlayerReady || !player) return;
    if (!isIframeLoaded(player)) return;

    try {
      if (isCCEnabled) {
        player.loadModule('captions');
        player.setOption('captions', 'track', { languageCode: 'en' });
      } else if (typeof player.unloadModule === 'function') {
        player.unloadModule('captions');
      }
    } catch (error) {
      console.warn('YouTube captions toggle error:', error);
    }
  }, [isCCEnabled, isPlayerReady, playerRef]);

  /**
  * Cleanup on unmount
  */
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current?.stopVideo && playerRef.current?.stopVideo();
          playerRef.current?.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  /**
  * YouTube player options
  */
  const opts = useMemo(() => ({
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: isFirstLoadRef.current ? 0 : 1,
      controls: 0,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      iv_load_policy: 3,
      showinfo: 0,
      cc_load_policy: 1,
      ...(isFirestick ? {
        vq: 'default',
        html5: 1,
        playsinline: 0
      } : {})
    },
    host: 'https://www.youtube-nocookie.com'
    // Must be there so that from second request, autoplay is enabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [currentSong?.videoId]);

  /**
  * Track pause state
  */
  const handleStateChange = (event) => {
    const ytState = event.data;
    if (ytState === 2) setIsPaused(true);
    else if (ytState === 1 || ytState === 0) setIsPaused(false);
    if (typeof onStateChange === 'function') onStateChange(event);
  };

  /**
  * Handle YouTube player ready event
  */
  const handleReady = (event) => {
    playerRef.current = event.target;
    setIsPlayerReady(true);

    if (isFirstLoadRef.current) {
      playerRef.current.mute();
      setShowMutedBanner(true);
      isFirstLoadRef.current = false;

      try {
        playerRef.current.playVideo();
      } catch (error) {
        console.warn('Primary autoplay failed:', error);
      }
    }

    try {
      playerRef.current?.setPlaybackQuality('default');
    } catch (error) {
      console.warn('Could not set adaptive quality:', error);
    }

    if (typeof onReady === 'function') onReady(event);
  };

  /**
  * Clicking mute icon manually unmutes
  */
  const handleClickMuteIcon = () => {
    if (playerRef.current?.isMuted()) {
      playerRef.current.unMute();
    }
    setShowMutedBanner(false); // Immediately hide icon on click
  };

  /**
  * Fallback UI if no song selected
  */
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
    <div ref={containerRef} className={`youtube-container ${isFullscreen ? 'fullscreen' : ''}`} tabIndex={-1}>
      <div className={`video-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
        {showMutedBanner && (
          <button className="muted-indicator" onClick={handleClickMuteIcon}>
            <VolumeX size={16}/>
          </button>
        )}

        <YouTube
          videoId={currentSong.videoId}
          opts={opts}
          onReady={handleReady}
          onStateChange={handleStateChange}
          onError={onError}
          className="youtube-player"
          iframeClassName="youtube-iframe"
        />

        {isPaused && <div className="pause-mask" />}
      </div>
    </div>
  );
}

export default VideoPlayer;
