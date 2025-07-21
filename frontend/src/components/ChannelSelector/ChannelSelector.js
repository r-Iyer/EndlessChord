import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import useAlbumDropdownHandlers from '../../hooks/useAlbumDropdownHandlers';
import './ChannelSelector.css';

/**
 * Converts a channel name to a URL-friendly slug.
 */
export function slugify(name) {
  return name.replace(/\s+/g, '-').toLowerCase();
}

/**
 * ChannelSelector lets users pick channels and albums.
 * ArrowDown from any button moves focus to Play/Pause (via ref).
 */
const CheckIcon = () => (
  <svg className="check-icon" viewBox="0 0 24 24"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const EditIcon = () => (
  <svg className="edit-icon" viewBox="0 0 24 24"><path d="M12 20h9" stroke="currentColor" strokeWidth="2" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" strokeWidth="2"/></svg>
);
const DeleteIcon = () => (
  <svg className="delete-icon" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M10 11v6M14 11v6M5 6l1 14h12l1-14" stroke="currentColor" strokeWidth="2"/></svg>
);
const TickIcon = () => (
  <svg className="tick-icon" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const ChannelSelector = forwardRef(function ChannelSelector({
  channels,
  albums = [],
  currentSelection,
  onSelect,
  clearSearch,
  disabled = false,
  setAlbums,
  onDeleteAlbum, // Pass this from parent or keep null-safe
}, ref) {
  const firstButtonRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const {
    open,
    setOpen,
    focusedIndex,
    itemRefs,
    editingAlbumId,
    editingName,
    setEditingName,
    startEditAlbum,
    finishEditAlbum,
    handleEditKeyDown,
    handleDeleteAlbum,
  } = useAlbumDropdownHandlers({
    albums,
    triggerRef,
    dropdownRef,
    setAlbums,
  });

  useImperativeHandle(ref, () => ({
    focusFirstButton: () => firstButtonRef.current?.focus(),
  }));

  useEffect(() => {
    if (!disabled) firstButtonRef.current?.focus();
  }, [disabled]);

  const handleChannelClick = (channel) => {
    clearSearch();
    onSelect({ type: 'channel', channel });
  };

  const handleAlbumClick = (album) => {
    if (editingAlbumId) return;
    clearSearch();
    onSelect({ type: 'album', album });
    setOpen(false);
    triggerRef.current?.focus();
  };

  const selectedAlbumName =
    currentSelection?.type === 'album' ? currentSelection.album?.name : 'My Albums';

  return (
    <div className="channel-wrapper" ref={dropdownRef}>
      <div className="channel-selector">
        {albums.length > 0 && (
          <button
            ref={triggerRef}
            className={`channel-button album-dropdown-trigger ${currentSelection?.type === 'album' ? 'active' : ''}`}
            onClick={() => setOpen(prev => !prev)}
            disabled={disabled}
            type="button"
          >
            <span className="dropdown-label">{selectedAlbumName}</span>
            <svg className={`dropdown-chevron ${open ? 'open' : ''}`} viewBox="0 0 24 24"><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2"/></svg>
          </button>
        )}

        {channels.map((ch, i) => {
          const isSelected = currentSelection?.type === 'channel' && currentSelection.channel._id === ch._id;
          return (
            <button
              key={ch._id}
              ref={i === 0 ? firstButtonRef : null}
              className={`channel-button ${isSelected ? 'active' : ''}`}
              onClick={() => handleChannelClick(ch)}
              disabled={disabled || isSelected} // prevent clicking current channel
              type="button"
            >
              <div className="channel-content">
                <span className="channel-indicator" />
                <span>{ch.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      {open && (
        <div className="album-dropdown-content" role="listbox">
          {albums.map((alb, idx) => {
            const isSelected = currentSelection?.type === 'album' && currentSelection.album._id === alb._id;
            return (
              <button
                key={alb._id}
                ref={el => itemRefs.current[idx] = el}
                tabIndex={focusedIndex === idx ? 0 : -1}
                onClick={() => handleAlbumClick(alb)}
                className={`album-dropdown-item ${isSelected ? 'selected' : ''}`}
                role="option"
                aria-selected={isSelected}
                disabled={isSelected} // prevent clicking current album
                type="button"
              >
                {editingAlbumId === alb._id ? (
                  <>
                    <input
                      className="album-edit-input"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => handleEditKeyDown(e, alb)}
                      ref={inputRef}
                      onBlur={(e) => {
                        e.stopPropagation();
                        inputRef.current.focus();
                      }}
                    />
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        finishEditAlbum(alb);
                      }}
                    >
                      <TickIcon />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="item-label">{alb.name}</span>
                    {isSelected && <CheckIcon />}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditAlbum(alb);
                      }}
                    >
                      <EditIcon />
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        (onDeleteAlbum || handleDeleteAlbum)(alb);
                      }}
                    >
                      <DeleteIcon />
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default ChannelSelector;
