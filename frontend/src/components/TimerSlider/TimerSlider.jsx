import React, { useRef, useState, useEffect } from 'react';
import './TimerSlider.css';

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
  useEffect(() => {
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

  // Calculate progress percentage for the slider fill
  const progressPercentage = duration > 0 ? (sliderValue / duration) * 100 : 0;

  return (
    <div className="timer-slider" style={style}>
      <span className="time-display">{formatTime(sliderValue)}</span>
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={1}
        value={sliderValue}
        onChange={handleChange}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
        className="slider-input"
        style={{
          // Set the CSS variable for the progress percentage
          '--progress-percentage': `${progressPercentage}%`,
        }}
      />
      <span className="time-display">{formatTime(duration)}</span>
    </div>
  );
}