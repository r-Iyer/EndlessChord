import { useEffect, useState } from "react";
import "./SongInfo.css";

export default function SongInfo({ song, nextSong, laterSong, visible, onNext, onLater }) {
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
        {/* Current Song Info */}
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
              {song.composer && (
                <p className="metadata-item">
                  <span className="metadata-label">Music:</span>
                  <span className="metadata-value">{song.composer}</span>
                </p>
              )}
              {song.genre && song.genre.length > 0 && (
                <p className="metadata-item">
                  <span className="metadata-label">Genre:</span>
                  <span className="metadata-value">{song.genre[0]}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Next and Later songs preview */}
        {showNext && (nextSong || laterSong) && (
          <div className="upcoming-songs">
            {nextSong && (
              <button className="next-song song-button" onClick={onNext} aria-label={`Play next song: ${nextSong.title}`}>
                <div className="queue-label next-label">Next</div>
                <div className="queue-title">{nextSong.title}</div>
                <div className="queue-artist">{nextSong.artist}</div>
                {nextSong.album && <div className="queue-album">Album: {nextSong.album}</div>}
              </button>
            )}
            {laterSong && (
              <button className="later-song song-button" onClick={onLater} aria-label={`Play later song: ${laterSong.title}`}>
                <div className="queue-label later-label">Later</div>
                <div className="queue-title">{laterSong.title}</div>
                <div className="queue-artist">{laterSong.artist}</div>
                {laterSong.album && <div className="queue-album">Album: {laterSong.album}</div>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
