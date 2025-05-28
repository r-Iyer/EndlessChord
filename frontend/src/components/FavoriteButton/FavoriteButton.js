import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { addFavorite, removeFavorite } from '../../services/favoritesService';
import './FavoriteButton.css';

const FavoriteButton = ({ song, user, onUpdate }) => {
  const [isFavorite, setIsFavorite] = useState(song?.isFavorite || false);

  // Update when song changes
  useEffect(() => {
    setIsFavorite(song?.isFavorite || false);
  }, [song]);

  const handleToggleFavorite = async () => {
    if (!user || !song) return;
    
    try {
      const newFavoriteState = !isFavorite;
      // Optimistic update
      setIsFavorite(newFavoriteState);
      
      if (newFavoriteState) {
        await addFavorite(song._id);
      } else {
        await removeFavorite(song._id);
      }
      
      // Refresh parent data if needed
      onUpdate?.();
    } catch (error) {
      // Rollback on error
      setIsFavorite(!isFavorite);
      console.error('Error updating favorite:', error);
    }
  };

return (
  <button 
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