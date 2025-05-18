import React, { useRef, useState } from 'react';

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimerSlider({ currentTime = 0, duration = 0, onSeek, style }) {
  // Support drag preview: show sliderValue while dragging, otherwise show currentTime
  const [sliderValue, setSliderValue] = useState(currentTime);
  const dragging = useRef(false);

  // Sync sliderValue with currentTime when not dragging
  React.useEffect(() => {
    if (!dragging.current) setSliderValue(currentTime);
  }, [currentTime]);

  const handleChange = (e) => {
    setSliderValue(Number(e.target.value));
    dragging.current = true;
  };

  const handleCommit = () => {
    dragging.current = false;
    if (onSeek) onSeek(sliderValue);
  };

  return (
    <div className="flex items-center w-full space-x-2" style={style}>
      <span className="text-sm w-12">{formatTime(sliderValue)}</span>
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={1}
        value={sliderValue}
        onChange={handleChange}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
        className="flex-grow h-1 cursor-pointer appearance-none"
      />
      <span className="text-sm w-12">{formatTime(duration)}</span>
    </div>
  );
}
