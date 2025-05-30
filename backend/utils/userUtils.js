const { getUserHistoryInDb, getFavoriteSongIdsFromDb } = require("../helpers/userHelpers");
const logger = require('./loggerUtils');

const getUserHistorySongIds = async (userId) => {
  try {
    const userHistory = await getUserHistoryInDb(userId);
    if (!userHistory || !Array.isArray(userHistory.history)) {
      logger.warn(`User history missing or invalid for userId: ${userId}`);
      return new Set();
    }
    return new Set(userHistory.history.map((entry) => entry.songId.toString()));
  } catch (error) {
    logger.error(`Failed to get user history song IDs for userId: ${userId}`, error);
    return new Set();
  }
}

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
        if (Array.isArray(data) && data.length > 0 && data[0]?.videoId) {
          data = data.map(song => ({
            ...song,
            isFavorite: favoriteSongIds.includes(
              typeof song._id === 'string' ? song._id : song._id?.toString()
            )
          }));
        }

        // Re-stringify if needed
        const newBody = isJson ? JSON.stringify(data) : data;
        originalSend(newBody);
      } catch (error) {
        logger.error('Response processing error in addFavoriteStatus middleware:', error);
        originalSend(body); // Fallback to original response
      }
    };

    next();
  } catch (error) {
    logger.error('Error in addFavoriteStatus middleware:', error);
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
  getUserHistorySongIds,
  withFavoriteStatus,
  addFavoriteStatus 
};
