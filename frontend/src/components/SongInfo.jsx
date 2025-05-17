import React, { useState, useEffect } from 'react';

function SongInfo({ song, visible }) {
  const [animationClass, setAnimationClass] = useState('opacity-0');
  
  useEffect(() => {
    if (visible) {
      setAnimationClass('opacity-100 translate-y-0');
    } else {
      setAnimationClass('opacity-0 translate-y-4');
    }
  }, [visible]);

  if (!song) return null;

  return (
    <div 
      className={`absolute bottom-24 left-8 bg-black bg-opacity-70 p-4 rounded-lg max-w-md transform transition-all duration-500 ${animationClass}`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-1">{song.title}</h2>
          <p className="text-gray-300 text-lg">{song.artist}</p>
          
          <div className="mt-2 space-y-1">
            {song.album && (
              <p className="text-gray-400 text-sm flex items-center">
                <span className="w-16 inline-block">Album:</span> 
                <span className="text-gray-300">{song.album}</span>
              </p>
            )}
            
            {song.year && (
              <p className="text-gray-400 text-sm flex items-center">
                <span className="w-16 inline-block">Year:</span> 
                <span className="text-gray-300">{song.year}</span>
              </p>
            )}
            
            {song.genre && (
              <p className="text-gray-400 text-sm flex items-center">
                <span className="w-16 inline-block">Genre:</span> 
                <span className="text-gray-300">{song.genre}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SongInfo;