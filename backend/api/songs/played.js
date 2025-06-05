require('dotenv').config();
const express = require('express');
const { optionalAuth } = require('../../utils/authUtils');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const logger = require('../../utils/loggerUtils');
const { updateGlobalSongPlayCount, updateUserHistory } = require('../../helpers/historyHelpers');
const connectDB = require('../../config/db');

const router = express.Router();

router.post('/', optionalAuth, async (req, res) => {
  logger.debug('[ROUTE] POST /api/songs/played');
  await connectDB();
  
  try {
    const { songIds } = req.body;
    const userId = req.user?.id;
    
    if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
      return sendResponse(res, { message: 'Invalid request. songIds array is required.' }, 400);
    }
    
    const updateResults = await Promise.all(
      songIds.map(async (songId) => {
        try {
          logger.debug('[ROUTE] POST /api/songs/played — Updating Global Song Play Count and Last Played');
          await updateGlobalSongPlayCount(songId);
          
          const historyResult = userId
            ? await updateUserHistory(userId, songId)
            : { userHistoryUpdate: false, message: 'User not logged in' };
          
          return {
            id: songId,
            success: true,
            globalUpdate: true,
            userHistoryUpdate: historyResult.userHistoryUpdate,
            message: historyResult.message
          };                    
        } catch (error) {
          logger.error(`[ERROR] Failed to update song ${songId}:`, error);
          return { 
            id: songId, 
            success: false, 
            message: error.message 
          };
        }
      })
    );
    
    const userHistoryUpdates = updateResults.filter(r => r.userHistoryUpdate).length;
    if (userId) {
      logger.info(`[ROUTE] POST /api/songs/played — Updated history for ${userHistoryUpdates} songs for user ${req.user.name}`);
    }
    
    sendResponse(res, { success: true, updates: updateResults });
  } catch (error) {
    handleError(res, error, '/api/songs/played');
  }
});

module.exports = router;
