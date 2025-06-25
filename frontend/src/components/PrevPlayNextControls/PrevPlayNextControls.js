import React from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import './PrevPlayNextControls.css';

export default function PrevPlayNextControls({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  playPauseRef, // <-- ref passed in from parent
}) {
  return (
    <div className="prev-play-next-controls">
      <div className="tooltip-wrapper" data-tooltip="Previous">
        <button className="control-button" onClick={onPrevious} aria-label="Previous">
          <SkipBack />
        </button>
      </div>

      <div
        className="tooltip-wrapper"
        data-tooltip={isPlaying ? 'Pause' : 'Play'}
      >
        <button
          className="control-button"
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          ref={playPauseRef} // <-- assign ref to Play/Pause button
        >
          {isPlaying ? <Pause /> : <Play />}
        </button>
      </div>

      <div className="tooltip-wrapper" data-tooltip="Next">
        <button className="control-button" onClick={onNext} aria-label="Next">
          <SkipForward />
        </button>
      </div>
    </div>
  );
}
