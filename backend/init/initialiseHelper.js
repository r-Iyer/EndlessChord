const connectDB = require('../config/db');
const Channel = require('../models/Channel');
const User = require('../models/User');
const { Song } = require('../models/Song');

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
    const channelResult = await Channel.deleteMany({});
    console.log(`Deleted ${channelResult.deletedCount} channels`);

    //Create Channels
    await Channel.insertMany(channelSeeds);
    console.log('[DB] Channels created.');
    
    // Delete all songs
    const songResult = await Song.deleteMany({});
    console.log(`Deleted ${songResult.deletedCount} songs`);
    
    // Clear favorites and history for all users
    const userResult = await User.updateMany(
      {},
      {
        $set: {
          favorites: [],
          history: []
        }
      }
    );
    console.log(`Cleared favorites/history for ${userResult.modifiedCount} users`);    
    console.log('Database reinitialization complete!');
  } catch (error) {
    console.error('Error during reinitialization:', error);
  }
}

module.exports = { initializeDbConnection, reinitializeDatabase };