import { useState, useRef } from 'react';
import './App.css';

import { fetchChannelById } from './services/channelService';
import { getFavorites } from './services/favoritesService';

import Spinner from './components/Spinner/Spinner';
import AuthModal from './components/AuthModal/AuthModal';
import MainPlayerSection from './components/MainPlayerSection/MainPlayerSection';
import Header from './components/Header/Header';

import useAuth from './hooks/useAuth';
import useSearch from './hooks/useSearch';
import useSongQueue from './hooks/useSongQueue';
import usePlayerHandlers from './hooks/usePlayerHandlers';
import usePlayerEffects from './hooks/usePlayerEffects';
import useChannelHandlers from './hooks/useChannelHandlers';
import useInitialLoad from './hooks/useInitialLoad';
import useFullscreen from './hooks/useFullscreen';
import { useFavoritesHandlers } from './hooks/useFavoriteHandlers';

function App() {
  // UI state
  const [isCCEnabled, setIsCCEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [backendError, setBackendError] = useState(false);

  // Playback state
  const [currentChannel, setCurrentChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [nextSong, setNextSong] = useState(null);
  const [history, setHistory] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Loading & interaction flags
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSongs, setIsFetchingSongs] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Time tracking
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Refs for player, fullscreen container, and timeouts
  const playerRef = useRef(null);
  const fullscreenRef = useRef(null);
  const infoTimeoutRef = useRef(null);
  const uiTimeoutRef = useRef(null);

  // Authentication & user state
  const {
    user,
    showAuthModal,
    setShowAuthModal,
    isAuthChecked,
    allowGuestAccess,
    handleAuthSuccess,
    handleLogout,
    handleGuestAccess
  } = useAuth();

  const hideAuthModal = () => setShowAuthModal(false);

  // Search hook
  const {
    searchQuery,
    isSearchMode,
    handleSearch,
    clearSearch,
    getSearchFromURL
  } = useSearch(
    setUserInteracted,
    setBackendError,
    setIsPlaying,
    setCurrentSong,
    setNextSong,
    setQueue,
    setIsLoading,
    setCurrentChannel
  );

  // Song queue management
  const {
    fetchSongsForChannel,
    fetchMoreSongs
  } = useSongQueue(
    currentChannel,
    currentSong,
    setCurrentSong,
    nextSong,
    setNextSong,
    queue,
    setQueue,
    isFetchingSongs,
    setIsFetchingSongs,
    history,
    searchQuery
  );

  // Player control handlers
  const {
    handleSeek,
    handlePreviousSong,
    handleNextSong,
    handleLaterSong,
    togglePlayPause,
    handlePlayerReady,
    handlePlayerStateChange,
    handlePlayerError
  } = usePlayerHandlers(
    playerRef,
    isPlaying,
    setIsPlaying,
    currentSong,
    setCurrentSong,
    nextSong,
    setNextSong,
    queue,
    setQueue,
    fetchMoreSongs,
    history,
    setHistory,
    setCurrentTime,
    setPlayerReady,
    isInitialLoad,
    setIsInitialLoad,
    setShowInfo
  );

  // Player effects (time updates & UI hiding)
  usePlayerEffects({
    currentSong,
    setShowInfo,
    infoTimeoutRef,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    playerRef,
    setShowUI,
    uiTimeoutRef,
    setPlayerReady,
    playerReady,
    isPlaying
  });

  // Channel selection & URL handling
  const { setChannelNameInURL, selectChannel } = useChannelHandlers(
    setUserInteracted,
    setBackendError,
    setIsPlaying,
    setCurrentSong,
    setNextSong,
    setQueue,
    setHistory,
    setIsLoading,
    setIsFetchingSongs,
    setCurrentChannel,
    fetchChannelById,
    fetchSongsForChannel,
    currentChannel,
    channels
  );

  // Initial load (channels, URL params, etc.)
  useInitialLoad({
    isAuthChecked,
    allowGuestAccess,
    currentChannel,
    isLoading,
    setChannels,
    getSearchFromURL,
    handleSearch,
    selectChannel
  });

  // Fullscreen.toggle
  const { toggleFullscreen } = useFullscreen(isFullscreen, setIsFullscreen, fullscreenRef);

  // Favorites handler
  const { playFavorites} = useFavoritesHandlers(
    getFavorites,
    {
      setCurrentChannel,
      setCurrentSong,
      setNextSong,
      setQueue,
      setUserInteracted,
      setIsLoading
    }
  );

  // Early return: spinner until auth check completes
  if (!isAuthChecked) {
    return (
      <div className="full-center-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div ref={fullscreenRef} className="app-container">
      {/* AuthModal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={hideAuthModal}
        onAuthSuccess={handleAuthSuccess}
        onGuestAccess={handleGuestAccess}
      />

      {/* Header */}
      <Header
        isFullscreen={isFullscreen}
        setShowAuthModal={setShowAuthModal}
        searchQuery={searchQuery}
        handleSearch={handleSearch}
        user={user}
        handleLogout={handleLogout}
        playFavorites={playFavorites}
        channels={channels}
        currentChannel={currentChannel}
        isSearchMode={isSearchMode}
        setUserInteracted={setUserInteracted}
        setBackendError={setBackendError}
        clearSearch={clearSearch}
        setChannelNameInURL={setChannelNameInURL}
        selectChannel={selectChannel}
      />

      <main className="main-container">
        {/* Global loader overlay */}
        {isLoading && (
          <div className="loader-overlay">
            <Spinner />
          </div>
        )}

        {/* MainPlayerSection */}
        <MainPlayerSection
          showLoader={isLoading}
          currentSong={currentSong}
          nextSong={nextSong}
          queue={queue}
          showInfo={showInfo}
          isPlaying={isPlaying}
          onReady={handlePlayerReady}
          onStateChange={handlePlayerStateChange}
          onError={handlePlayerError}
          playerRef={playerRef}
          isCCEnabled={isCCEnabled}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          isFullscreen={isFullscreen}
          showUI={showUI}
          currentChannel={currentChannel}
          isSearchMode={isSearchMode}
          searchQuery={searchQuery}
          clearSearch={clearSearch}
          backendError={backendError}
          userInteracted={userInteracted}
          user={user}
          onPlayPause={togglePlayPause}
          onNext={handleNextSong}
          onLater={handleLaterSong}
          onFullscreenToggle={toggleFullscreen}
          onPrevious={handlePreviousSong}
          onCCToggle={() => setIsCCEnabled(prev => !prev)}
          isFetchingSongs = {isFetchingSongs}
        />
      </main>
    </div>
  );
}

export default App;
