import React, { useRef, useEffect, useState } from 'react';
import YouTube from 'react-youtube';
import './VideoPlayer.css';

// Helper to request fullscreen and lock orientation
export function requestFullscreenWithOrientation(element) {
  if (!element) return;
  // Request fullscreen
  if (element.requestFullscreen) element.requestFullscreen();
  else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
  else if (element.msRequestFullscreen) element.msRequestFullscreen();
  // Lock orientation if possible
  if (window.screen.orientation && window.screen.orientation.lock) {
    window.screen.orientation.lock('landscape').catch(() => {});
  }
}

function VideoPlayer({ currentSong, isPlaying, onReady, onStateChange, onError, isFullscreen, playerRef }) {
  const containerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    setIsPlayerReady(false); // Reset when video changes
  }, [currentSong?.videoId]);
  
  useEffect(() => {
    if (
      isPlayerReady &&
      playerRef?.current &&
      typeof playerRef.current.getPlayerState === 'function'
    ) {
      let state;
      try {
        state = playerRef.current.getPlayerState();
      } catch {
        // Player not ready, skip
        return;
      }
      // Only control playback if player is not UNSTARTED (-1) or CUED (5) and state is a number
      if (typeof state === 'number' && state !== -1 && state !== 5) {
        if (isPlaying) {
          try { playerRef.current.playVideo(); } catch {}
        } else {
          try { playerRef.current.pauseVideo(); } catch {}
        }
      }
    }
  }, [isPlaying, playerRef, isPlayerReady, currentSong?.videoId]);

  // Remove the previous orientation lock effect, keep only fullscreenchange as fallback
  useEffect(() => {
    function handleFullscreenChange() {
      const isFull =
        document.fullscreenElement === containerRef.current ||
        document.webkitFullscreenElement === containerRef.current ||
        document.msFullscreenElement === containerRef.current;
      if (isFull && window.screen.orientation && window.screen.orientation.lock) {
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

  const opts = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 0,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      iv_load_policy: 3,
      showinfo: 0
    }
  };

  const handleReady = (event) => {
    if (playerRef) playerRef.current = event.target;
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
    <div
      ref={containerRef}
      className="youtube-container"
    >
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