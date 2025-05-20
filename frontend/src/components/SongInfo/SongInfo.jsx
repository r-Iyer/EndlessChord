import React, { useEffect, useState } from "react";
import "./SongInfo.css";

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
    <div className={`song-info-container ${visible ? "visible" : "hidden"}`}>
      <div className="song-info-content">
        {/* Current song */}
        <div className="current-song">
          <div className="song-details">
            <h2 className="song-title">{song.title}</h2>
            <p className="song-artist">{song.artist}</p>
            <div className="song-metadata">
              {song.album && (
                <p className="metadata-item">
                  <span className="metadata-label">Album:</span>
                  <span className="metadata-value">{song.album}</span>
                </p>
              )}
              {song.year && (
                <p className="metadata-item">
                  <span className="metadata-label">Year:</span>
                  <span className="metadata-value">{song.year}</span>
                </p>
              )}
              {song.genre && (
                <p className="metadata-item">
                  <span className="metadata-label">Genre:</span>
                  <span className="metadata-value">{song.genre}</span>
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Next and Later cards */}
        {showNext && (nextSong || laterSong) && (
          <div className="upcoming-songs">
            {nextSong && (
              <div className="next-song">
                <div className="queue-label next-label">Next</div>
                <div className="queue-title">{nextSong.title}</div>
                <div className="queue-artist">{nextSong.artist}</div>
                {nextSong.album && <div className="queue-album">Album: {nextSong.album}</div>}
              </div>
            )}
            {laterSong && (
              <div className="later-song">
                <div className="queue-label later-label">Later</div>
                <div className="queue-title">{laterSong.title}</div>
                <div className="queue-artist">{laterSong.artist}</div>
                {laterSong.album && <div className="queue-album">Album: {laterSong.album}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}