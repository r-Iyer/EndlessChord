import React, { useEffect, useState } from "react";

export default function SongInfo({ song, nextSong, laterSong, visible }) {
  const [showNext, setShowNext] = useState(false);

  useEffect(() => {
    setShowNext(false);
    if (visible && (nextSong || laterSong)) {
      const timer = setTimeout(() => setShowNext(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, nextSong, laterSong]);

  if (!song) return null;

  return (
    <div className={`absolute bottom-24 left-8 bg-black bg-opacity-70 p-4 rounded-lg max-w-md transform transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className="flex flex-col space-y-4">
        {/* Current song */}
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
        {/* Next and Later cards */}
        {showNext && (nextSong || laterSong) && (
          <div className="flex space-x-4 mt-2">
            {nextSong && (
              <div className="flex-1 bg-gray-800 bg-opacity-80 rounded-lg p-3">
                <div className="text-xs text-purple-300 mb-1">Next</div>
                <div className="font-semibold text-white">{nextSong.title}</div>
                <div className="text-gray-300 text-sm">{nextSong.artist}</div>
                {nextSong.album && <div className="text-gray-400 text-xs">Album: {nextSong.album}</div>}
              </div>
            )}
            {laterSong && (
              <div className="flex-1 bg-gray-800 bg-opacity-60 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Later</div>
                <div className="font-semibold text-white">{laterSong.title}</div>
                <div className="text-gray-300 text-sm">{laterSong.artist}</div>
                {laterSong.album && <div className="text-gray-400 text-xs">Album: {laterSong.album}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}