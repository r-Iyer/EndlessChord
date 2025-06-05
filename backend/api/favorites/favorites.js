require('dotenv').config();
const express = require('express');
const User = require('../../models/User');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const { optionalAuth } = require('../../utils/authUtils');
const { getUserFavorites, addSongToFavorites, removeSongFromFavorites } = require('../../helpers/userHelpers')
const { addFavoriteStatus } = require('../../utils/userUtils');
const logger = require('../../utils/loggerUtils');
const connectDB = require('../../config/db');

const router = express.Router();

// Add to favorites
router.post('/', optionalAuth, async (req, res) => {
  logger.info('[ROUTE] POST /api/favorites');
  await connectDB();
  
  try {
    const { songId } = req.body;

    const user = await addSongToFavorites(req.user.id, songId);

    if (!user) {
      logger.warn('[WARN] User not found:', req.user.id);
      return sendResponse(res, { error: 'User not found' }, 404);
    }

    logger.info(`[ROUTE] POST /api/favorites — Added song ${songId} to user ${req.user.id}'s favorites`);
    sendResponse(res, user.favorites);
  } catch (error) {
    handleError(res, error, '/api/favorites');
  }
});

// Remove from favorites
router.delete('/:songId', optionalAuth, async (req, res) => {
  logger.info(`[ROUTE] DELETE /api/favorites/${req.params.songId}`);
  await connectDB();
  
  try {
    const { songId } = req.params;

    const user = await removeSongFromFavorites(req.user.id, songId);

    if (!user) {
      logger.warn('[WARN] User not found:', req.user.id);
      return sendResponse(res, { error: 'User not found' }, 404);
    }

    sendResponse(res, user.favorites);
  } catch (error) {
    handleError(res, error, `/api/favorites/${req.params.songId}`);
  }
});

// Get favorites
router.get('/', optionalAuth, addFavoriteStatus, async (req, res) => {
  logger.info('[ROUTE] GET /api/favorites');
  await connectDB();
  try {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn('[WARN] Unauthorized access to favorites');
      return sendResponse(res, { error: 'User not authenticated' }, 401);
    }

    const favorites = await getUserFavorites(userId);

    if (!favorites) {
      logger.warn('[WARN] Favorites not found or empty for user:', userId);
      return sendResponse(res, []);
    }

    logger.info(`[ROUTE] GET /api/favorites — Returning ${favorites.length} songs`);

    sendResponse(res, favorites);
  } catch (error) {
    logger.error('[Favorites Error]', error);
    handleError(res, error, '/api/favorites');
  }
});

module.exports = router;
