import React from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import './PrevPlayNextControls.css';

export default function PrevPlayNextControls({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious
}) {
  return (
    <div className="prev-play-next-controls">
      <button className="control-button" onClick={onPrevious} aria-label="Previous">
        <SkipBack size={24} />
      </button>

      <button className="control-button" onClick={onPlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
      </button>

      <button className="control-button" onClick={onNext} aria-label="Next">
        <SkipForward size={24} />
      </button>
    </div>
  );
}
