import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchChannels, fetchChannelById } from './services/apiService';
import ChannelSelector from './components/ChannelSelector';
import VideoPlayer from './components/VideoPlayer';
import SongInfo from './components/SongInfo';
import PlaybackControls from './components/PlaybackControls';
import TimerSlider from './components/TimerSlider';
import Spinner from './components/Spinner';
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

  const fetchSongsForChannel = useCallback(async (channelId) => {
    if (isFetchingSongs) {
      // Block if already fetching
      return [];
    }
    setIsFetchingSongs(true);
    try {
      const response = await fetch(`/api/channels/${channelId}/songs`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching songs:', error);
      return [];
    } finally {
      setIsFetchingSongs(false);
    }
  }, [isFetchingSongs]);

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
    // eslint-disable-next-line
  }, []);

  // Helper to show/hide song info
  const showSongInfo = useCallback(() => {
    setShowInfo(true);
    if (infoTimeoutRef.current) clearTimeout(infoTimeoutRef.current);
    infoTimeoutRef.current = setTimeout(() => setShowInfo(false), 8000);
  }, []);

  useEffect(() => {
    if (currentSong) {
      showSongInfo();
    }
    return () => { if (infoTimeoutRef.current) clearTimeout(infoTimeoutRef.current); };
    // eslint-disable-next-line
  }, [currentSong, showSongInfo]);

  useEffect(() => {
    let intervalId;
    if (currentSong && playerRef.current && playerRef.current.getCurrentTime) {
      intervalId = setInterval(() => {
        try {
          const time = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          setCurrentTime(Math.floor(time));
          if (dur) setDuration(Math.floor(dur));
        } catch {}
      }, 500);
    }
    return () => intervalId && clearInterval(intervalId);
  }, [currentSong, playerRef.current]);

  // Show SongInfo at the beginning and when 20s remain
  useEffect(() => {
    if (!currentSong || !duration) return;
    let preEndTimeout = null;

    // Show info 20s before end, but only if song is longer than 30s
    if (duration > 30) {
      const timeLeft = duration - currentTime;
      if (timeLeft > 20) {
        preEndTimeout = setTimeout(() => {
          showSongInfo();
        }, (timeLeft - 20) * 1000);
      } else if (timeLeft <= 20 && timeLeft > 0) {
        // If already within last 20s, show immediately
        showSongInfo();
      }
    }

    return () => {
      if (preEndTimeout) clearTimeout(preEndTimeout);
    };
  }, [currentSong, duration, currentTime, showSongInfo]);

  const handleSeek = useCallback((time) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(Math.floor(time), true);
    setCurrentTime(Math.floor(time));
  }, []);

  // Keyboard arrow controls for seeking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!currentSong || !playerRef.current) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.key === 'ArrowRight') {
        handleSeek(Math.min(currentTime + 5, duration));
      } else if (e.key === 'ArrowLeft') {
        handleSeek(Math.max(currentTime - 5, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line
  }, [currentTime, duration, currentSong, handleSeek]);

  const handleVideoEnd = () => {
    showSongInfo();
    if (nextSong) {
      setCurrentSong(nextSong);
      setNextSong(queue[0] || null);
      setQueue(queue.slice(1));
      if (queue.length < 3) fetchMoreSongs();
    } else {
      fetchMoreSongs(true);
    }
  };

  const fetchMoreSongs = (setAsCurrent = false) => {
    if (!currentChannel || isFetchingSongs) {
      return; // Block if already fetching
    }
    setIsFetchingSongs(true);
    fetch(`/api/channels/${currentChannel._id}/songs?exclude=${currentSong?.videoId || ''}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          if (setAsCurrent) {
            setCurrentSong(data[0]);
            setNextSong(data[1] || null);
            setQueue(data.slice(2));
          } else {
            setQueue((prevQueue) => [...prevQueue, ...data]);
          }
        }
      })
      .catch((error) => console.error('Error fetching more songs:', error))
      .finally(() => setIsFetchingSongs(false));
  };

  const handleNextSong = () => {
    if (nextSong) {
      setCurrentSong(nextSong);
      setNextSong(queue[0] || null);
      setQueue(queue.slice(1));
      if (queue.length < 3) {
        fetchMoreSongs();
      }
    } else {
      fetchMoreSongs(true);
    }
  };

  const togglePlayPause = useCallback(() => {
    try {
      if (!playerRef.current) return;
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling play state:', error);
    }
  }, [isPlaying]);

  const toggleMute = () => {
    if (playerRef.current?.internalPlayer) {
      try {
        if (isMuted) {
          playerRef.current.internalPlayer.unMute().catch(() => {});
        } else {
          playerRef.current.internalPlayer.mute().catch(() => {});
        }
        setIsMuted(!isMuted);
      } catch {}
    }
  };

  const handlePlayerReady = (event) => {
    playerRef.current = event.target;
    if (isPlaying) {
      try {
        event.target.playVideo();
      } catch {}
    }
  };

  const handlePlayerStateChange = (event) => {
    switch (event.data) {
      case window.YT.PlayerState.PLAYING:
        setIsPlaying(true);
        break;
      case window.YT.PlayerState.PAUSED:
        setIsPlaying(false);
        break;
      case window.YT.PlayerState.ENDED:
        handleVideoEnd();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen =
        document.fullscreenElement === document.documentElement ||
        document.webkitFullscreenElement === document.documentElement ||
        document.msFullscreenElement === document.documentElement;
      setIsFullscreen(isNowFullscreen);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    } else {
      if (
        document.fullscreenElement === document.documentElement ||
        document.webkitFullscreenElement === document.documentElement ||
        document.msFullscreenElement === document.documentElement
      ) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
      }
    }
  }, [isFullscreen]);

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
            {/* TimerSlider and PlaybackControls: Both always visible, stacked at bottom, slider higher in fullscreen */}
            <div
              className={`fixed left-0 right-0 bottom-0 z-[2147483647] flex flex-col items-center transition-opacity duration-300 ${showUI ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              style={{
                pointerEvents: 'auto',
                background: 'rgba(20,20,20,0.85)',
                // In fullscreen, bring the slider up much higher
                bottom: isFullscreen ? '15%' : 0,
                paddingBottom: isFullscreen ? 0 : 80,
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 700,
                  minWidth: 350,
                  padding: '0 32px',
                  pointerEvents: 'auto',
                  zIndex: 2147483647,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                {/* -5s button */}
                <button
                  aria-label="Seek backward 5 seconds"
                  onClick={() => handleSeek(Math.max(currentTime - 5, 0))}
                  style={{
                    background: 'rgba(40,40,40,0.6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    transition: 'background 0.2s',
                  }}
                  tabIndex={0}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(60,60,60,0.8)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(40,40,40,0.6)'}
                >
                  -5
                </button>
                <TimerSlider
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={handleSeek}
                  style={{
                    height: 20,
                    pointerEvents: 'auto',
                    zIndex: 2147483647,
                    flex: 1,
                    fontSize: 12,
                  }}
                />
                {/* +5s button */}
                <button
                  aria-label="Seek forward 5 seconds"
                  onClick={() => handleSeek(Math.min(currentTime + 5, duration))}
                  style={{
                    background: 'rgba(40,40,40,0.6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    transition: 'background 0.2s',
                  }}
                  tabIndex={0}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(60,60,60,0.8)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(40,40,40,0.6)'}
                >
                  +5
                </button>
              </div>
              <div
                style={{
                  width: '100%',
                  maxWidth: 700,
                  minWidth: 350,
                  padding: '0 32px',
                  marginTop: 8,
                  pointerEvents: 'auto',
                  zIndex: 2147483647,
                }}
              >
                <PlaybackControls
                  isPlaying={isPlaying}
                  isMuted={isMuted}
                  isFullscreen={isFullscreen}
                  currentChannel={currentChannel}
                  onPlayPause={togglePlayPause}
                  onNext={handleNextSong}
                  onMuteToggle={toggleMute}
                  onFullscreenToggle={toggleFullscreen}
                  style={{
                    opacity: showUI ? 1 : 0,
                    pointerEvents: showUI ? 'auto' : 'none',
                    transition: 'opacity 0.3s',
                    zIndex: 2147483647,
                  }}
                />
              </div>
            </div>
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