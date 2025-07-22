import { useState, useEffect } from 'react';
import VideoWithControls from '../VideoWithControls/VideoWithControls';
import SongInfo from '../SongInfo/SongInfo';

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
  onPlayPause,
  onNext,
  onLater,
  onFullscreenToggle,
  onPrevious,
  onCCToggle,
  user,
  channelSelectorRef,
  playPauseRef,
  setPlayerTemporarilyFrozen,
  setCurrentSong,
  albums,
  setAlbums
}) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    setIsVideoLoaded(false); // reset on song change
  }, [currentSong?.videoId]);

  const handleStateChange = (event) => {
    if (event.data === 1) {
      setIsVideoLoaded(true); // video started playing
    }

    if (typeof onStateChange === 'function') {
      onStateChange(event);
    }
  };

  return (
    <div className="player-container">
      <VideoWithControls
        currentSong={currentSong}
        isPlaying={isPlaying}
        isCCEnabled={isCCEnabled}
        onReady={onReady}
        onStateChange={handleStateChange}
        onError={onError}
        playerRef={playerRef}
        onPlayPause={onPlayPause}
        onNext={onNext}
        onPrevious={onPrevious}
        onCCToggle={onCCToggle}
        isFullscreen={isFullscreen}
        onFullscreenToggle={onFullscreenToggle}
        currentTime={currentTime}
        duration={duration}
        onSeek={onSeek}
        user={user}
        showUI={showUI}
        channelSelectorRef={channelSelectorRef}
        playPauseRef={playPauseRef}
        setPlayerTemporarilyFrozen={ setPlayerTemporarilyFrozen }
        setCurrentSong={setCurrentSong}
        albums={albums}
        setAlbums={setAlbums}
      />

      <SongInfo
        song={currentSong}
        nextSong={nextSong}
        laterSong={queue?.[0] ?? null}
        visible={showInfo && isVideoLoaded}
        onNext={onNext}
        onLater={onLater}
      />
    </div>
  );
}
