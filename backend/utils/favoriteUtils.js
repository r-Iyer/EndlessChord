const { getFavoriteSongIdsFromDb} = require('../helpers/favoriteHelpers');

const addFavoriteStatus = async (req, res, next) => {
  try {
    const favoriteSongIds = await getFavoriteSongIdsFromDb(req.user?.id);
    
    const originalSend = res.send.bind(res);
    
    res.send = (body) => {
      try {
        // Parse if response is JSON string
        const isJson = typeof body === 'string' && /^[\x20\t\r\n]*[{\[]/.test(body);
        let data = isJson ? JSON.parse(body) : body;

        // Process if array of songs
        if (Array.isArray(data) && data[0]?.videoId) {
          data = data.map(song => ({
            ...song,
            isFavorite: favoriteSongIds.includes(song._id?.toString() || song._id)
          }));
        }

        // Re-stringify if needed
        const newBody = isJson ? JSON.stringify(data) : data;
        originalSend(newBody);
      } catch (error) {
        console.error('Response processing error:', error);
        originalSend(body); // Fallback to original response
      }
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Add isFavorite flag to songs
const withFavoriteStatus = (songs, favoriteSongIds) => {
  return songs.map(song => ({
    ...song,
    isFavorite: song.isFavorite !== undefined ? song.isFavorite : // Preserve existing value
               favoriteSongIds.includes(song._id?.toString() || song._id)
  }));
};

module.exports = {
  withFavoriteStatus,
  addFavoriteStatus
};