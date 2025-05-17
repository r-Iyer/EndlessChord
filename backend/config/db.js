const mongoose = require('mongoose');

const clearSongsCollection = async () => {
  try {
    // We need to require the model here to avoid circular dependencies
    const collections = await mongoose.connection.db.collections();
    const songCollection = collections.find(collection => collection.collectionName === 'songs');
    
    if (songCollection) {
      await songCollection.deleteMany({});
      console.log('Songs collection cleared');
    } else {
      console.log('Songs collection does not exist yet');
    }
  } catch (err) {
    console.error('Error clearing songs collection:', err);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/music-channel');
    console.log('MongoDB connected');
    
    // Clear songs collection after successful connection
    await clearSongsCollection();
    
    return conn;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
