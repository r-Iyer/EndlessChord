require('dotenv').config();
const express = require('express');
const cors = require('cors');

const register = require('./auth/register');
const login = require('./auth/login');
const search = require('./search/search');
const channels = require('./channels/channels');
const played = require('./songs/played');
const songs = require('./songs/songs');
const favorites = require('./favorites/favorites');
const logger = require('../utils/loggerUtils');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth/', register);
app.use('/api/auth/', login);
app.use('/api/channels/', channels);
app.use('/api/search', search);
app.use('/api/songs/played', played);
app.use('/api/songs', songs);
app.use('/api/favorites', favorites);

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    logger.info(`[LOCAL] Server running on port ${PORT}`);
  });
}

module.exports = app;
