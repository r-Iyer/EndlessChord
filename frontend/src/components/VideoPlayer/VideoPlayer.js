import { useRef, useEffect, useState, useMemo } from 'react';
import YouTube from 'react-youtube';
import './VideoPlayer.css';

export function requestFullscreenWithOrientation(element) {
  if (!element) return;
  if (element.requestFullscreen) element.requestFullscreen();
  else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
  else if (element.msRequestFullscreen) element.msRequestFullscreen();
  if (window.screen.orientation?.lock) {
    window.screen.orientation.lock('landscape').catch(() => {});
  }
}

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
  
  useEffect(() => {
    setIsPlayerReady(false);
  }, [currentSong?.videoId]);
  
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current?.getPlayerState) return;
    try {
      const state = playerRef.current.getPlayerState();
      if (state !== -1 && state !== 5) {
        isPlaying ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
      }
    } catch {}
  }, [isPlaying, isPlayerReady, playerRef]);
  
  // Toggle captions using loadModule/unloadModule to avoid reloads
  useEffect(() => {
    const p = playerRef.current;
    if (!isPlayerReady || !p) return;
    try {
      if (isCCEnabled) {
        // Load captions module then select English track
        if (p.loadModule) p.loadModule('captions');
        p.setOption('captions', 'track', { languageCode: 'en' });
      } else {
        // Unload captions to disable
        if (p.unloadModule) p.unloadModule('captions');
      }
    } catch {}
  }, [isCCEnabled, isPlayerReady, playerRef]);
  
  useEffect(() => {
    function handleFullscreenChange() {
      const isFull =
      document.fullscreenElement === containerRef.current ||
      document.webkitFullscreenElement === containerRef.current ||
      document.msFullscreenElement === containerRef.current;
      if (isFull && window.screen.orientation?.lock) {
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
  
const opts = useMemo(() => ({
  width: '100%',            // Player width fills its container
  height: '100%',           // Player height fills its container
  playerVars: {
    autoplay: 1,            // 1 = start playing automatically when ready
    controls: 0,            // 0 = hide playback controls (play/pause, scrub bar)
    fs: 0,                  // 0 = disable full-screen button
    modestbranding: 1,      // 1 = minimize YouTube logo branding
    rel: 0,                 // 0 = don’t show related videos at the end
    iv_load_policy: 3,      // 3 = disable video annotations/interactive cards
    showinfo: 0,            // 0 = hide video title and uploader before play (deprecated but still honored)
    cc_load_policy: 1       // 1 = force closed captions to be shown by default
  }
}), []);
  
  const handleReady = (event) => {
    playerRef.current = event.target;
    setIsPlayerReady(true);
    onReady(event);
  };
  
  if (!currentSong) {
    return (
      <div className="empty-player-container">
      <div className="empty-player-message">Select a channel to start watching</div>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="youtube-container">
    <div className="video-wrapper">
    <YouTube
    videoId={currentSong.videoId}
    opts={opts}
    onReady={handleReady}
    onStateChange={onStateChange}
    onError={onError}
    className="youtube-player"
    />
    </div>
    </div>
  );
}

export default VideoPlayer;