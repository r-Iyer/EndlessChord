import React, { forwardRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import './PlaybackControls.css';

const PlaybackControls = forwardRef(function PlaybackControls({
  isPlaying, 
  isMuted,
  isFullscreen,
  onPlayPause, 
  onNext, 
  onMuteToggle,
  onFullscreenToggle,
  onPrevious,
  style
}, ref) {
  return (
    <div
      ref={ref}
      className={`playback-controls ${isFullscreen ? 'fullscreen' : ''}`}
      style={style}
    >
      <div className="playback-container">
        <div className="playback-buttons-group">
          <button 
            className="control-button"
            onClick={onPrevious}
            aria-label="Previous Song"
          >
            <SkipBack size={24} />
          </button>
          <button 
            className="control-button"
            onClick={onPlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button 
            className="control-button"
            onClick={onNext}
            aria-label="Next Song"
          >
            <SkipForward size={24} />
          </button>
          <button 
            className="control-button"
            onClick={onMuteToggle}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
          <button 
            className="control-button"
            onClick={onFullscreenToggle}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
});

export default PlaybackControls;