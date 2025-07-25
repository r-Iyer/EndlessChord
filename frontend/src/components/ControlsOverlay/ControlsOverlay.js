import { useRef } from 'react';
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
  channelSelectorRef,
  playPauseRef,
  setPlayerTemporarilyFrozen,
  setCurrentSong,
  albums,
  setAlbums
}) {
  // Refs for focus redirection
  const fullscreenRef = useRef(null);    // used for ArrowDown

  return (
    <div className="controls-overlay">
      {/* Center Play/Prev/Next */}
      <div className={`controls-overlay__center ${isFullscreen ? 'fullscreen' : ''}`}>
          <PrevPlayNextControls
            isPlaying={isPlaying}
            onPlayPause={onPlayPause}
            onNext={onNext}
            onPrevious={onPrevious}
            playPauseRef={playPauseRef}
            channelSelectorRef={channelSelectorRef}
          />
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
        fullscreenRef={fullscreenRef}
        setPlayerTemporarilyFrozen={ setPlayerTemporarilyFrozen }
        setCurrentSong={setCurrentSong}
        albums={albums}
        setAlbums={setAlbums}
      />

      {/* Slider Row */}
      <div className={`video-slider-row ${isFullscreen ? 'fullscreen' : 'windowed'}`}>
        <TimerSlider
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          upRef={playPauseRef}       // focus up to play/pause
          downRef={fullscreenRef}    // focus down to fullscreen button
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
