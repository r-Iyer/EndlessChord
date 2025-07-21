import { useEffect, useRef } from 'react';
import {
  Maximize,
  Minimize,
  Captions,
  CaptionsOff,
  RotateCcw,
  Plus,
  Check,
  Share2 
} from 'lucide-react';
import FavoriteButton from '../FavoriteButton/FavoriteButton';
import AuthService from '../../services/authService';
import './ControlsFooter.css';
import useSongAlbumManager from '../../hooks/useSongAlbumManager';

export default function ControlsFooter({
  isCCEnabled,
  onCCToggle,
  isFullscreen,
  onFullscreenToggle,
  user,
  currentSong,
  onSeek,
  fullscreenRef,
  resetUIHideTimer,
  clearUIHideTimer,
  setCurrentSong
}) {
  const {
    albums,
    open,
    setOpen,
    newName,
    setNewName,
    songAlbumMap,
    wrapper,
    onToggleAlbum,
    onCreate,
    handleEditKeyDown
  } = useSongAlbumManager(user, currentSong);
  
  const inputRef = useRef(null);
  
  // Tooltip reset
  useEffect(() => {
    if (!open && wrapper.current) {
      wrapper.current.setAttribute('data-tooltip', 'Add to Album');
    }
  }, [open, wrapper]);
  
  useEffect(() => {
    if (open) clearUIHideTimer();
  }, [open, clearUIHideTimer]);
  
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // ✅ Fix: Keep UI alive when scrolling albums dropdown
  useEffect(() => {
    const albumsContent = document.querySelector('.albums-dropdown-content');
    
    const handleScroll = () => {
      resetUIHideTimer();
    };
    
    if (albumsContent) {
      albumsContent.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (albumsContent) {
        albumsContent.removeEventListener('scroll', handleScroll);
      }
    };
  }, [open, resetUIHideTimer]);
  
const handleShare = async (e) => {
  e.stopPropagation();

  const url = new URL(window.location.href);
  if (currentSong?.videoId) {
    url.searchParams.set('songId', currentSong.videoId);
  }

  const songTitle = currentSong?.title?.trim() || 'Listen to this song';
  const shareUrl = url.toString();
  const message = `🎵 Listen to ${songTitle} on Endless Chord 🎶! \n`;

  console.log('Sharing message:', message);

  try {
    if (navigator.share) {
      await navigator.share({
        title: songTitle,
        text: message,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(message);
      alert('Link copied to clipboard!');
    }
  } catch (err) {
    console.error('Sharing failed:', err);
    alert('Sharing failed. Copied link to clipboard!');
    await navigator.clipboard.writeText(message);
  }
};
  
  
  return (
    <div className="controls-footer">
    <div className="tooltip-wrapper" data-tooltip={isCCEnabled ? 'Disable Captions' : 'Enable Captions'}>
    <button className="control-button" onClick={onCCToggle} aria-label="Toggle CC">
    {isCCEnabled ? <Captions /> : <CaptionsOff />}
    </button>
    </div>
    
    <div className="tooltip-wrapper" data-tooltip="Replay">
    <button className="control-button" onClick={() => onSeek(0)} aria-label="Replay">
    <RotateCcw />
    </button>
    </div>
    
    {user && !AuthService.isGuest && (
      <FavoriteButton song={currentSong} user={user} setCurrentSong={setCurrentSong}/>
    )}
    
    {user && !AuthService.isGuest && currentSong && (
      <div
      className="tooltip-wrapper albums-wrapper"
      data-tooltip="Add to Album"
      ref={wrapper}
      onClick={(e) => {
        e.currentTarget.removeAttribute('data-tooltip');
        e.stopPropagation();
      }}
      >
      <button
      className="control-button"
      onClick={() => setOpen(o => !o)}
      aria-label="Add to album"
      >
      <Plus />
      </button>
      
      {open && (
        <div className="albums-dropdown-content" role="listbox">
        {albums.length === 0 ? (
          <div className="albums-dropdown-empty">No albums yet</div>
        ) : (
          albums.map((a) => (
            <button
            key={a._id}
            className={`albums-dropdown-item ${songAlbumMap[a._id] ? 'selected' : ''}`}
            onClick={() => onToggleAlbum(a._id)}
            type="button"
            >
            <span className="item-label">{a.name}</span>
            {songAlbumMap[a._id] && <Check className="check-icon" size={18} />}
            </button>
          ))
        )}
        <div className="albums-new">
        <input
        className="albums-input"
        placeholder="Create new album…"
        value={newName}
        onChange={(e) => {
          setNewName(e.target.value);
          clearUIHideTimer();
        }}
        ref={inputRef}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => handleEditKeyDown(e)}
        onTouchStart={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          resetUIHideTimer();
        }}
        onBlur={(e) => {
          e.stopPropagation();
          inputRef.current.focus();
        }}
        />
        <button
        className="albums-add-btn"
        onClick={onCreate}
        disabled={!newName.trim()}
        aria-label="Create album"
        type="button"
        >
        <Check size={16} />
        </button>
        </div>
        </div>
      )}
      </div>
    )}
    
    <div className="tooltip-wrapper" data-tooltip={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
    <button
    className="control-button"
    onClick={onFullscreenToggle}
    aria-label="Toggle Fullscreen"
    ref={fullscreenRef}
    >
    {isFullscreen ? <Minimize /> : <Maximize />}
    </button>
    </div>
    <div className="tooltip-wrapper" data-tooltip="Share">
    <button
    className="control-button"
    onClick={handleShare}
    aria-label="Share"
    >
    <Share2 />
    </button>
    </div>
    </div>
  );
}
