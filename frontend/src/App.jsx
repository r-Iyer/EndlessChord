import { useState, useEffect, useRef } from 'react';
import { fetchChannels, fetchChannelById } from './services/apiService';
import authService from './services/authService';
import ChannelSelector from './components/ChannelSelector/ChannelSelector';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import SongInfo from './components/SongInfo/SongInfo';
import Spinner from './components/Spinner/Spinner';
import PlayerFooter from './components/PlayerFooter/PlayerFooter';
import SearchBar from './components/SearchBar/SearchBar';
import AuthModal from './components/AuthModal/AuthModal';
import UserProfile from './components/UserProfile/UserProfile';
import usePlayerHandlers from './hooks/usePlayerHandlers';
import useSongQueue from './hooks/useSongQueue';
import useFullscreen from './hooks/useFullscreen';
import useChannelHandlers from './hooks/useChannelHandlers';
import usePlayerEffects from './hooks/usePlayerEffects';
import useSearch from './hooks/useSearch';
import './App.css';

function App() {
  // Authentication state
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [allowGuestAccess, setAllowGuestAccess] = useState(false); // NEW: Track guest access

  // Existing state
  const [isCCEnabled, setIsCCEnabled] = useState(false);
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
  
  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = () => {
      if (authService.isAuthenticated()) {
        setUser(authService.getCurrentUser());
        setAllowGuestAccess(true); // Authenticated users can access everything
      } else {
        setShowAuthModal(true);
      }
      setIsAuthChecked(true);
    };

    checkAuth();
  }, []);

  // Handle authentication success
  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setShowAuthModal(false);
    setAllowGuestAccess(true);
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    setAllowGuestAccess(false);
    setShowAuthModal(true);
  };

  // NEW: Handle guest access (when modal is closed without auth)
  const handleGuestAccess = () => {
    setShowAuthModal(false);
    setAllowGuestAccess(true);
  };

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
  
  const { 
    fetchSongsForChannel, 
    fetchMoreSongs 
  } = useSongQueue( currentChannel, currentSong, setCurrentSong, nextSong, setNextSong, queue, setQueue, 
    isFetchingSongs, setIsFetchingSongs, isInitialLoad, setIsInitialLoad, history, searchQuery);
  const {
    handleSeek,
    handlePreviousSong,
    handleNextSong,
    togglePlayPause,
    handlePlayerReady,
    handlePlayerStateChange,
  } = usePlayerHandlers(
    playerRef, isPlaying, setIsPlaying, currentSong, setCurrentSong, nextSong, setNextSong, queue, setQueue, fetchMoreSongs, 
    history, setHistory, setCurrentTime, setPlayerReady, isInitialLoad, setIsInitialLoad, setShowInfo);
    
  usePlayerEffects(
    currentSong, setShowInfo, infoTimeoutRef, currentTime, setCurrentTime, duration, setDuration, playerRef);
    
  const { setChannelNameInURL, selectChannel } = useChannelHandlers(
    setUserInteracted, setBackendError, setIsPlaying, setCurrentSong, setNextSong, setQueue, setIsLoading,
    setCurrentChannel, fetchChannelById, fetchSongsForChannel, currentChannel, channels
  );
  
  const { toggleFullscreen } = useFullscreen(isFullscreen, setIsFullscreen, fullscreenRef);
  
  // Helper: get channel name from URL query param
  const getChannelNameFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('channel');
  };
  
  // MODIFIED: Load initial data if auth is checked AND (user is authenticated OR guest access is allowed)
  useEffect(() => {
    if (!isAuthChecked || (!authService.isAuthenticated() && !allowGuestAccess)) return;

    let mounted = true;
    
    const loadInitialData = async () => {
      try {
        const data = await fetchChannels();
        if (!mounted) return;
        setChannels(data);
        
        // Check if search query exists in URL first
        const urlSearchQuery = getSearchFromURL();
        if (urlSearchQuery) {
          handleSearch(urlSearchQuery);
        } else {
          // Otherwise look for channel
          const urlChannelName = getChannelNameFromURL();
          let channelToSelect = null;
          
          if (urlChannelName) {
            channelToSelect = data.find(
              c => c.name.replace(/\s+/g, '-').toLowerCase() === urlChannelName.replace(/\s+/g, '-').toLowerCase()
            );
          }
          
          if (
            channelToSelect &&
            (!currentChannel || currentChannel._id !== channelToSelect._id)
          ) {
            if (!isLoading) selectChannel(channelToSelect._id);
          } else if (data.length > 0 && !currentChannel) {
            if (!isLoading) selectChannel(data[0]._id);
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    
    loadInitialData();
    return () => { mounted = false; };
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthChecked, allowGuestAccess]); // MODIFIED: Added allowGuestAccess as dependency
  
  // Auto-hide UI (controls + slider) after inactivity
  useEffect(() => {
    const showAndResetTimer = () => {
      setShowUI(true);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      uiTimeoutRef.current = setTimeout(() => setShowUI(false), 2500);
    };
    
    window.addEventListener('mousemove', showAndResetTimer);
    window.addEventListener('touchstart', showAndResetTimer, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', showAndResetTimer);
      window.removeEventListener('touchstart', showAndResetTimer);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    };
  }, []);
  
  useEffect(() => {
    setPlayerReady(false);
  }, [currentSong]);
  
  useEffect(() => {
    let intervalId;
    // Use a function to get the latest ref value
    const getPlayer = () => playerRef.current;
    if (currentSong && playerReady && getPlayer() && typeof getPlayer().getCurrentTime === 'function') {
      intervalId = setInterval(() => {
        try {
          const player = getPlayer();
          const time = player.getCurrentTime() || 0;
          const dur = player.getDuration() || 0;
          setCurrentTime(Math.floor(time));
          if (dur) setDuration(Math.floor(dur));
        } catch {}
      }, 500);
    }
    return () => intervalId && clearInterval(intervalId);
  }, [currentSong, playerReady, setCurrentTime, setDuration]);
  
  
  // Keyboard shortcuts for previous (Q) and next (E)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        handlePreviousSong();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleNextSong();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePreviousSong, handleNextSong]);

  // Don't render anything until auth is checked
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  
  return (
    <div ref={fullscreenRef} className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Authentication Modal - MODIFIED: Pass handleGuestAccess */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={handleGuestAccess} // This handles the X button click
        onAuthSuccess={handleAuthSuccess}
        onGuestAccess={handleGuestAccess} // If your AuthModal has a guest button
      />

      <header className={`p-4 bg-gray-800 transition-opacity duration-300 ${isFullscreen ? 'hidden' : 'opacity-100'}`}>
        <div className="container mx-auto">
          <div className="flex flex-col gap-4">
            {/* Top row: Search Bar and User Profile */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <SearchBar 
                  onSearch={handleSearch} 
                  searchQuery={searchQuery}
                  className="w-full"
                />
              </div>
              
              {/* User Profile */}
              <div className="flex-shrink-0">
                <UserProfile 
                  user={user}
                  onLogout={handleLogout}
                  onShowAuth={() => setShowAuthModal(true)}
                />
              </div>
            </div>
            
            {/* Bottom row: Channel Selector */}
            <div className="w-full">
              <div className="flex items-center">
                <ChannelSelector
                  channels={channels}
                  currentChannel={currentChannel}
                  onSelectChannel={channelIdOrName => {
                    setUserInteracted(true);
                    setBackendError(false);
                    clearSearch(); // Clear any active search
                    
                    // Find channel by id or name, then update URL and select
                    let channel = channels.find(c => c._id === channelIdOrName);
                    if (!channel) {
                      channel = channels.find(
                        c => c.name.replace(/\s+/g, '-').toLowerCase() === channelIdOrName.replace(/\s+/g, '-').toLowerCase()
                      );
                    }
                    if (channel) {
                      setChannelNameInURL(channel.name.replace(/\s+/g, '-'));
                      selectChannel(channel._id);
                    }
                  }}
                  disabled={isSearchMode}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-stretch justify-start relative">
        {/* Show spinner while loading */}
        {isLoading && (
          <div className="flex items-center justify-center h-full w-full absolute top-0 left-0 z-50 bg-black bg-opacity-70">
            <Spinner />
          </div>
        )}

        {/* Show player UI only if currentSong exists and not loading */}
        {currentSong && !isLoading && (
          <>
            <VideoPlayer
              currentSong={currentSong}
              isPlaying={isPlaying}
              onReady={handlePlayerReady}
              onStateChange={handlePlayerStateChange}
              onError={() => handleNextSong()}
              playerRef={playerRef}
              isCCEnabled={isCCEnabled}
            />
            <SongInfo
              song={currentSong}
              nextSong={currentSong !== nextSong ? nextSong : null}
              laterSong={
                queue && queue.length > 0 && queue[0] !== nextSong ? queue[0] : null
              }
              visible={showInfo}
            />
            <PlayerFooter
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              isFullscreen={isFullscreen}
              showUI={showUI}
              isPlaying={isPlaying}
              currentChannel={isSearchMode ? { name: `Search: ${searchQuery}` } : currentChannel}
              onPlayPause={togglePlayPause}
              onNext={handleNextSong}
              onFullscreenToggle={toggleFullscreen}
              onPrevious={handlePreviousSong}
              isCCEnabled={isCCEnabled}
              onCCToggle={() => setIsCCEnabled(prev => !prev)}
            />
          </>
        )}

        {/* Show backend error if user interacted and backend failed */}
        {!isLoading && backendError && userInteracted && (
          <div className="flex items-center justify-center h-full w-full">
            <p className="text-lg text-red-400">Backend is down or not responding.</p>
          </div>
        )}

        {/* Show "no song" message only if user has NOT interacted */}
        {!isLoading && !backendError && !currentSong && !userInteracted && (
          <div className="flex items-center justify-center h-full w-full">
            <p className="text-lg">Please select a channel or search for songs.</p>
          </div>
        )}

        {/* If user interacted, not loading, not backend error, but no song */}
        {!isLoading && !backendError && !currentSong && userInteracted && (
          <div className="flex items-center justify-center h-full w-full">
            {isSearchMode ? (
              <div className="text-center">
                <p className="text-lg">No songs found for "{searchQuery}".</p>
                <button 
                  onClick={clearSearch}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition duration-150"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <p className="text-lg">No songs found for this channel.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;