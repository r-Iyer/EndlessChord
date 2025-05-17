import React, { useState, useEffect } from 'react';

function TimerSlider({ currentTime = 0, duration = 0, onSeek }) {
  const [localValue, setLocalValue] = useState(currentTime);

  useEffect(() => {
    setLocalValue(currentTime);
  }, [currentTime]);

  const handleChange = (e) => {
    setLocalValue(Number(e.target.value));
  };

  const handleCommit = () => {
    onSeek(localValue);
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center w-full space-x-2">
      <span className="text-sm w-12">{formatTime(localValue)}</span>
      <input
        type="range"
        min={0}
        max={duration || 100}
        step={1}
        value={localValue}
        onChange={handleChange}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
        className="flex-grow h-1 bg-white bg-opacity-20 rounded-lg appearance-none cursor-pointer"
      />
      <span className="text-sm w-12">{formatTime(duration)}</span>
    </div>
  );
}

export default TimerSlider;
