require('dotenv').config();
const express = require('express');
const User = require('../../models/User');
const { optionalAuth } = require('../../utils/authUtils');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const { Song } = require('../../models/Song');
const logger = require('../../utils/loggerUtils');

const router = express.Router();

router.post('/', optionalAuth, async (req, res) => {
  logger.debug('[ROUTE] POST /api/songs/played');
  
  try {
    const { songIds } = req.body;
    const userId = req.user.id;
    
    if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
      return sendResponse(res, { message: 'Invalid request. songIds array is required.' }, 400);
    }
    
    const updateResults = await Promise.all(
      songIds.map(async (songId) => {
        try {
          // Update global song play count
          const song = await Song.findById(songId);
          if (!song) {
            return { id: songId, success: false, message: 'Song not found' };
          }
          
          song.playCount += 1;
          song.lastPlayed = new Date();
          await song.save();
          
          // Update user history if user is logged in
          if (userId) {
            const user = await User.findById(userId);
            if (user) {
              // Check if this song already exists in user's history
              const existingHistoryEntry = user.history.find(
                entry => entry.songId.toString() === songId
              );
              
              if (existingHistoryEntry) {
                // Update existing entry
                existingHistoryEntry.playCount += 1;
                existingHistoryEntry.playedAt = new Date();
              } else {
                // Add new entry to history
                user.history.push({
                  songId: songId,
                  playedAt: new Date(),
                  playCount: 1
                });
              }
             
              await user.save();
              
              return { 
                id: songId, 
                success: true, 
                globalUpdate: true, 
                userHistoryUpdate: true 
              };
            }
          }
          
          return { 
            id: songId, 
            success: true, 
            globalUpdate: true, 
            userHistoryUpdate: false,
            message: userId ? 'User not found' : 'User not logged in'
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