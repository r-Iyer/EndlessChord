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
 */
export default function TimerSlider({ currentTime = 0, duration = 0, onSeek, style }) {
  // Local state for slider value (used during dragging)
  const [sliderValue, setSliderValue] = useState(currentTime);

  // Ref to track if user is currently dragging slider thumb
  const dragging = useRef(false);

  // Sync sliderValue with currentTime prop if not dragging
  useEffect(() => {
    if (!dragging.current) {
      // Defensive check: Clamp currentTime between 0 and duration
      const safeCurrent = Math.min(Math.max(currentTime, 0), duration);
      setSliderValue(safeCurrent);
    }
  }, [currentTime, duration]);

  /**
   * Handle slider value change while dragging.
   * Update local sliderValue and mark dragging active.
   */
  const handleChange = (e) => {
    const val = Number(e.target.value);
    if (isNaN(val)) return; // ignore invalid input
    setSliderValue(val);
    dragging.current = true;
  };

  /**
   * Commit the slider value change.
   * Called on mouse/touch/key events signaling end of interaction.
   */
  const handleCommit = () => {
    if (dragging.current && onSeek) {
      // Clamp sliderValue between 0 and duration before calling onSeek
      const seekTime = Math.min(Math.max(sliderValue, 0), duration);
      onSeek(seekTime);
    }
    dragging.current = false;
  };

  // Calculate slider fill progress percentage (0-100)
  const progressPercentage = duration > 0 ? (sliderValue / duration) * 100 : 0;

  return (
    <div className="timer-slider" style={style}>
      {/* Current time display */}
      <span className="time-display" aria-label="Current time">{formatTime(sliderValue)}</span>

      {/* Range input slider */}
      <input
        type="range"
        min={0}
        max={duration || 1}  // avoid max=0 which breaks slider
        step={1}
        value={sliderValue}
        onChange={handleChange}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
        onTouchCancel={handleCommit}
        onKeyUp={handleCommit}
        onBlur={handleCommit}
        className="slider-input"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={sliderValue}
        aria-label="Seek slider"
        style={{
          // CSS variable used in CSS for slider fill color
          '--progress-percentage': `${progressPercentage}%`,
        }}
      />

      {/* Total duration display */}
      <span className="time-display" aria-label="Total duration">{formatTime(duration)}</span>
    </div>
  );
}
