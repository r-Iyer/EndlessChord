import React, { useRef, useEffect, useState } from 'react';
import YouTube from 'react-youtube';

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

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0, // Hide native controls
      disablekb: 0,
      fs: 0,
      modestbranding: 1,
      rel: 0, // This disables "More Videos" suggestions at the end and on pause as much as possible
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
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-xl">Select a channel to start watching</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="youtube-container bg-black">
      <YouTube
        videoId={currentSong.videoId}
        opts={opts}
        onReady={handleReady}
        onStateChange={onStateChange}
        onError={onError}
        className="youtube-player"
      />
    </div>
  );
}

export default VideoPlayer;