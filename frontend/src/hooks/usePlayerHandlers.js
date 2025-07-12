import { useCallback } from 'react';
import { MINIMUM_QUEUE_SIZE } from '../constants/constants';
import { api } from '../services/apiService';

/**
 * Custom hook to manage player controls (seek, next, previous, etc.) and side effects like updating play counts.
 *
 * @param {Object} playerRef
 *   Ref object pointing to the player instance. The player must expose:
 *     - playVideo()
 *     - pauseVideo()
 *     - seekTo(timeInSeconds, allowSeekAhead)
 *     - getCurrentTime()
 *     - getDuration()
 *
 * @param {boolean} isPlaying
 *   Current playback state. True if the player is currently playing.
 *
 * @param {Function} setIsPlaying
 *   Setter to update the isPlaying state.
 *
 * @param {Object|null} currentSong
 *   The currently playing song object. Expected to have an `_id` property.
 *
 * @param {Function} setCurrentSong
 *   Setter to update the currentSong.
 *
 * @param {Object|null} nextSong
 *   The next song in the queue. Expected to have an `_id` property.
 *
 * @param {Function} setNextSong
 *   Setter to update the nextSong.
 *
 * @param {Array<Object>} queue
 *   Array of song objects representing the upcoming queue.
 *
 * @param {Function} setQueue
 *   Setter to update the queue array.
 *
 * @param {Function} fetchMoreSongs
 *   Async function to fetch additional songs when queue size is low.
 *   Optionally takes a boolean flag to force-fetch immediately.
 *
 * @param {Array<Object>} history
 *   Array of previously played songs.
 *
 * @param {Function} setHistory
 *   Setter to update the history array.
 *
 * @param {Function} setCurrentTime
 *   Setter to update the current playback time (in seconds).
 *
 * @param {Function} setPlayerReady
 *   Setter to mark the player as "ready" (e.g., after initial buffering).
 *
 * @param {boolean} isInitialLoad
 *   True if this is the first time the player is initializing (used to prevent autoplay).
 *
 * @param {Function} setIsInitialLoad
 *   Setter to clear the initial load flag once the player is ready.
 *
 * @param {Function} setShowInfo
 *   Setter to show or hide the on-screen song info (e.g., title/artist overlay).
 *
 * @returns {Object} An object containing the following callbacks:
 *   - handleSeek(timeInSeconds): Seeks to a specific time in the current song.
 *   - handlePreviousSong(): Skips to the previous song in history (or restarts current if no history).
 *   - handleNextSong(): Skips to the next song in the queue; fetches more if queue is low.
 *   - handleLaterSong(): Moves the current and next song to history, then promotes the next from queue.
 *   - togglePlayPause(): Pauses or resumes playback.
 *   - handlePlayerReady(event): Called when the player signals it's ready; manages autoplay/prevention.
 *   - handlePlayerStateChange(event): Reacts to YouTube player state changes (PLAYING, PAUSED, ENDED).
 *   - handlePlayerError(error): Called on player errors; logs and advances to next song.
 */
