import { useState, useEffect } from 'react';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import SongInfo from '../SongInfo/SongInfo';
import PlayerFooter from '../PlayerFooter/PlayerFooter';

export default function PlayerContainer({
  currentSong,
  nextSong,
  queue,
  showInfo,
  isPlaying,
  onReady,
  onStateChange,
  onError,
  playerRef,
  isCCEnabled,
  currentTime,
  duration,
  onSeek,
  isFullscreen,
  showUI,
  currentChannel,
  onPlayPause,
  onNext,
  onLater,
  onFullscreenToggle,
  onPrevious,
  onCCToggle,
  user,
}) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    // reset when song changes
    setIsVideoLoaded(false);
  }, [currentSong?.videoId]);

  const handleStateChange = (event) => {
    if (event.data === 1) {
      setIsVideoLoaded(true);
    }

    if (typeof onStateChange === 'function') {
      onStateChange(event);
    }
  };

  return (
    <div className="player-container">
      <VideoPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        onReady={onReady}
        onStateChange={handleStateChange}
        onError={onError}
        playerRef={playerRef}
        isCCEnabled={isCCEnabled}
      />

      <SongInfo
        song={currentSong}
        nextSong={nextSong}
        laterSong={queue?.[0] ?? null}
        visible={showInfo && isVideoLoaded}
        onNext={onNext}
        onLater={onLater}
      />

      <PlayerFooter
        currentTime={currentTime}
        duration={duration}
        onSeek={onSeek}
        isFullscreen={isFullscreen}
        showUI={showUI}
        isPlaying={isPlaying}
        currentChannel={currentChannel}
        onPlayPause={onPlayPause}
        onNext={onNext}
        onFullscreenToggle={onFullscreenToggle}
        onPrevious={onPrevious}
        isCCEnabled={isCCEnabled}
        onCCToggle={onCCToggle}
        user={user}
        currentSong={currentSong}
      />
    </div>
  );
}
