import React, { useRef } from 'react';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import ControlsOverlay from '../ControlsOverlay/ControlsOverlay';
import TimerSlider from '../TimerSlider/TimerSlider';
import SeekButton from '../SeekButton/SeekButton';
import usePlayerShortcuts from '../../hooks/usePlayerShortcuts';
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
}) {
  const videoContainerRef = useRef(null);

  usePlayerShortcuts({
    currentTime,
    duration,
    onSeek,
    onPlayPause,
    onNext,
    onPrevious,
  });

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
        />

        <div className={`video-slider-row ${isFullscreen ? 'fullscreen' : 'windowed'}`}>
          <SeekButton
            direction="backward"
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
          />

          <TimerSlider
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
            style={{
              height: 40,
              pointerEvents: 'auto',
              flex: 1,
              fontSize: 12,
              zIndex: 999,
            }}
          />

          <SeekButton
            direction="forward"
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
          />
        </div>
      </div>
    </div>
  );
}