export default function usePlayerHandlers(
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
) {
  /**
   * Called when the player instance is first ready.
   * - Stores the player instance in playerRef.
   * - If this is the initial load, prevents autoplay and resets the flag.
   * - Otherwise, starts playback immediately.
   */
  const handlePlayerReady = (event) => {
    playerRef.current = event.target;
    setPlayerReady(true);

    if (isInitialLoad) {
      console.log('Autoplay was prevented. User interaction required.');
      setIsPlaying(false);
      setIsInitialLoad(false);
    } else {
      event.target.playVideo();
      setIsPlaying(true);
    }
  };

  /**
   * Seek to a specific time (in seconds) in the current video.
   */
  const handleSeek = useCallback(
    (time) => {
      if (!playerRef.current) return;
      playerRef.current?.seekTo(Math.floor(time), true);
    },
    [playerRef]
  );

  /**
   * Sends a POST request to update the play count for the given song ID.
   * Any errors are caught and logged to the console.
   */
  const updatePlayCount = useCallback(async (songId) => {
    if (!songId) return;
    try {
      api.post('/api/songs/played', {
        songIds: [songId],
      });
    } catch (error) {
      console.error('Failed to update play count:', error);
    }
  }, []);

  /**
   * Skip to the previous song in the `history`. If history is empty:
   * - If the player instance supports seeking, restart the current song at 0.
   * - Else, do nothing.
   */
  const handlePreviousSong = useCallback(() => {
    if (currentSong && currentSong._id) {
      updatePlayCount(currentSong._id);
    }
    setShowInfo(false);

    if (history.length > 0) {
      const prevSong = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      if (nextSong) setQueue((q) => [nextSong, ...q]);
      setNextSong(currentSong);
      setCurrentSong(prevSong);
    } else if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(0, true);
      setCurrentTime(0);
    }
  }, [currentSong, setShowInfo, history, playerRef, updatePlayCount, setHistory, nextSong, setQueue, setNextSong, setCurrentSong, setCurrentTime]);

  /**
   * Skip to the next song in the queue.
   * - If a nextSong exists, move currentSong to history, advance the queue, and fetch more if low.
   * - If no nextSong, force-fetch more songs from the API (true = immediate fetch).
   */
  const handleNextSong = useCallback(() => {
    if (currentSong?._id) updatePlayCount(currentSong._id);

    setShowInfo(false);
    if (nextSong) {
      setHistory((prev) => [...prev, currentSong]);
      setCurrentSong(nextSong);
      const newNext = queue[0] || null;
      setNextSong(newNext);
      setQueue((q) => q.slice(1));
      if (queue.length < MINIMUM_QUEUE_SIZE) fetchMoreSongs();
    } else {
      fetchMoreSongs(true);
    }
  }, [currentSong, updatePlayCount, setShowInfo, nextSong, setHistory, setCurrentSong, queue, setNextSong, setQueue, fetchMoreSongs]);

  /**
   * Skip to a “later” song: move currentSong & nextSong to history,
   * then promote the next from `queue`. Ensures both are recorded.
   */
  const handleLaterSong = useCallback(() => {
    if (currentSong?._id) updatePlayCount(currentSong._id);

    if (queue.length >= 1) {
      setHistory((prev) => {
        const updated = [...prev];
        if (currentSong) updated.push(currentSong);
        if (nextSong) updated.push(nextSong);
        return updated;
      });

      const [laterSong, ...remaining] = queue;
      setCurrentSong(laterSong);
      const newNext = remaining[0] || null;
      setNextSong(newNext);
      setQueue(remaining.slice(1));
      if (remaining.length < MINIMUM_QUEUE_SIZE) fetchMoreSongs();
    } else {
      fetchMoreSongs(true);
    }
  }, [
    currentSong,
    nextSong,
    queue,
    setHistory,
    setCurrentSong,
    setNextSong,
    setQueue,
    fetchMoreSongs,
    updatePlayCount,
  ]);

  /**
   * Toggle between play and pause. If playing, pause. If paused, play.
   * Updates the `isPlaying` state accordingly.
   */
  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current?.pauseVideo() : playerRef.current?.playVideo();
    setIsPlaying(!isPlaying);
  }, [playerRef, isPlaying, setIsPlaying]);

  /**
   * Handle YouTube player state changes:
   * - PLAYING → hide info overlay, set isPlaying=true
   * - PAUSED  → show info overlay, set isPlaying=false
   * - ENDED   → automatically move to next song
   */
  const handlePlayerStateChange = useCallback(
    (event) => {
      switch (event.data) {
        case window.YT.PlayerState.PLAYING:
          setShowInfo(false);
          setIsPlaying(true);
          break;
        case window.YT.PlayerState.PAUSED:
          setShowInfo(true);
          setIsPlaying(false);
          break;
        case window.YT.PlayerState.ENDED:
          handleNextSong();
          break;
        default:
          break;
      }
    },
    [setShowInfo, setIsPlaying, handleNextSong]
  );

  /**
   * Handle any player errors by logging them and advancing to the next song.
   */
  const handlePlayerError = useCallback(
    (error) => {
      console.error('❌ Video Player Error:', error);
      handleNextSong();
    },
    [handleNextSong]
  );

  return {
    handleSeek,
    handlePreviousSong,
    handleNextSong,
    handleLaterSong,
    togglePlayPause,
    handlePlayerReady,
    handlePlayerStateChange,
    handlePlayerError,
  };
}