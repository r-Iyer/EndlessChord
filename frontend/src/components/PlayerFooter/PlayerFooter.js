import TimerSlider from '../TimerSlider/TimerSlider';
import PlaybackControls from '../PlaybackControls/PlaybackControls';
import FavoriteButton from '../FavoriteButton/FavoriteButton';
import SeekButton from '../SeekButton/SeekButton';
import usePlayerShortcuts from '../../hooks/usePlayerShortcuts';
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
  onCCToggle,
  user,
  currentSong
}) {
  
  usePlayerShortcuts({
    currentTime,
    duration,
    onSeek,
    onPlayPause,
    onNext,
    onPrevious
  });
  
  return (
    <div
    className={`player-footer ${showUI ? 'visible' : 'hidden'}`}
    style={{
      bottom: isFullscreen ? '15%' : 0,
      paddingBottom: isFullscreen ? 0 : 80,
    }}
    >
    <div className="slider-container">
    <SeekButton
    direction="backward"
    currentTime={currentTime}
    duration={duration}
    onSeek={onSeek}
    />
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
    <SeekButton
    direction="forward"
    currentTime={currentTime}
    duration={duration}
    onSeek={onSeek}
    />
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
    
    <div className="player-footer__favorite">
    <FavoriteButton song={currentSong} user={user} />
    </div>
    </div>
  );
}

export default PlayerFooter;
