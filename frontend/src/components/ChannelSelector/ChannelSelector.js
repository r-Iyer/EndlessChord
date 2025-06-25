import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import './ChannelSelector.css';

/**
 * Converts a channel name to a URL-friendly slug.
 * Replaces spaces with hyphens and converts to lowercase.
 * @param {string} name - The channel name
 * @returns {string} slugified string
 */
export function slugify(name) {
  return name.replace(/\s+/g, '-').toLowerCase();
}

/**
 * ChannelSelector component renders a list of channels as buttons.
 * Highlights the current selected channel and triggers callbacks on selection.
 * 
 * @param {Object[]} channels - Array of channel objects
 * @param {Object} currentChannel - Currently selected channel object
 * @param {Function} onSelectChannel - Callback fired with slugified channel name on selection
 * @param {Function} clearSearch - Callback to clear any existing search/filter before selection
 */
const ChannelSelector = forwardRef(function ChannelSelector(
  { channels, currentChannel, onSelectChannel, clearSearch },
  ref
) {
  const firstButtonRef = useRef(null);

  // Auto-focus the first channel button on mount for Firestick navigation
  useEffect(() => {
    if (firstButtonRef.current) {
      firstButtonRef.current.focus();
    }
  }, []);

  const handleChannelClick = (channelName) => {
    clearSearch();
    onSelectChannel(slugify(channelName));
  };

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focusFirstButton: () => {
      if (firstButtonRef.current) {
        firstButtonRef.current.focus();
      }
    },
  }));

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
          onKeyDown={(e) => {
            if (e.code === 'Enter' || e.code === 'NumpadEnter') {
              if (!currentChannel || currentChannel._id !== channel._id) {
                handleChannelClick(channel.name);
              }
            }
          }}
          type="button"
          tabIndex={0}
          autoFocus={index === 0}
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
