import PrevPlayNextControls from '../PrevPlayNextControls/PrevPlayNextControls';
import TimerSlider from '../TimerSlider/TimerSlider';
import ControlsFooter from '../ControlsFooter/ControlsFooter';
import './ControlsOverlay.css';

export default function ControlsOverlay({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  isCCEnabled,
  onCCToggle,
  isFullscreen,
  onFullscreenToggle,
  user,
  currentSong,
  onSeek,
  currentTime,
  duration,
}) {
  return (
    <div className="controls-overlay">
      {/* Center Play/Prev/Next */}
<div className={`controls-overlay__center ${isFullscreen ? 'fullscreen' : ''}`}>
  <div className="controls-overlay-relative">
    <div id="seek-overlay-container" className="seek-overlay-container" />
    <PrevPlayNextControls
      isPlaying={isPlaying}
      onPlayPause={onPlayPause}
      onNext={onNext}
      onPrevious={onPrevious}
    />
  </div>
</div>


      {/* Bottom Controls Footer */}
      <ControlsFooter
        isCCEnabled={isCCEnabled}
        onCCToggle={onCCToggle}
        isFullscreen={isFullscreen}
        onFullscreenToggle={onFullscreenToggle}
        user={user}
        currentSong={currentSong}
        onSeek={onSeek}
      />

      {/* Slider Row */}
      <div className={`video-slider-row ${isFullscreen ? 'fullscreen' : 'windowed'}`}>
        <TimerSlider
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          style={{
            height: 40,
            pointerEvents: 'auto',
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            zIndex: 999,
          }}
        />
      </div>
    </div>
  );
}
