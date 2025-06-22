import React from 'react';
import PrevPlayNextControls from '../PrevPlayNextControls/PrevPlayNextControls';
import { Maximize, Minimize, Captions, CaptionsOff } from 'lucide-react';
import './ControlsOverlay.css';
import FavoriteButton from '../FavoriteButton/FavoriteButton';
import AuthService from '../../services/authService';

export default function ControlsOverlay({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  isCCEnabled,
  onCCToggle,
  isFullscreen,
  onFullscreenToggle,
  user,
  currentSong
}) {
  return (
    <div className="controls-overlay">
    {/* top-right CC toggle */}
    <button
    className="control-button cc-btn top-right"
    onClick={onCCToggle}
    aria-label={isCCEnabled ? 'Disable Captions' : 'Enable Captions'}
    >
    {isCCEnabled ? <Captions size={24} /> : <CaptionsOff size={24} />}
    </button>
    
    {/* center prev/play/next */}
    <div className={`controls-overlay__center ${isFullscreen ? 'fullscreen' : ''}`}>
    <PrevPlayNextControls
    isPlaying={isPlaying}
    onPlayPause={onPlayPause}
    onNext={onNext}
    onPrevious={onPrevious}
    />
    </div>
    
    <button
    className={`control-button fs-btn bottom-right ${isFullscreen ? 'fullscreen' : ''}`}
    onClick={onFullscreenToggle}
    aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
    >
    {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
    </button>
      {user && !AuthService.isGuest && (
        <div className="favorite-button-overlay">
        <FavoriteButton song={currentSong} user={user} />
        </div>
      )}
    </div>
  );
}
