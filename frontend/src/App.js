import { useState, useRef, useEffect } from 'react';
import './App.css';
import Spinner from './components/Spinner/Spinner';
import AuthModal from './components/AuthModal/AuthModal';
import MainPlayerSection from './components/MainPlayerSection/MainPlayerSection';
import Header from './components/Header/Header';

import useAuth from './hooks/useAuth';
import useSearch from './hooks/useSearch';
import useSongQueue from './hooks/useSongQueue';
import usePlayerHandlers from './hooks/usePlayerHandlers';
import usePlayerEffects from './hooks/usePlayerEffects';
import usePlayerShortcuts from './hooks/usePlayerShortcuts';
import useChannelHandlers from './hooks/useChannelHandlers';
import useAlbumHandlers from './hooks/useAlbumHandlers';
import useInitialLoad from './hooks/useInitialLoad';
import useFullscreen from './hooks/useFullscreen';
import { useFavoritesHandlers } from './hooks/useFavoriteHandlers';

import { fetchChannelById } from './services/channelService';
import { getFavorites } from './services/favoritesService';
import useSongHandlers from './hooks/useSongHandlers';
import { searchService } from './services/searchService';


function App() {
const [channels, setChannels] = useState([]);
const [albums, setAlbums] = useState([]);
const [currentSelection, setCurrentSelection] = useState({ type: null, channel: null, album: null });
const [queue, setQueue] = useState([]);
const [currentSong, setCurrentSong] = useState(null);
const [nextSong, setNextSong] = useState(null);
const [history, setHistory] = useState([]);
const [isPlaying, setIsPlaying] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [isFetchingSongs, setIsFetchingSongs] = useState(false);
const [playerReady, setPlayerReady] = useState(false);
const [userInteracted, setUserInteracted] = useState(false);
const [isInitialLoad, setIsInitialLoad] = useState(true);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
const [isFullscreen, setIsFullscreen] = useState(false);
const [showUI, setShowUI] = useState(true);
const [showInfo, setShowInfo] = useState(false);
const [backendError, setBackendError] = useState(false);
const [isCCEnabled, setIsCCEnabled] = useState(true);
const isFirstLoadRef = useRef(true);

const playerRef = useRef(null);
const fullscreenRef = useRef(null);
const playPauseRef = useRef(null);
const channelSelectorRef = useRef(null);
const infoTimeoutRef = useRef(null);
const uiTimeoutRef = useRef(null);

const {
user, showAuthModal, setShowAuthModal, isAuthChecked,
allowGuestAccess, handleAuthSuccess, handleLogout, handleGuestAccess
} = useAuth();

const { searchQuery, isSearchMode, handleSearch, clearSearch, getSearchFromURL } = useSearch(
setUserInteracted, setBackendError, setIsPlaying, setCurrentSong, setNextSong, setQueue, setIsLoading, setCurrentSelection
);

const { fetchSongsForChannel, fetchMoreSongs } = useSongQueue(
currentSelection, currentSong, setCurrentSong, nextSong, setNextSong, queue, setQueue, isFetchingSongs, setIsFetchingSongs, history, searchQuery
);

const {
handleSeek, handlePreviousSong, handleNextSong, handleLaterSong,
togglePlayPause, handlePlayerReady, handlePlayerStateChange, handlePlayerError
} = usePlayerHandlers(
playerRef, isPlaying, setIsPlaying, currentSong, setCurrentSong, nextSong, setNextSong, queue, setQueue, fetchMoreSongs, history, setHistory,
setCurrentTime, setPlayerReady, isInitialLoad, setIsInitialLoad, setShowInfo
);

const { setPlayerTemporarilyFrozen  } = usePlayerEffects({
currentSong, setShowInfo, infoTimeoutRef, currentTime, setCurrentTime,
duration, setDuration, playerRef, setShowUI, uiTimeoutRef, setPlayerReady,
playerReady, isPlaying, playPauseRef, 
});

const { setChannelNameInURL, selectChannel } = useChannelHandlers(
setUserInteracted, setBackendError, setIsPlaying, setCurrentSong, setNextSong, setQueue,
setHistory, setIsLoading, setIsFetchingSongs, setCurrentSelection, fetchChannelById, fetchSongsForChannel,
currentSelection, channels
);

const { toggleFullscreen } = useFullscreen(isFullscreen, setIsFullscreen, fullscreenRef);

useSongHandlers(currentSong);


usePlayerShortcuts({
onSeek: handleSeek,
onPlayPause: togglePlayPause,
onNext: handleNextSong,
onPrevious: handlePreviousSong,
currentTime,
duration,
onFullscreenToggle: toggleFullscreen,
onCCToggle: () => setIsCCEnabled(prev => !prev),
setShowUI,
uiTimeoutRef,
playPauseRef,
});

const { selectAlbum } = useAlbumHandlers({
setUserInteracted, setBackendError, setIsPlaying, setCurrentSong, setNextSong, setQueue, setHistory,
setIsLoading, setIsFetchingSongs, setCurrentSelection
});


const { loadInitialData } = useInitialLoad({
  isAuthChecked,
  allowGuestAccess,
  currentSelection,
  isLoading,
  setChannels,
  setAlbums,
  getSearchFromURL,
  handleSearch,
  selectChannel,
  selectAlbum,
  setCurrentSelection,
  setIsLoading,
  setCurrentSong,
  setNextSong,
  setQueue,
  user,
  fetchSongsForChannel,
  fetchSearchResults: searchService,
});


const { playFavorites } = useFavoritesHandlers(getFavorites, {
setCurrentSelection, setCurrentSong, setNextSong, setQueue, setUserInteracted, setIsLoading
});

useEffect(() => {
if (isAuthChecked && (user || allowGuestAccess)) {
loadInitialData();
}
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [user, isAuthChecked, allowGuestAccess]);


if (!isAuthChecked) return <div className="full-center-screen"><Spinner /></div>;


return (
<div ref={fullscreenRef} className="app-container">
  <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)}
    onAuthSuccess={handleAuthSuccess} onGuestAccess={handleGuestAccess} />
<Header
isFullscreen={isFullscreen}
setShowAuthModal={setShowAuthModal}
searchQuery={searchQuery}
handleSearch={handleSearch}
user={user}
handleLogout={handleLogout}
playFavorites={playFavorites}
channels={channels}
albums={albums}
setAlbums={setAlbums}
currentSelection={currentSelection}
onSelect={setCurrentSelection}
isSearchMode={isSearchMode}
setUserInteracted={setUserInteracted}
setBackendError={setBackendError}
clearSearch={clearSearch}
setChannelNameInURL={setChannelNameInURL}
selectChannel={selectChannel}
channelSelectorRef={channelSelectorRef}
selectAlbum={selectAlbum}
/>

  <main className="main-container">
    {isLoading && <div className="loader-overlay"><Spinner /></div>}
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
      currentSelection={currentSelection}
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
      isFetchingSongs={isFetchingSongs}
      channelSelectorRef={channelSelectorRef}
      playPauseRef={playPauseRef}
      setPlayerTemporarilyFrozen={ setPlayerTemporarilyFrozen }
      setCurrentSong={setCurrentSong}
      albums={albums}
      setAlbums={setAlbums}
      isFirstLoadRef={isFirstLoadRef}
    />
  </main>
</div>
);
}

export default App;
