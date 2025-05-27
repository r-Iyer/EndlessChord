const User = require('../models/User');
const { RECENTLY_PLAYED_THRESHOLD } = require('../config/constants');

const getUserRecentSongsInDb = async (req) => {
  try {
    let userRecentIds = [];
    
    // Ensure req.user and req.user.id exist before querying
    if (req.user && req.user.id) {
      // Fetch user with only 'history' field for efficiency
      const user = await User.findById(req.user.id).select('history').exec();
      
      // Defensive check if user and user.history exist
      if (user && Array.isArray(user.history)) {
        const userRecentSongs = user.history.filter(entry => 
          new Date(entry.playedAt) > RECENTLY_PLAYED_THRESHOLD
        );
        
        userRecentIds = userRecentSongs.map(entry => entry.songId.toString());
      }
    }
    console.log(`[getUserRecentSongsInDb] User recent song IDs: ${userRecentIds.length}`);
    
    return userRecentIds;
  } catch (error) {
    // Log the error, can replace with your logger
    console.error('[getUserRecentSongsInDb ERROR]', error);
    // Return empty array on error so caller can safely proceed
    return [];
  }
};

const deleteFavoritesAndHistoryForAllUsersInDb = async () => {
  await User.updateMany(
    {},
    {
      $set: {
        favorites: [],
        history: []
      }
    }
  );
  console.log(`Cleared favorites/history for ${userResult.modifiedCount} users`);    
};

module.exports = { getUserRecentSongsInDb, deleteFavoritesAndHistoryForAllUsersInDb };
