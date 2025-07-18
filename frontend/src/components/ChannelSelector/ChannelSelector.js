import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import './ChannelSelector.css';

/**
 * Converts a channel name to a URL-friendly slug.
 */
export function slugify(name) {
  return name.replace(/\s+/g, '-').toLowerCase();
}

/**
 * ChannelSelector lets users pick channels.
 * ArrowDown from any button moves focus to Play/Pause (via ref).
 */
const ChannelSelector = forwardRef(function ChannelSelector(
  { channels, currentChannel, onSelectChannel, clearSearch, playPauseRef, disabled = false },
  ref
) {
  const firstButtonRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focusFirstButton: () => {
      if (firstButtonRef.current) {
        firstButtonRef.current.focus();
      }
    },
  }));

  // Focus only on initial mount
  useEffect(() => {
    if (!disabled && firstButtonRef.current) {
      firstButtonRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChannelClick = (channelName) => {
    clearSearch();
    onSelectChannel(slugify(channelName));
  };

const handleKeyDown = (e) => {
  if (e.code === 'ArrowDown' && playPauseRef?.current) {
    e.preventDefault();
    setTimeout(() => {
      playPauseRef.current?.focus();
    }, 0);
  }
};


  return (
    <div className="channel-selector">
      {channels.map((channel, index) => (
        <button
          key={channel._id}
          ref={index === 0 ? firstButtonRef : null}
          className={`channel-button ${currentChannel?._id === channel._id ? 'active' : ''}`}
          onClick={() => {
            if (!currentChannel || currentChannel._id !== channel._id) {
              handleChannelClick(channel.name);
            }
          }}
          onKeyDown={handleKeyDown}
          type="button"
          tabIndex={disabled ? -1 : 0}
          disabled={disabled}
        >
          <div className="channel-content">
            <span className="channel-indicator" />
            <span>{channel.name}</span>
          </div>
        </button>
      ))}
    </div>
  );
});

export default ChannelSelector;
