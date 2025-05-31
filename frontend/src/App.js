import { useState, useRef } from 'react';
import { fetchChannelById } from './services/channelService';
import Spinner from './components/Spinner/Spinner';
import AuthModal from './components/AuthModal/AuthModal';
import usePlayerHandlers from './hooks/usePlayerHandlers';
import useSongQueue from './hooks/useSongQueue';
import useFullscreen from './hooks/useFullscreen';
import useChannelHandlers from './hooks/useChannelHandlers';
import usePlayerEffects from './hooks/usePlayerEffects';
import { useFavoritesHandlers } from './hooks/useFavoriteHandlers';
import useSearch from './hooks/useSearch';
import { getFavorites } from './services/favoritesService';
import useAuth from './hooks/useAuth';
import useInitialLoad from './hooks/useInitialLoad';
import MainPlayerSection from './components/MainPlayerSection/MainPlayerSection';
import Header from './components/Header/Header';
import './App.css';

function App() {
  const [isCCEnabled, setIsCCEnabled] = useState(true);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [nextSong, setNextSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const playerRef = useRef(null);
  const [showInfo, setShowInfo] = useState(false);
  const infoTimeoutRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const uiTimeoutRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSongs, setIsFetchingSongs] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [history, setHistory] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const fullscreenRef = useRef(null);
  
  const {
    // eslint-disable-next-line no-unused-vars
    user, setUser, showAuthModal, setShowAuthModal, isAuthChecked,
    allowGuestAccess, handleAuthSuccess, handleLogout, handleGuestAccess
  } = useAuth();
  
  const {
    searchQuery, isSearchMode, handleSearch, clearSearch, getSearchFromURL
  } = useSearch(
    setUserInteracted, setBackendError, setIsPlaying, setCurrentSong,
    setNextSong, setQueue, setIsLoading, setCurrentChannel
  );
  
  const {
    fetchSongsForChannel, fetchMoreSongs
  } = useSongQueue(
    currentChannel, currentSong, setCurrentSong, nextSong, setNextSong, queue,
    setQueue, isFetchingSongs, setIsFetchingSongs, history, searchQuery
  );
  
  const {
    handleSeek, handlePreviousSong, handleNextSong, togglePlayPause,
    handlePlayerReady, handlePlayerStateChange, handlePlayerError
  } = usePlayerHandlers(
    playerRef, isPlaying, setIsPlaying, currentSong, setCurrentSong, nextSong,
    setNextSong, queue, setQueue, fetchMoreSongs, history, setHistory,
    setCurrentTime, setPlayerReady, isInitialLoad, setIsInitialLoad, setShowInfo
  );
  
  usePlayerEffects({
    currentSong, setShowInfo, infoTimeoutRef, currentTime, setCurrentTime,
    duration, setDuration, playerRef, setShowUI, uiTimeoutRef,
    setPlayerReady, playerReady, isPlaying
  });
  
  const { setChannelNameInURL, selectChannel } = useChannelHandlers(
    setUserInteracted, setBackendError, setIsPlaying, setCurrentSong,
    setNextSong, setQueue, setIsLoading, setCurrentChannel, fetchChannelById,
    fetchSongsForChannel, currentChannel, channels
  );
  
  useInitialLoad({
    isAuthChecked, allowGuestAccess, currentChannel, isLoading,
    setChannels, getSearchFromURL, handleSearch, selectChannel,
  });
  
  const { toggleFullscreen } = useFullscreen(isFullscreen, setIsFullscreen, fullscreenRef);
  
  const { playFavorites, isLoading: isFavoritesLoading } = useFavoritesHandlers(
    getFavorites, { setCurrentChannel, setCurrentSong, setNextSong, setQueue, setUserInteracted }
  );
  
  const showLoader = isLoading || isFavoritesLoading;
  
  if (!isAuthChecked) {
    return <div className="full-center-screen"><Spinner /></div>;
  }
  
  return (
    <div ref={fullscreenRef} className="app-container">
    <AuthModal
    isOpen={showAuthModal}
    onClose={handleGuestAccess}
    onAuthSuccess={handleAuthSuccess}
    onGuestAccess={handleGuestAccess}
    />
    
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
    <MainPlayerSection
    showLoader={showLoader}
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
    onFullscreenToggle={toggleFullscreen}
    onPrevious={handlePreviousSong}
    onCCToggle={() => setIsCCEnabled((prev) => !prev)}
    />
    </main>
    </div>
  );
}

export default App;