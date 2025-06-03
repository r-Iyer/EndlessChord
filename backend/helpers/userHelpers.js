const mongoose = require('mongoose');
const User = require('../models/User');
const { RECENTLY_PLAYED_THRESHOLD } = require('../config/constants');
const logger = require('../utils/loggerUtils');

/**
 * Get video IDs of songs a user has recently played
 * @param {Object} req - Express request object with authenticated user
 * @returns {Promise<Array<string>>}
 */
const getUserRecentSongsInDb = async (req) => {
  try {
    let recentVideoIds = [];

    if (req.user && req.user.id) {
      // Populate history with song's videoId
      const user = await User.findById(req.user.id)
        .populate({
          path: 'history.songId',
          select: 'videoId'
        })
        .lean();

      if (user?.history?.length) {
        recentVideoIds = user.history
          .filter(entry => new Date(entry.playedAt) > RECENTLY_PLAYED_THRESHOLD)
          .map(entry => entry.songId?.videoId)
          .filter(Boolean); // remove nulls if any
      }
    }

    logger.info(`[getUserRecentSongsInDb] Recent video IDs: ${recentVideoIds.length}`);
    return recentVideoIds;
  } catch (error) {
    logger.error('[getUserRecentSongsInDb ERROR]', error);
    return [];
  }
};

/**
 * Get the user's history array from the database
 * @param {string} userId
 * @returns {Promise<Array|undefined>}
 */
const getUserHistoryInDb = async (userId) => {
  try {
    const user = await User.findById(userId).select('history').exec();
    return user?.history || [];
  } catch (error) {
    logger.error(`[getUserHistoryInDb] Failed to fetch history for user ${userId}:`, error);
    return [];
  }
};

/**
 * Clear favorites and history for all users
 */
const deleteFavoritesAndHistoryForAllUsersInDb = async () => {
  try {
    const userResult = await User.updateMany(
      {},
      {
        $set: {
          favorites: [],
          history: []
        }
      }
    );
    logger.info(`[deleteFavoritesAndHistoryForAllUsersInDb] Cleared favorites/history for ${userResult.modifiedCount} users`);
  } catch (error) {
    logger.error('[deleteFavoritesAndHistoryForAllUsersInDb] Error clearing data for users:', error);
  }
};

/**
 * Fetch full user document by ID
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
const getUserByIdFromDb = async (userId) => {
  try {
    const user = await User.findById(userId);
    logger.debug(`[getUserByIdFromDb] Found user with userId: ${userId}`);
    return user;
  } catch (error) {
    logger.error(`[getUserByIdFromDb] Error fetching user with ID ${userId}:`, error);
    return null;
  }
};

/**
 * Save user document to the database
 * @param {Object} user - user document
 */
const saveUserToDb = async (user) => {
  try {
    await user.save();
    logger.debug(`[saveUserToDb] Saved user with userId: ${user.userId}`);
  } catch (error) {
    logger.error(`[saveUserToDb] Error saving user ${user.userId}:`, error);
  }
};

/**
 * Get favorite song IDs for a user from the database.
 * @param {string} userId - The user's ID
 * @returns {Promise<Array<string>>} Array of song ID strings
 */
const getFavoriteSongIdsFromDb = async (userId) => {
  if (!userId) {
    logger.warn('[getFavoriteSongIdsFromDb] No userId provided');
    return [];
  }

  try {
    const user = await User.findById(userId)
      .select('favorites')
      .lean(); // returns plain JS object

    if (!user?.favorites?.length) {
      logger.debug(`[getFavoriteSongIdsFromDb] No favorites found for user ${userId}`);
      return [];
    }

    const favoriteSongIds = user.favorites.map(f => f.songId.toString());
    logger.debug(
      `[getFavoriteSongIdsFromDb] User ${userId} favorite song IDs: ${favoriteSongIds.length}`
    );
    return favoriteSongIds;

  } catch (err) {
    logger.error(`[getFavoriteSongIdsFromDb] Error fetching favorites for user ${userId}:`, err);
    return [];
  }
};

async function getUserFavorites(userId) {

  const user = await User.findById(userId)
    .populate({
      path: 'favorites.songId',
      select: 'videoId title artist composer album year genre language playCount lastPlayed'
    });

  if (!user) {
    return null;
  }

  // Sort favorites array by addedAt descending
  const sortedFavorites = user.favorites
    .slice() // shallow copy to avoid mutating original
    .sort((a, b) => b.addedAt - a.addedAt);

  return sortedFavorites.map(fav => ({
    ...fav.songId.toObject(),
    addedAt: fav.addedAt
  }));
}

/**
 * Add a song to the user's favorites.
 * @param {string} userId
 * @param {string} songId
 * @returns {Promise<Object|null>} Updated user document with populated favorites
 */
const addSongToFavorites = async (userId, songId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(songId)) {
      throw new Error('Invalid song ID');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          favorites: {
            songId: new mongoose.Types.ObjectId(songId),
            addedAt: new Date(),
          },
        },
      },
      { new: true, select: 'favorites' }
    ).populate('favorites.songId');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    logger.error('[addSongToFavorites] Error:', error);
    throw error;  // Rethrow so caller can handle it if needed
  }
};

/**
 * Remove a song from the user's favorites.
 * @param {string} userId
 * @param {string} songId
 * @returns {Promise<Object|null>} Updated user document with populated favorites
 */
const removeSongFromFavorites = async (userId, songId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(songId)) {
      throw new Error('Invalid song ID');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          favorites: {
            songId: new mongoose.Types.ObjectId(songId),
          },
        },
      },
      { new: true, select: 'favorites' }
    ).populate('favorites.songId');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    logger.error('[removeSongFromFavorites] Error:', error);
    throw error;
  }
};

module.exports = {
  getUserRecentSongsInDb,
  deleteFavoritesAndHistoryForAllUsersInDb,
  getUserByIdFromDb,
  saveUserToDb,
  getUserHistoryInDb,
  getFavoriteSongIdsFromDb,
  getUserFavorites,
  addSongToFavorites,
  removeSongFromFavorites,
};
