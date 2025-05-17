import React, { forwardRef } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

const PlaybackControls = forwardRef(function PlaybackControls({
  isPlaying, 
  isMuted,
  isFullscreen,
  currentChannel,
  onPlayPause, 
  onNext, 
  onMuteToggle,
  onFullscreenToggle,
  style
}, ref) {
  return (
    <div
      ref={ref}
      className={`
        fixed bottom-0 left-0 right-0 
        bg-gradient-to-t from-black to-transparent 
        p-4 
        z-50
        ${isFullscreen ? 'mb-0' : ''}
      `}
      style={style}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause button */}
            <button 
              className="rounded-full bg-white bg-opacity-20 p-3 hover:bg-opacity-30 transition-colors"
              onClick={onPlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            {/* Next button */}
            <button 
              className="rounded-full bg-white bg-opacity-20 p-3 hover:bg-opacity-30 transition-colors"
              onClick={onNext}
              aria-label="Next Song"
            >
              <SkipForward size={24} />
            </button>
            
            {/* Mute button */}
            <button 
              className="rounded-full bg-white bg-opacity-20 p-3 hover:bg-opacity-30 transition-colors"
              onClick={onMuteToggle}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            {/* Fullscreen button */}
            <button 
              className="rounded-full bg-white bg-opacity-20 p-3 hover:bg-opacity-30 transition-colors"
              onClick={onFullscreenToggle}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
          
          {/* Channel info */}
          <div className="text-right">
            {currentChannel && (
              <div>
                <p className="text-lg font-medium">{currentChannel.name}</p>
                <p className="text-sm text-gray-400">{currentChannel.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default PlaybackControls;