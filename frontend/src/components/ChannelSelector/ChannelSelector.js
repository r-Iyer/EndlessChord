import './ChannelSelector.css';

export function slugify(name) {
  return name.replace(/\s+/g, '-').toLowerCase();
}

function ChannelSelector({ channels, currentChannel, onSelectChannel, clearSearch }) {
  const handleChannelClick = (channelName) => {
    clearSearch();
    onSelectChannel(slugify(channelName));
  };

  return (
    <div className="channel-selector">
      {channels.map(channel => (
        <button
          key={channel._id}
          className={`channel-button ${currentChannel?._id === channel._id ? 'active' : ''}`}
          onClick={() => {
            if (!currentChannel || currentChannel._id !== channel._id) {
              handleChannelClick(channel.name);
            }
          }}
        >
          <div className="channel-content">
            <span className="channel-indicator"></span>
            <span>{channel.name}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export default ChannelSelector;