const { getSongByIdFromDb, saveSongToDb } = require('./songHelpers');
const { getUserByIdFromDb, saveUserToDb } = require('./userHelpers');
const logger = require('../utils/loggerUtils');

/**
 * Increment global play count of a song
 * @param {string} songId - ID of the song to update
 * @returns {Promise<Object>} Status object
 */
const updateGlobalSongPlayCount = async (songId) => {
  try {
    const song = await getSongByIdFromDb(songId);
    if (!song) {
      logger.warn(`[updateGlobalSongPlayCount] Song not found: ${songId}`);
      return { id: songId, success: false, message: 'Song not found' };
    }

    song.playCount += 1;
    song.lastPlayed = new Date();
    await saveSongToDb(song);

    logger.debug(`[updateGlobalSongPlayCount] Updated play count for song: ${songId}`);
    return { id: songId, success: true };
  } catch (error) {
    logger.error(`[updateGlobalSongPlayCount] Error updating play count for song ${songId}:`, error);
    return { id: songId, success: false, message: 'Error updating play count' };
  }
};

/**
 * Update a user's play history with a given song
 * @param {string} userId - ID of the user
 * @param {string} songId - ID of the song
 * @returns {Promise<Object>} Status object
 */
const updateUserHistory = async (userId, songId) => {
  if (!userId) {
    logger.warn('[updateUserHistory] No userId provided');
    return {
      userHistoryUpdate: false,
      message: 'User not logged in'
    };
  }

  try {
    const user = await getUserByIdFromDb(userId);
    if (!user) {
      logger.warn(`[updateUserHistory] User not found: ${userId}`);
      return {
        userHistoryUpdate: false,
        message: 'User not found'
      };
    }

    logger.debug(`[updateUserHistory] Updating history of user: ${user.name}`);

    const existingEntry = user.history.find(
      entry => entry.songId.toString() === songId
    );

    if (existingEntry) {
      existingEntry.playCount += 1;
      existingEntry.playedAt = new Date();
    } else {
      user.history.push({
        songId,
        playedAt: new Date(),
        playCount: 1
      });
    }

    await saveUserToDb(user);

    return {
      userHistoryUpdate: true,
      message: 'User history updated successfully'
    };
  } catch (error) {
    logger.error(`[updateUserHistory] Error updating history for user ${userId}:`, error);
    return {
      userHistoryUpdate: false,
      message: 'Error updating user history'
    };
  }
};

module.exports = { updateGlobalSongPlayCount, updateUserHistory };
