import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { addFavorite, removeFavorite } from '../../services/favoritesService';
import './FavoriteButton.css';

const FavoriteButton = ({ song, user, onUpdate }) => {
  // Local state to track whether the song is favorited
  const [isFavorite, setIsFavorite] = useState(song?.isFavorite || false);

  // Sync local favorite state if the song prop changes
  useEffect(() => {
    setIsFavorite(song?.isFavorite || false);
  }, [song]);

  const handleToggleFavorite = async () => {
    if (!user || !song) return;

    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState); // Optimistic UI update

    try {
      if (newFavoriteState) {
        await addFavorite(song._id);
      } else {
        await removeFavorite(song._id);
      }
      // Notify parent component to refresh data or state if needed
      onUpdate?.();
    } catch (error) {
      // Rollback UI state on error
      setIsFavorite(!newFavoriteState);
      console.error('Error updating favorite:', error);
    }
  };

  return (
    <button
      type="button"
      className={`favorite-button ${isFavorite ? 'active' : ''}`}
      onClick={handleToggleFavorite}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      data-tooltip={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      disabled={!user}
    >
      <Heart
        size={24}
        strokeWidth={2}
        fill={isFavorite ? 'currentColor' : 'none'}
      />
    </button>
  );
};

export default FavoriteButton;
