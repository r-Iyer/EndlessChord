import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import './PrevPlayNextControls.css';

export default function PrevPlayNextControls({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  playPauseRef,
  focusChannelList,
}) {
  const handleKeyDown = (e) => {
    if (e.code === 'ArrowUp' && focusChannelList) {
      e.preventDefault();
      focusChannelList();
    }
  };

  return (
    <div className="prev-play-next-controls">
      <div className="tooltip-wrapper" data-tooltip="Previous">
        <button
          className="control-button"
          onClick={onPrevious}
          onKeyDown={handleKeyDown}
          aria-label="Previous"
        >
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
          onKeyDown={handleKeyDown}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          ref={playPauseRef}
        >
          {isPlaying ? <Pause /> : <Play />}
        </button>
      </div>

      <div className="tooltip-wrapper" data-tooltip="Next">
        <button
          className="control-button"
          onClick={onNext}
          onKeyDown={handleKeyDown}
          aria-label="Next"
        >
          <SkipForward />
        </button>
      </div>
    </div>
  );
}
