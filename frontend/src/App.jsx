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
import { useFavoritesHandlers } from './hooks/useFavoriteHandlers';
import useSearch from './hooks/useSearch';
import { getFavorites } from './services/favoritesService';
import './App.css';

function App() {
  
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [allowGuestAccess, setAllowGuestAccess] = useState(false); // NEW: Track guest access
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
    isFetchingSongs, setIsFetchingSongs, history, searchQuery);
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
        
        // eslint-disable-next-line no-unused-vars
        const { playFavorites, isLoading: isFavoritesLoading, error: favoritesError } = useFavoritesHandlers(
          getFavorites,
          {
            setCurrentChannel,
            setCurrentSong,
            setNextSong,
            setQueue,
            setUserInteracted
          }
        );
        
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
        
        
        
        // Don't render anything until auth is checked
        if (!isAuthChecked) {
          return (
            <div className="full-center-screen">
            <Spinner />
            </div>
          );
        }
        
        const showLoader = isLoading || isFavoritesLoading;
        const handlePlayerError = (error) => {
          console.error('❌ Video Player Error:', error); // Log the error for debugging
          handleNextSong();
        };
        // App.js (only the return block shown)
        return (
          <div ref={fullscreenRef} className="app-container">
          {/* Authentication Modal */}
          <AuthModal
          isOpen={showAuthModal}
          onClose={handleGuestAccess}
          onAuthSuccess={handleAuthSuccess}
          onGuestAccess={handleGuestAccess}
          />
          
          <header className={`app-header ${isFullscreen ? 'app-header--hidden' : ''}`}>
          <div className="header-container">
          <div className="layout-column-gap">
          {/* Top row: Search Bar and User Profile */}
          <div className="layout-row-gap align-center">
          <div className="full-width">
          <SearchBar
          onSearch={handleSearch}
          searchQuery={searchQuery}
          className="full-width"
          />
          </div>
          <div className="no-shrink">
          <UserProfile
          user={user}
          onLogout={handleLogout}
          onShowAuth={() => setShowAuthModal(true)}
          onPlayFavorites={playFavorites}
          />
          </div>
          </div>
          
          {/* Bottom row: Channel Selector */}
          <div className="full-width">
          <ChannelSelector
          channels={channels}
          currentChannel={currentChannel}
          onSelectChannel={(channelIdOrName) => {
            setUserInteracted(true);
            setBackendError(false);
            clearSearch();
            const channel =
            channels.find((c) => c._id === channelIdOrName) ||
            channels.find(
              (c) =>
                c.name.replace(/\s+/g, '-').toLowerCase() ===
              channelIdOrName.replace(/\s+/g, '-').toLowerCase()
            );
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
          </header>
          
          <main className="main-container">
          {showLoader && (
            <div className="loader-overlay">
            <Spinner />
            </div>
          )}
          
          {currentSong && !showLoader && (
            <>
            <VideoPlayer
            currentSong={currentSong}
            isPlaying={isPlaying}
            onReady={handlePlayerReady}
            onStateChange={handlePlayerStateChange}
            onError={handlePlayerError}
            playerRef={playerRef}
            isCCEnabled={isCCEnabled}
            />
            <SongInfo
            song={currentSong}
            nextSong={nextSong}
            laterSong={queue?.[0] ?? null}
            visible={showInfo}
            />
            <PlayerFooter
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            isFullscreen={isFullscreen}
            showUI={showUI}
            isPlaying={isPlaying}
            currentChannel={
              isSearchMode ? { name: `Search: ${searchQuery}` } : currentChannel
            }
            onPlayPause={togglePlayPause}
            onNext={handleNextSong}
            onFullscreenToggle={toggleFullscreen}
            onPrevious={handlePreviousSong}
            isCCEnabled={isCCEnabled}
            onCCToggle={() => setIsCCEnabled((prev) => !prev)}
            user={user}
            currentSong={currentSong}
            />
            </>
          )}
          
          {!showLoader && backendError && userInteracted && (
            <div className="centered-fullscreen">
            <p className="error-message">Backend is down or not responding.</p>
            </div>
          )}
          
          {!showLoader && !backendError && !currentSong && !userInteracted && (
            <div className="centered-fullscreen">
            <p className="text-message">Please select a channel or search for songs.</p>
            </div>
          )}
          
          {!showLoader && !backendError && !currentSong && userInteracted && (
            <div className="centered-fullscreen">
            {isSearchMode ? (
              <>
              <p className="text-message">No songs found for “{searchQuery}”.</p>
              <button onClick={clearSearch} className="clear-search-button">
              Clear Search
              </button>
              </>
            ) : (
              <p className="text-message">No songs found for this channel.</p>
            )}
            </div>
          )}
          </main>
          </div>
        );
        
        
      }
      
      export default App;