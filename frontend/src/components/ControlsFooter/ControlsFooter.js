import React from 'react';
import {
  Maximize,
  Minimize,
  Captions,
  CaptionsOff,
  RotateCcw,
} from 'lucide-react';
import FavoriteButton from '../FavoriteButton/FavoriteButton';
import AuthService from '../../services/authService';
import './ControlsFooter.css';

export default function ControlsFooter({
  isCCEnabled,
  onCCToggle,
  isFullscreen,
  onFullscreenToggle,
  user,
  currentSong,
  onSeek,
  fullscreenRef, // 👈 receive ref for fullscreen button
}) {
  return (
    <div className="controls-footer">
      {/* CC Toggle */}
      <div className="tooltip-wrapper" data-tooltip={isCCEnabled ? 'Disable Captions' : 'Enable Captions'}>
        <button
          className="control-button"
          onClick={onCCToggle}
          aria-label={isCCEnabled ? 'Disable Captions' : 'Enable Captions'}
        >
          {isCCEnabled ? <Captions /> : <CaptionsOff />}
        </button>
      </div>

      {/* Replay Button */}
      <div className="tooltip-wrapper" data-tooltip="Replay">
        <button
          className="control-button"
          onClick={() => onSeek(0)}
          aria-label="Replay"
        >
          <RotateCcw />
        </button>
      </div>

      {/* Favorite Button */}
      {user && !AuthService.isGuest && (
        <FavoriteButton song={currentSong} user={user} />
      )}

      {/* Fullscreen Toggle */}
      <div className="tooltip-wrapper" data-tooltip={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
        <button
          className="control-button"
          onClick={onFullscreenToggle}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          ref={fullscreenRef} // 👈 attach focus ref here
        >
          {isFullscreen ? <Minimize /> : <Maximize />}
        </button>
      </div>
    </div>
  );
}
