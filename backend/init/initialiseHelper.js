const connectDB = require('../config/db');

let dbInitialized = false;

async function initializeDbConnection() {
  if (!dbInitialized) {
    console.log('[INIT] Connecting to MongoDB...');
    await connectDB();
    const { GoogleGenAI } = require('@google/genai');
    ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
  }
}

const channelSeeds = require('../config/channelSeeds');

async function reinitializeDatabase(User, Song) {
  try {
    
    //Create Channels
    const channelCount = await Channel.countDocuments();
    if (channelCount === 0) {
      console.log('[DB] No channels found, seeding...');
      await Channel.insertMany(channelSeeds);
      console.log('[DB] Channels seeded.');
    } else {
      // Add any missing channels from channelSeeds
      for (const seed of channelSeeds) {
        const exists = await Channel.findOne({ name: seed.name });
        if (!exists) {
          await new Channel(seed).save();
          console.log(`[DB] Channel added: ${seed.name}`);
        }
      }
    }
    
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
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

module.exports = { initializeDbConnection, reinitializeDatabase };