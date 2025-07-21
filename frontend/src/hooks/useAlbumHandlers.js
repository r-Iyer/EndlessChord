import { useCallback, useRef, useEffect } from 'react';
import { cancelSearch } from '../services/searchService';
import { getAlbumSongs } from '../services/albumService';

/**
 * Handles only album selection logic, no UI state.
 */
export default function useAlbumHandlers({
  setUserInteracted,
  setBackendError,
  setIsPlaying,
  setCurrentSong,
  setNextSong,
  setQueue,
  setHistory,
  setIsLoading,
  setIsFetchingSongs,
  setCurrentSelection,
}) {
  const callIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const selectAlbum = useCallback(async (album) => {
    cancelSearch();
    abortControllerRef.current?.abort();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    callIdRef.current += 1;
    const callId = callIdRef.current;
    const isStale = () => callId !== callIdRef.current || signal.aborted;

    setUserInteracted(true);
    setBackendError(false);
    setIsPlaying(false);
    setCurrentSong(null);
    setNextSong(null);
    setQueue([]);
    setHistory([]);
    setIsLoading(true);
    setIsFetchingSongs(true);
    setCurrentSelection({ type: 'album', album, channel: null });

    try {
      const songs = await getAlbumSongs(album._id, { signal });
      if (isStale()) return;

      if (songs?.length) {
        setCurrentSong(songs[0]);
        setNextSong(songs[1] || null);
        setQueue(songs.slice(2));
      } else {
        setIsPlaying(false);
      }
    } catch (err) {
      if (!isStale()) {
        console.error('Album selection error:', err);
        setBackendError(true);
      }
    } finally {
      if (!isStale()) {
        setIsFetchingSongs(false);
        setIsLoading(false);
      }
    }
  }, [setUserInteracted, setBackendError, setIsPlaying, setCurrentSong, setNextSong, setQueue, setHistory, setIsLoading, setIsFetchingSongs, setCurrentSelection]);

  return { selectAlbum };
}
