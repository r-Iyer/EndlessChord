const connectDB = require('../config/db');
const { deleteAllChannelsInDb, insertChannelsInDb } = require('../helpers/channelHelpers');
const { deleteAllSongsInDb } = require('../helpers/songHelpers');
const { deleteFavoritesAndHistoryForAllUsersInDb } = require('../helpers/userHelpers');
const logger = require('./loggerUtils');

let dbInitialized = false;

async function initializeDbConnection() {
  if (!dbInitialized) {
    logger.info('[INIT] Connecting to MongoDB...');
    await connectDB();
    dbInitialized = true;
  }
}

const channelSeeds = require('../config/channelSeeds');

async function reinitializeDatabase() {
  try {
    // Delete all channels
    const channelResult = await deleteAllChannelsInDb();
    logger.info(`Deleted ${channelResult?.deletedCount || 'unknown number of'} channels`);

    // Create Channels
    await insertChannelsInDb(channelSeeds);
    
    // Delete all songs
    //await deleteAllSongsInDb();

    // Clear favorites and history for all users
    //await deleteFavoritesAndHistoryForAllUsersInDb();

    logger.info('Database reinitialization complete!');
  } catch (error) {
    logger.error('Error during reinitialization:', error);
  }
}

module.exports = { initializeDbConnection, reinitializeDatabase };
