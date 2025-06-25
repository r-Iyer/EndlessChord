import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import './PrevPlayNextControls.css';

/**
 * Playback control component showing Previous, Play/Pause, and Next buttons.
 * Also supports Firestick/keyboard ↑ navigation to focus channel selector.
 *
 * @param {Object} props
 * @param {boolean} props.isPlaying - Whether the song is currently playing
 * @param {Function} props.onPlayPause - Callback to toggle play/pause
 * @param {Function} props.onNext - Callback to play next song
 * @param {Function} props.onPrevious - Callback to play previous song
 * @param {Object} props.playPauseRef - Ref to the play/pause button for keyboard focus
 * @param {Object} props.channelSelectorRef - Ref to the channel selector with focusFirstButton method
 */
export default function PrevPlayNextControls({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  playPauseRef,
  channelSelectorRef,
}) {
  const handleKeyDown = (e) => {
    if (e.code === 'ArrowUp') {
      e.preventDefault();
      channelSelectorRef?.current?.focusFirstButton?.();
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
