require('dotenv').config();
const express = require('express');
const { optionalAuth } = require('../../utils/authUtils');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const { reinitializeDatabase, initializeDbConnection } = require('../../utils/initialiseUtils');
const { getChannelsInDb, getChannelsInDbById } = require('../../helpers/channelHelpers');

const router = express.Router();

// Routes
router.get('/', optionalAuth, async (req, res) => {
  console.log('[ROUTE] GET /api/channels');
  await initializeDbConnection();
  //Reinitialize database tables if needed
  //await reinitializeDatabase();
  //Add indices to song
  //await Song.initSearchIndex();
  
  try {
    const channels = await getChannelsInDb();
    sendResponse(res, channels);
  } catch (error) {
    handleError(res, error, '/api/channels');
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  console.log(`[ROUTE] GET /api/channels/${req.params.id}`);
  
  try {
    const channel = await getChannelsInDbById(req.params.id);
    
    if (!channel) {
      console.warn('[WARN] Channel not found:', req.params.id);
      return sendResponse(res, { message: 'Channel not found' }, 404);
    }
    sendResponse(res, channel);
  } catch (error) {
    handleError(res, error, `/api/channels/${req.params.id}`);
  }
});

module.exports = router;