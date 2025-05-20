import { forwardRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Maximize, Minimize } from 'lucide-react';
import './PlaybackControls.css';

const PlaybackControls = forwardRef(function PlaybackControls({
  isPlaying, 
  isFullscreen,
  onPlayPause, 
  onNext, 
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