import { useCallback, useEffect } from 'react';

export default function useFullscreen(isFullscreen, setIsFullscreen, fullscreenRef) {
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen =
        document.fullscreenElement === (fullscreenRef?.current || document.documentElement) ||
        document.webkitFullscreenElement === (fullscreenRef?.current || document.documentElement) ||
        document.msFullscreenElement === (fullscreenRef?.current || document.documentElement);
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
  }, [setIsFullscreen, fullscreenRef]);

  const toggleFullscreen = useCallback(() => {
    const elem = fullscreenRef?.current || document.documentElement;
    if (!isFullscreen) {
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
      if (window.screen.orientation && window.screen.orientation.lock) {
        window.screen.orientation.lock('landscape').catch(() => {});
      }
    } else {
      if (
        document.fullscreenElement === elem ||
        document.webkitFullscreenElement === elem ||
        document.msFullscreenElement === elem
      ) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
      }
    }
  }, [isFullscreen, fullscreenRef]);

  return { toggleFullscreen };
}
