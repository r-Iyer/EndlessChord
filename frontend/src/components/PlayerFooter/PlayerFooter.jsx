import TimerSlider from '../TimerSlider/TimerSlider';
import PlaybackControls from '../PlaybackControls/PlaybackControls';
import './PlayerFooter.css';

function PlayerFooter({
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
  onCCToggle
}) {
  const handleSeekBackward = () => {
    onSeek(Math.max(currentTime - 5, 0));
  };

  const handleSeekForward = () => {
    onSeek(Math.min(currentTime + 5, duration));
  };

  return (
    <div
      className={`player-footer ${showUI ? 'visible' : 'hidden'}`}
      style={{
        
        bottom: isFullscreen ? '15%' : 0,
        paddingBottom: isFullscreen ? 0 : 80,
      }}
    >
      <div className="slider-container">
        <button
          className="seek-button"
          aria-label="Seek backward 5 seconds"
          onClick={handleSeekBackward}
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
            fontSize: 12,
          }}
        />
        
        <button
          className="seek-button"
          aria-label="Seek forward 5 seconds"
          onClick={handleSeekForward}
          tabIndex={0}
        >
          +5
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
            zIndex: 2147483647,
          }}
        />
      </div>
    </div>
  );
}

export default PlayerFooter;