import { useCallback } from 'react';

export const usePlayerControls = (playerRef) => {
    const playVideo = useCallback(() => {
        if (!playerRef.current) return Promise.reject('Player not initialized');
        return playerRef.current.playVideo();
    }, [playerRef]);
    
    const pauseVideo = useCallback(() => {
        if (!playerRef.current) return;
        playerRef.current.pauseVideo();
    }, [playerRef]);
    
    const seekTo = useCallback((time) => {
        if (!playerRef.current) return;
        playerRef.current.seekTo(time, true);
    }, [playerRef]);
    
    return {
        playVideo,
        pauseVideo,
        seekTo
    };
};