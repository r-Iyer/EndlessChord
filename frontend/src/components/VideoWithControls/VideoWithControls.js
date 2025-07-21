import React, { useRef } from 'react';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import ControlsOverlay from '../ControlsOverlay/ControlsOverlay';
import './VideoWithControls.css';

export default function VideoWithControls({
  currentSong,
  isPlaying,
  isCCEnabled,
  onReady,
  onStateChange,
  onError,
  playerRef,
  onPlayPause,
  onNext,
  onPrevious,
  onCCToggle,
  isFullscreen,
  onFullscreenToggle,
  currentTime,
  duration,
  onSeek,
  user,
  showUI,
  channelSelectorRef,
  playPauseRef,
  resetUIHideTimer,
  clearUIHideTimer,
  setCurrentSong
}) {
  const videoContainerRef = useRef(null);

  if (!currentSong) return null;

  return (
    <div 
      ref={videoContainerRef} 
      className={`video-with-controls ${isFullscreen ? 'fullscreen' : ''}`}
    >
      <VideoPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        isCCEnabled={isCCEnabled}
        onReady={onReady}
        onStateChange={onStateChange}
        onError={onError}
        playerRef={playerRef}
        isFullscreen={isFullscreen}
      />

      <div className={`player-footer ${showUI ? 'visible' : 'hidden'}`}>
        <ControlsOverlay
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onNext={onNext}
          onPrevious={onPrevious}
          isCCEnabled={isCCEnabled}
          onCCToggle={onCCToggle}
          isFullscreen={isFullscreen}
          onFullscreenToggle={onFullscreenToggle}
          user={user}
          currentSong={currentSong}
          onSeek={onSeek}
          currentTime={currentTime}
          duration={duration}
          channelSelectorRef={channelSelectorRef}
          playPauseRef={playPauseRef}
          resetUIHideTimer={resetUIHideTimer}
          clearUIHideTimer={clearUIHideTimer}
          setCurrentSong={setCurrentSong}
        />
      </div>
    </div>
  );
}