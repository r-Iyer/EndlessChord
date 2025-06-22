import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { addFavorite, removeFavorite } from '../../services/favoritesService';
import './FavoriteButton.css';

const FavoriteButton = ({ song, user, onUpdate }) => {
  const [isFavorite, setIsFavorite] = useState(song?.isFavorite || false);

  useEffect(() => {
    setIsFavorite(song?.isFavorite || false);
  }, [song]);

  const handleToggleFavorite = async () => {
    if (!user || !song) return;

    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState); // Optimistic

    try {
      if (newFavoriteState) {
        await addFavorite(song._id);
      } else {
        await removeFavorite(song._id);
      }
      onUpdate?.();
    } catch (error) {
      setIsFavorite(!newFavoriteState); // rollback
      console.error('Error updating favorite:', error);
    }
  };

  return (
    <div
      className="tooltip-wrapper"
      data-tooltip={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <button
        type="button"
        className={`favorite-button ${isFavorite ? 'active' : ''}`}
        onClick={handleToggleFavorite}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        disabled={!user}
      >
        <Heart strokeWidth={2} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
};

export default FavoriteButton;
