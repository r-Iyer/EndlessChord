import React, { forwardRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

const PlaybackControls = forwardRef(function PlaybackControls({
  isPlaying, 
  isMuted,
  isFullscreen,
  onPlayPause, 
  onNext, 
  onMuteToggle,
  onFullscreenToggle,
  onPrevious,
  style
}, ref) {
  return (
    <div
      ref={ref}
      className={`
        fixed bottom-0 left-0 right-0 
        bg-gradient-to-t from-black/90 via-black/50 to-transparent
        py-6 px-4
        z-50
        ${isFullscreen ? 'mb-0' : ''}
      `}
      style={style}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-center space-x-4">
          <button 
            className="rounded-full bg-white bg-opacity-20 p-3 hover:bg-opacity-30 transition-colors"
            onClick={onPrevious}
            aria-label="Previous Song"
          >
            <SkipBack size={24} />
          </button>
          <button 
            className="rounded-full bg-white bg-opacity-20 p-3 hover:bg-opacity-30 transition-colors"
            onClick={onPlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button 
            className="rounded-full bg-white bg-opacity-20 p-3 hover:bg-opacity-30 transition-colors"
            onClick={onNext}
            aria-label="Next Song"
          >
            <SkipForward size={24} />
          </button>
          <button 
            className="rounded-full bg-white bg-opacity-20 p-3 hover:bg-opacity-30 transition-colors"
            onClick={onMuteToggle}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
          <button 
            className="rounded-full bg-white bg-opacity-20 p-3 hover:bg-opacity-30 transition-colors"
            onClick={onFullscreenToggle}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
});

export default PlaybackControls;