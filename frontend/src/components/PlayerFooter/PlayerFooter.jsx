import React, { useCallback } from 'react';
import TimerSlider from '../TimerSlider/TimerSlider';
import PlaybackControls from '../PlaybackControls/PlaybackControls';
import FavoriteButton from '../FavoriteButton/FavoriteButton';
import { usePlayerControls } from '../../hooks/usePlayerControls';
import './PlayerFooter.css';

export default function PlayerFooter({
  currentTime,
  duration,
  onSeek,
  isFullscreen,
  showUI,
  isPlaying,
  currentChannel,
  onPlayPause,
  onNext,
  onFullscreenToggle,
  onPrevious,
  isCCEnabled,
  onCCToggle,
  user,
  currentSong
}) {
  // Seek helpers
  const seekBackward = useCallback(() => onSeek(Math.max(currentTime - 5, 0)), [currentTime, onSeek]);
  const seekForward  = useCallback(() => onSeek(Math.min(currentTime + 5, duration)), [currentTime, duration, onSeek]);

  // Attach keyboard & double-click handlers
  const { handleDoubleClick } = usePlayerControls({
    onPrevious,
    onNext,
    onPlayPause,
    onFullscreenToggle,
    onCCToggle,
    onSeekBackward: seekBackward,
    onSeekForward: seekForward
  });

  return (
    <div
      className={`player-footer ${showUI ? 'visible' : 'hidden'}`}
      onDoubleClick={handleDoubleClick}
      style={{
        bottom: isFullscreen ? '15%' : 0,
        paddingBottom: isFullscreen ? 0 : 80
      }}
    >
      <div className="slider-container">
        <button
          className="seek-button"
          aria-label="Seek backward 5 seconds"
          onClick={seekBackward}
          tabIndex={0}
        >
          -5
        </button>

        <TimerSlider
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          style={{
            height: 40,
            pointerEvents: 'auto',
            zIndex: 2147483647,
            flex: 1,
            fontSize: 12
          }}
        />

        <button
          className="seek-button"
          aria-label="Seek forward 5 seconds"
          onClick={seekForward}
          tabIndex={0}
        >
          5s
        </button>
      </div>

      <div className="controls-container">
        <PlaybackControls
          isPlaying={isPlaying}
          isFullscreen={isFullscreen}
          currentChannel={currentChannel}
          onPlayPause={onPlayPause}
          onNext={onNext}
          onFullscreenToggle={onFullscreenToggle}
          onPrevious={onPrevious}
          isCCEnabled={isCCEnabled}
          onCCToggle={onCCToggle}
          style={{
            opacity: showUI ? 1 : 0,
            pointerEvents: showUI ? 'auto' : 'none',
            transition: 'opacity 0.3s',
            zIndex: 2147483647
          }}
        />
      </div>

      <div className="player-footer__favorite">
        <FavoriteButton song={currentSong} user={user} />
      </div>
    </div>
  );
}