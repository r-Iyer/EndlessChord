import { useRef, useEffect, useState } from 'react';
import './VideoPlayer.css';

/**
 * Request fullscreen on the given element and attempt to lock screen orientation to landscape.
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
      // User may reject lock, safe to ignore
    });
  }
}

function loadYouTubeAPI(onReady) {
  if (window.YT && window.YT.Player) {
    onReady();
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  document.body.appendChild(script);
  window.onYouTubeIframeAPIReady = onReady;
}

/**
 * VideoPlayer using native YouTube IFrame API.
 * Props:
 * - currentSong: { videoId: string }
 * - isPlaying: boolean
 * - isCCEnabled: boolean
 * - onReady, onStateChange, onError: callbacks
 * - playerRef: external ref to access player instance
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
  const playerElRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Load YouTube API and create player
  useEffect(() => {
    if (!currentSong?.videoId) return;

    loadYouTubeAPI(() => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
      }

      ytPlayerRef.current = new window.YT.Player(playerElRef.current, {
        videoId: currentSong.videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
          cc_load_policy: 1,
          showinfo: 0,
        },
        events: {
          onReady: (event) => {
            setIsPlayerReady(true);
            playerRef.current = event.target;
            event.target.setPlaybackQuality('default');
            onReady?.(event);
          },
          onStateChange: (event) => {
            const ytState = event.data;
            if (ytState === 2) {
              setIsPaused(true);
            } else if (ytState === 1 || ytState === 0) {
              setIsPaused(false);
            }
            onStateChange?.(event);
          },
          onError: onError,
        }
      });
    });

    return () => {
      ytPlayerRef.current?.destroy?.();
      ytPlayerRef.current = null;
      setIsPlayerReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.videoId]);

  // Sync isPlaying
  useEffect(() => {
    const player = ytPlayerRef.current;
    if (!isPlayerReady || !player) return;

    const state = player.getPlayerState?.();
    if (state !== window.YT?.PlayerState.UNSTARTED && state !== window.YT?.PlayerState.CUED) {
      if (isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    }
  }, [isPlaying, isPlayerReady]);

  // Sync captions
  useEffect(() => {
    const player = ytPlayerRef.current;
    if (!isPlayerReady || !player) return;

    try {
      if (isCCEnabled) {
        player.loadModule?.('captions');
        player.setOption?.('captions', 'track', { languageCode: 'en' });
      } else {
        player.unloadModule?.('captions');
      }
    } catch (error) {
      console.warn('Captions error:', error);
    }
  }, [isCCEnabled, isPlayerReady]);

  // Fullscreen orientation lock
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

  // Fallback when no song selected
  if (!currentSong?.videoId) {
    return (
      <div className="empty-player-container" role="region" aria-live="polite">
        <div className="empty-player-message">Select a channel to start watching</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="youtube-container" tabIndex={-1}>
      <div className="video-wrapper">
        <div ref={playerElRef} className="youtube-iframe" />
        {isPaused && <div className="pause-mask" />}
      </div>
    </div>
  );
}

export default VideoPlayer;
