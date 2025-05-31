import Spinner from '../Spinner/Spinner';
import PlayerContainer from '../PlayerContainer/PlayerContainer';

export default function MainPlayerSection({
  showLoader,
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
  isSearchMode,
  searchQuery,
  clearSearch,
  backendError,
  userInteracted,
  user,
  onPlayPause,
  onNext,
  onLater,
  onFullscreenToggle,
  onPrevious,
  onCCToggle,
}) {
  if (showLoader) {
    return (
      <div className="loader-overlay">
        <Spinner />
      </div>
    );
  }

  if (currentSong) {
    return (
      <PlayerContainer
        currentSong={currentSong}
        nextSong={nextSong}
        queue={queue}
        showInfo={showInfo}
        isPlaying={isPlaying}
        onReady={onReady}
        onStateChange={onStateChange}
        onError={onError}
        playerRef={playerRef}
        isCCEnabled={isCCEnabled}
        currentTime={currentTime}
        duration={duration}
        onSeek={onSeek}
        isFullscreen={isFullscreen}
        showUI={showUI}
        currentChannel={isSearchMode ? { name: `Search: ${searchQuery}` } : currentChannel}
        onPlayPause={onPlayPause}
        onNext={onNext}
        onLater={onLater}
        onFullscreenToggle={onFullscreenToggle}
        onPrevious={onPrevious}
        onCCToggle={onCCToggle}
        user={user}
      />
    );
  }

  if (backendError && userInteracted) {
    return (
      <div className="centered-fullscreen">
        <p className="error-message">Backend is down or not responding.</p>
      </div>
    );
  }

  if (!backendError && !currentSong && !userInteracted) {
    return (
      <div className="centered-fullscreen">
        <p className="text-message">Please select a channel or search for songs.</p>
      </div>
    );
  }

  if (!backendError && !currentSong && userInteracted) {
    return (
      <div className="centered-fullscreen">
        {isSearchMode ? (
          <>
            <p className="text-message">No songs found for “{searchQuery}”.</p>
            <button onClick={clearSearch} className="clear-search-button">Clear Search</button>
          </>
        ) : (
          <p className="text-message">No songs found for this channel.</p>
        )}
      </div>
    );
  }

  return null;
}