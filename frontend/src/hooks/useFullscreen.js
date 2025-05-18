import { useCallback, useEffect } from 'react';

export default function useFullscreen(isFullscreen, setIsFullscreen) {
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
  }, [setIsFullscreen]);

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

  return { toggleFullscreen };
}
