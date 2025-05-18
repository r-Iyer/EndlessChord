import TimerSlider from './TimerSlider';
import PlaybackControls from './PlaybackControls';

function PlayerFooter({
  currentTime,
  duration,
  onSeek,
  isFullscreen,
  showUI,
  isPlaying,
  isMuted,
  currentChannel,
  onPlayPause,
  onNext,
  onMuteToggle,
  onFullscreenToggle,
  onSkipForward,
  onSkipBackward,
  onPrevious, // <-- add this prop
}) {
  return (
    <div
      className={`fixed left-0 right-0 bottom-0 z-[2147483647] flex flex-col items-center transition-opacity duration-300 ${showUI ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{
        pointerEvents: 'auto',
        bottom: isFullscreen ? '15%' : 0,
        paddingBottom: isFullscreen ? 0 : 80,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 700,
          minWidth: 350,
          padding: '0 32px',
          pointerEvents: 'auto',
          zIndex: 2147483647,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24, // <-- Add this line to move slider up
        }}
      >
        {/* -5s button */}
        <button
          aria-label="Seek backward 5 seconds"
          onClick={() => onSeek(Math.max(currentTime - 5, 0))}
          style={{
            background: 'rgba(40,40,40,0.6)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            transition: 'background 0.2s',
          }}
          tabIndex={0}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(60,60,60,0.8)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(40,40,40,0.6)'}
        >
          -5
        </button>
        <TimerSlider
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          style={{
            height: 20,
            pointerEvents: 'auto',
            zIndex: 2147483647,
            flex: 1,
            fontSize: 12,
          }}
        />
        {/* +5s button */}
        <button
          aria-label="Seek forward 5 seconds"
          onClick={() => onSeek(Math.min(currentTime + 5, duration))}
          style={{
            background: 'rgba(40,40,40,0.6)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            transition: 'background 0.2s',
          }}
          tabIndex={0}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(60,60,60,0.8)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(40,40,40,0.6)'}
        >
          +5
        </button>
      </div>
      <div
        style={{
          width: '100%',
          maxWidth: 700,
          minWidth: 350,
          padding: '0 32px',
          marginTop: 8,
          pointerEvents: 'auto',
          zIndex: 2147483647,
        }}
      >
        <PlaybackControls
          isPlaying={isPlaying}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          currentChannel={currentChannel}
          onPlayPause={onPlayPause}
          onNext={onNext}
          onMuteToggle={onMuteToggle}
          onFullscreenToggle={onFullscreenToggle}
          onPrevious={onPrevious} // <-- pass down
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
