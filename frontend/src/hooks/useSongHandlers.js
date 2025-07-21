import { useEffect } from 'react';

/**
 * Handles song-related actions, like syncing songId to URL
 */
export default function useSongHandlers(currentSong) {
  
  const setSongInURL = (song) => {
    const url = new URL(window.location.href);
    if (song?.videoId) {
      url.searchParams.set('songId', song.videoId);
    } else {
      url.searchParams.delete('songId');
    }
    window.history.replaceState(null, '', url.toString());
  };

  const getSongFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('songId');
  };

  // Sync URL whenever currentSong changes
  useEffect(() => {
    setSongInURL(currentSong);
  }, [currentSong]);

  return { setSongInURL, getSongFromURL };
}
