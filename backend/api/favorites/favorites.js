require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../models/User');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const { optionalAuth } = require('../../utils/authUtils');
const { addFavoriteStatus } = require('../../utils/favoriteUtils');


const router = express.Router();

// Add to favorites
router.post('/', optionalAuth, async (req, res) => {
  console.log('[ROUTE] POST /api/favorites');
  
  try {
    const { songId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(songId)) {
      console.warn('[WARN] Invalid song ID:', songId);
      return sendResponse(res, { error: 'Invalid song ID' }, 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $addToSet: { 
          favorites: { 
            songId: new mongoose.Types.ObjectId(songId),
            addedAt: new Date()
          }
        }
      },
      { new: true, select: 'favorites' }
    ).populate('favorites.songId');

    if (!user) {
      console.warn('[WARN] User not found:', req.user.id);
      return sendResponse(res, { error: 'User not found' }, 404);
    }

    console.log(`[ROUTE] POST /api/favorites — Added song ${songId} to user ${req.user.id}'s favorites`);
    sendResponse(res, user.favorites);
  } catch (error) {
    handleError(res, error, '/api/favorites');
  }
});

// Remove from favorites
router.delete('/:songId', optionalAuth, async (req, res) => {
  console.log(`[ROUTE] DELETE /api/favorites/${req.params.songId}`);
  
  try {
    const { songId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(songId)) {
      console.warn('[WARN] Invalid song ID:', songId);
      return sendResponse(res, { error: 'Invalid song ID' }, 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: { 
          favorites: { 
            songId: new mongoose.Types.ObjectId(songId)
          }
        }
      },
      { new: true, select: 'favorites' }
    ).populate('favorites.songId');

    if (!user) {
      console.warn('[WARN] User not found:', req.user.id);
      return sendResponse(res, { error: 'User not found' }, 404);
    }

    sendResponse(res, user.favorites);
  } catch (error) {
    handleError(res, error, `/api/favorites/${req.params.songId}`);
  }
});

// Get favorites
router.get('/', optionalAuth, addFavoriteStatus, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'favorites.songId',
        // Explicitly select fields to match Song schema
        select: 'videoId title artist composer album year genre language playCount lastPlayed'
      })
      .sort({ 'favorites.addedAt': -1 });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format response to match Song schema
    const favorites = user.favorites.map(fav => ({
      ...fav.songId.toObject(),  // Convert Mongoose document to plain object
      addedAt: fav.addedAt
    }));

    res.json(favorites);
  } catch (error) {
    console.error('[Favorites Error]', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;