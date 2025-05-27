const User = require('../models/User');

const getFavoriteSongIdsFromDb = async (userId) => {
  if (!userId) return [];

  try {
    // 1. Await the DB call
    const user = await User
      .findById(userId)
      .select('favorites')
      .lean(); // optional: returns a plain JS object

    // 2. If no user or no favorites, return empty array
    if (!user?.favorites?.length) {
      console.log(`[getFavoriteSongIdsFromDb] No favorites found for user ${userId}`);
      return [];
    }

    // 3. Map and return string IDs
    const favoriteSongIds = user.favorites.map(f => f.songId.toString());
    console.log(
      `[getFavoriteSongIdsFromDb] User ${userId} favorite song IDs: ${favoriteSongIds.length}`
    );
    return favoriteSongIds;

  } catch (err) {
    // 4. On error, log and return an empty array
    console.error(
      `[getFavoriteSongIdsFromDb] Error fetching favorites for user ${userId}:`,
      err
    );
    return [];
  }
};


module.exports = {
  getFavoriteSongIdsFromDb
};