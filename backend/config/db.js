const mongoose = require('mongoose');
const logger = require('../utils/loggerUtils');

let cached = global._mongooseCachedConnection;

if (!cached) {
  cached = global._mongooseCachedConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    logger.info('[INIT] Connecting to MongoDB...');
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    }).then((mongoose) => {
      logger.info('MongoDB connected');
      return mongoose;
    }).catch((err) => {
      logger.error('MongoDB connection error:', err);
      cached.promise = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
