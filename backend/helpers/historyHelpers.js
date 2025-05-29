const { getSongByIdFromDb, saveSongToDb } = require('./songHelpers');
const { getUserByIdFromDb, saveUserToDb } = require('./userHelpers');
const logger = require('../utils/loggerUtils');

const updateGlobalSongPlayCount = async ( songId ) => {
    const song = await getSongByIdFromDb(songId);
    if (!song) {
        return { id: songId, success: false, message: 'Song not found' };
    }
    
    song.playCount += 1;
    song.lastPlayed = new Date();
    await saveSongToDb(song);
}

const updateUserHistory = async (userId, songId) => {
  if (!userId) {
    return {
      userHistoryUpdate: false,
      message: 'User not logged in'
    };
  }

  const user = await getUserByIdFromDb(userId);

  if (!user) {
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
};

module.exports = { updateGlobalSongPlayCount, updateUserHistory }