require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Database connection
const connectDB = require('../config/db');

// Route handlers
const register = require('./auth/register');
const login = require('./auth/login');
const search = require('./search/search');
const channels = require('./channels/channels');
const played = require('./songs/played');
const songs = require('./songs/songs');
const favorites = require('./favorites/favorites');
const logger = require('../utils/loggerUtils');

(async () => {
  try {
    // Connect to database once at startup
    await connectDB();
    logger.info('[DB] Connected to database');

    const app = express();
    const PORT = process.env.PORT || 5000;

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Mount routers
    app.use('/api/auth', register);
    app.use('/api/auth', login);
    app.use('/api/search', search);
    app.use('/api/channels', channels);
    app.use('/api/songs/played', played);
    app.use('/api/songs', songs);
    app.use('/api/favorites', favorites);

    // Global error handler (optional)
    app.use((err, req, res, next) => {
      logger.error('[GLOBAL ERROR]', err);
      res.status(500).json({ message: 'Internal server error' });
    });

    // Start server
    app.listen(PORT, () => {
      logger.info(`[SERVER] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('[STARTUP] Failed to start server:', error);
    process.exit(1);
  }
})();
