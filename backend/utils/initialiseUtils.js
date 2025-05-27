const connectDB = require('../config/db');
const { deleteAllChannelsInDb, insertChannelsInDb } = require('../helpers/channelHelpers');
const { deleteAllSongsInDb } = require('../helpers/songHelpers');
const { deleteFavoritesAndHistoryForAllUsersInDb } = require('../helpers/userHelpers');

let dbInitialized = false;

async function initializeDbConnection() {
  if (!dbInitialized) {
    console.log('[INIT] Connecting to MongoDB...');
    await connectDB();
  }
}

const channelSeeds = require('../config/channelSeeds');

async function reinitializeDatabase() {
  try {
    
    // Delete all songs
    const channelResult = await deleteAllChannelsInDb();

    //Create Channels
    await insertChannelsInDb(channelSeeds)
    
    // Delete all songs
    await deleteAllSongsInDb();
    
    // Clear favorites and history for all users
    await deleteFavoritesAndHistoryForAllUsersInDb();
    
    console.log('Database reinitialization complete!');
  } catch (error) {
    console.error('Error during reinitialization:', error);
  }
}


module.exports = { initializeDbConnection, reinitializeDatabase };