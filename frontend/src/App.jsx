import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchChannels, fetchChannelById } from './services/apiService';
import ChannelSelector from './components/ChannelSelector';
import VideoPlayer from './components/VideoPlayer';
import SongInfo from './components/SongInfo';
import Spinner from './components/Spinner';
import PlayerFooter from './components/PlayerFooter';
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
  const [isMuted, setIsMuted] = useState(false);
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

  const { fetchSongsForChannel, fetchMoreSongs } = useSongQueue(currentChannel, currentSong, setCurrentSong, setNextSong, setQueue, isFetchingSongs, setIsFetchingSongs);
  const { handleSeek, handleNextSong, handleVideoEnd, togglePlayPause, toggleMute, handlePlayerStateChange, handleSkipForward, handleSkipBackward } = usePlayerHandlers(playerRef, isPlaying, setIsPlaying, isMuted, setIsMuted, currentSong, setCurrentSong, nextSong, setNextSong, queue, setQueue, fetchMoreSongs, showInfo, setShowInfo, infoTimeoutRef, duration, setCurrentTime);
  usePlayerEffects(currentSong, showInfo, setShowInfo, infoTimeoutRef, currentTime, setCurrentTime, duration, setDuration, playerRef, isPlaying, setIsPlaying, handleSeek, handleNextSong, handleVideoEnd, fetchMoreSongs);
  const { toggleFullscreen } = useFullscreen(isFullscreen, setIsFullscreen);

  const selectChannel = useCallback(async (channelId) => {
    setIsPlaying(false);
    setCurrentSong(null);
    setNextSong(null);
    setQueue([]);
    setIsLoading(true); // Start loading
    try {
      const [channelData, songs] = await Promise.all([
        fetchChannelById(channelId),
        fetchSongsForChannel(channelId)
      ]);
      setCurrentChannel(channelData);
      if (songs.length > 0) {
        setCurrentSong(songs[0]);
        setNextSong(songs[1] || null);
        setQueue(songs.slice(2));
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error loading channel data:', error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  }, [fetchSongsForChannel]);

  useEffect(() => {
    let mounted = true;
    const loadInitialChannel = async () => {
      try {
        const data = await fetchChannels();
        if (!mounted) return;
        setChannels(data);
        if (data.length > 0 && !currentChannel) {
          selectChannel(data[0]._id);
        }
      } catch (error) {
        console.error('Error fetching channels:', error);
      }
    };
    loadInitialChannel();
    return () => { mounted = false; };
  }, [currentChannel, selectChannel]); // Add missing dependencies

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
    if (isPlaying) {
      try {
        event.target.playVideo();
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className={`p-4 bg-gray-800 transition-opacity duration-300 ${showUI ? 'opacity-100' : 'opacity-0'} ${isFullscreen ? 'hidden' : ''}`}>
        <div className="container mx-auto">
          <ChannelSelector
            channels={channels}
            currentChannel={currentChannel}
            onSelectChannel={selectChannel}
          />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center relative">
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
              isFullscreen={isFullscreen}
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
              isMuted={isMuted}
              currentChannel={currentChannel}
              onPlayPause={togglePlayPause}
              onNext={handleNextSong}
              onMuteToggle={toggleMute}
              onFullscreenToggle={toggleFullscreen}
              onSkipForward={handleSkipForward}      // <-- add this
              onSkipBackward={handleSkipBackward}    // <-- add this
            />
          </>
        )}
        {/* Optionally, show a message when nothing is playing and not loading */}
        {!currentSong && !isLoading && (
          <div className="flex items-center justify-center h-full w-full">
            <p className="text-lg">No song is currently playing. Please select a channel.</p>
          </div>
        )}
      </main>
    </div>
  );
}
export default App;