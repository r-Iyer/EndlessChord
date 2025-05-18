import React from 'react';

function slugify(name) {
  return name.replace(/\s+/g, '-').toLowerCase();
}

function ChannelSelector({ channels, currentChannel, onSelectChannel }) {
  return (
    <div className="p-4 flex flex-wrap gap-2">
      {channels.map(channel => (
        <button
          key={channel._id}
          className={`px-4 py-2 rounded-full transition-colors duration-200 ${
            currentChannel?._id === channel._id 
              ? 'bg-purple-700 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
          }`}
          onClick={() => {
            if (!currentChannel || currentChannel._id !== channel._id) {
              onSelectChannel(slugify(channel.name));
            }
          }}
        >
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
            <span>{channel.name}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export default ChannelSelector;