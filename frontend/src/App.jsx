import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchChannels, fetchChannelById } from './services/apiService';
import ChannelSelector from './components/ChannelSelector/ChannelSelector';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import SongInfo from './components/SongInfo/SongInfo';
import Spinner from './components/Spinner/Spinner';
import PlayerFooter from './components/PlayerFooter/PlayerFooter';
import usePlayerHandlers from './hooks/usePlayerHandlers';
import usePlayerEffects from './hooks/usePlayerEffects';
import useSongQueue from './hooks/useSongQueue';
import useFullscreen from './hooks/useFullscreen';
import './App.css';

function App() {
  const [currentChannel, setCurrentChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [nextSong, setNextSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const playerRef = useRef(null);
  const infoTimeoutRef = useRef(null); // use ref instead of state for infoTimeout
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const uiTimeoutRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSongs, setIsFetchingSongs] = useState(false); // Add a flag
  const [playerReady, setPlayerReady] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [history, setHistory] = useState([]); // <-- Add history state
  const fullscreenRef = useRef(null);

  const { fetchSongsForChannel, fetchMoreSongs } = useSongQueue(
    currentChannel, currentSong, setCurrentSong, setNextSong, setQueue, isFetchingSongs, setIsFetchingSongs
  );
  const {
    handleSeek,
    handleVideoEnd,
    togglePlayPause,
    handlePlayerStateChange,
  } = usePlayerHandlers(
    playerRef, isPlaying, setIsPlaying, currentSong, setCurrentSong, nextSong, setNextSong, queue, setQueue, fetchMoreSongs, showInfo, setShowInfo, infoTimeoutRef, duration, setCurrentTime
  );
  usePlayerEffects(
    currentSong, showInfo, setShowInfo, infoTimeoutRef, currentTime, setCurrentTime, duration, setDuration, playerRef, isPlaying, setIsPlaying, handleSeek, handleVideoEnd, fetchMoreSongs
  );
  const { toggleFullscreen } = useFullscreen(isFullscreen, setIsFullscreen, fullscreenRef);

  // Helper: get channel name from URL query param
  const getChannelNameFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('channel');
  };

  // Helper: update URL with channel name
  const setChannelNameInURL = (channelName) => {
    const params = new URLSearchParams(window.location.search);
    if (channelName) {
      params.set('channel', channelName);
    } else {
      params.delete('channel');
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  };

  // Modified selectChannel to NOT set isPlaying to true immediately
  const selectChannel = useCallback(
    async (channelIdOrName) => {
      setUserInteracted(true);
      setBackendError(false);
      setIsPlaying(false); // <-- always set to false here
      setCurrentSong(null);
      setNextSong(null);
      setQueue([]);
      setIsLoading(true);
      try {
        let channelData = null;
        if (channels.length > 0 && typeof channelIdOrName === 'string' && !/^[0-9a-fA-F]{24}$/.test(channelIdOrName)) {
          channelData = channels.find(
            c => c.name.replace(/\s+/g, '-').toLowerCase() === channelIdOrName.replace(/\s+/g, '-').toLowerCase()
          );
        }
        if (!channelData) {
          channelData = await fetchChannelById(channelIdOrName);
        }
        // Prevent unnecessary re-selection
        if (currentChannel && currentChannel._id === channelData._id) {
          setIsLoading(false);
          return;
        }
        setCurrentChannel(channelData);
        setChannelNameInURL(channelData.name.replace(/\s+/g, '-'));
        const songs = await fetchSongsForChannel(channelData._id);
        if (songs && songs.length > 0) {
          setCurrentSong(songs[0]);
          setNextSong(songs[1] || null);
          setQueue(songs.slice(2));
          // Do NOT set isPlaying here!
        } else {
          setCurrentSong(null);
          setNextSong(null);
          setQueue([]);
          setIsPlaying(false);
        }
      } catch (error) {
        setBackendError(true);
        setCurrentSong(null);
        setNextSong(null);
        setQueue([]);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchSongsForChannel, channels, currentChannel]
  );

  useEffect(() => {
    let mounted = true;
    // Only run once on mount
    const loadInitialChannel = async () => {
      try {
        const data = await fetchChannels();
        if (!mounted) return;
        setChannels(data);
        const urlChannelName = getChannelNameFromURL();
        let channelToSelect = null;
        if (urlChannelName) {
          channelToSelect = data.find(
            c => c.name.replace(/\s+/g, '-').toLowerCase() === urlChannelName.replace(/\s+/g, '-').toLowerCase()
          );
        }
        // Only select if not already selected
        if (
          channelToSelect &&
          (!currentChannel || currentChannel._id !== channelToSelect._id)
        ) {
          if (!isLoading) selectChannel(channelToSelect._id);
        } else if (data.length > 0 && !currentChannel) {
          if (!isLoading) selectChannel(data[0]._id);
        }
      } catch (error) {
        console.error('Error fetching channels:', error);
      }
    };
    loadInitialChannel();
    return () => { mounted = false; };
    // Only run on mount: remove all dependencies!
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide UI (controls + slider) after inactivity
  useEffect(() => {
    const showAndResetTimer = () => {
      setShowUI(true);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      uiTimeoutRef.current = setTimeout(() => setShowUI(false), 2500);
    };

    window.addEventListener('mousemove', showAndResetTimer);
    window.addEventListener('touchstart', showAndResetTimer, { passive: true }); // Show controls on touch as well

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
  }, [currentSong, playerReady, setCurrentTime, setDuration]); // Add missing dependencies

  // Only define handlePlayerReady here, not in usePlayerHandlers
  const handlePlayerReady = (event) => {
    playerRef.current = event.target;
    setPlayerReady(true);
    setIsPlaying(true);
    event.target.playVideo(); // <-- Force play on ready
  };

  // Modified handleNextSong to push currentSong to history
  const handleNextSong = useCallback(() => {
    if (nextSong) {
      setHistory(prev => [...prev, currentSong]);
      setCurrentSong(nextSong);
      setNextSong(queue[0] || null);
      setQueue(queue.slice(1));
      if (queue.length < 3) fetchMoreSongs();
    } else {
      fetchMoreSongs(true);
    }
  }, [nextSong, currentSong, queue, setCurrentSong, setNextSong, setQueue, fetchMoreSongs]);

  // New handlePreviousSong to pop from history
  const handlePreviousSong = useCallback(() => {
    if (history.length > 0) {
      const prevSong = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setQueue(q => [currentSong, ...q]);
      setNextSong(currentSong);
      setCurrentSong(prevSong);
    } else if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(0, true);
      setCurrentTime(0);
    }
  }, [history, currentSong, setCurrentSong, setNextSong, setQueue, setHistory, playerRef, setCurrentTime]);

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

  return (
    <div ref={fullscreenRef} className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className={`p-4 bg-gray-800 transition-opacity duration-300 'opacity-100' : 'opacity-0' ${isFullscreen ? 'hidden' : ''}`}>
        <div className="container mx-auto">
          <ChannelSelector
            channels={channels}
            currentChannel={currentChannel}
            onSelectChannel={channelIdOrName => {
              setUserInteracted(true);
              setBackendError(false);
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
          />
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
            />
            <SongInfo
              song={currentSong}
              nextSong={nextSong}
              laterSong={queue && queue.length > 0 ? queue[0] : null}
              visible={showInfo}
            />
            <PlayerFooter
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              isFullscreen={isFullscreen}
              showUI={showUI}
              isPlaying={isPlaying}
              currentChannel={currentChannel}
              onPlayPause={togglePlayPause}
              onNext={handleNextSong}
              onFullscreenToggle={toggleFullscreen}
              onPrevious={handlePreviousSong} // <-- add this
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
            <p className="text-lg">Please select a channel.</p>
          </div>
        )}
        {/* If user interacted, not loading, not backend error, but no song */}
        {!isLoading && !backendError && !currentSong && userInteracted && (
          <div className="flex items-center justify-center h-full w-full">
            <p className="text-lg">No songs found for this channel.</p>
          </div>
        )}
      </main>
    </div>
  );
}
export default App;