import { useRef, useState, useEffect } from 'react';
import './TimerSlider.css';

/**
 * Format seconds as M:SS string.
 * Returns '0:00' if input is invalid or negative.
 */
function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * TimerSlider component
 * 
 * Props:
 * - currentTime: current playback time (seconds)
 * - duration: total duration (seconds)
 * - onSeek: callback to seek to a new time
 * - style: optional styles to apply on container
 * - upRef: ref to element to focus when ArrowUp is pressed
 * - downRef: ref to element to focus when ArrowDown is pressed
 */
export default function TimerSlider({ currentTime = 0, duration = 0, onSeek, style, upRef, downRef }) {
  const [sliderValue, setSliderValue] = useState(currentTime);
  const dragging = useRef(false);

  // Sync sliderValue with currentTime when not dragging
  useEffect(() => {
    if (!dragging.current) {
      const safe = Math.min(Math.max(currentTime, 0), duration);
      setSliderValue(safe);
    }
  }, [currentTime, duration]);

  const handleChange = (e) => {
    const val = Number(e.target.value);
    if (!isNaN(val)) {
      setSliderValue(val);
      dragging.current = true;
    }
  };

  const handleCommit = () => {
    if (dragging.current && onSeek) {
      const safeVal = Math.min(Math.max(sliderValue, 0), duration);
      onSeek(safeVal);
    }
    dragging.current = false;
  };

  const handleKeyDown = (e) => {
    if (e.code === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      upRef?.current?.focus();
    } else if (e.code === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      downRef?.current?.focus();
    }
  };

  const progressPercent = duration > 0 ? (sliderValue / duration) * 100 : 0;

  return (
    <div className="timer-slider" style={style}>
      {/* Current time */}
      <span className="time-display" aria-label="Current time">
        {formatTime(sliderValue)}
      </span>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={1}
        value={sliderValue}
        onInput={handleChange}
        onPointerUp={handleCommit}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
        onTouchCancel={handleCommit}
        onKeyUp={handleCommit}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        className="slider-input"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={sliderValue}
        aria-label="Seek slider"
        tabIndex={0}
        style={{
          '--progress-percentage': `${progressPercent}%`
        }}
      />

      {/* Duration */}
      <span className="time-display" aria-label="Total duration">
        {formatTime(duration)}
      </span>
    </div>
  );
}
