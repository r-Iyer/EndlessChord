require('dotenv').config();
const express = require('express');
const User = require('../../models/User');
const Channel = require('../../models/Channel');
const { optionalAuth } = require('../../utils/authHelpers');
const { handleError, sendResponse } = require('../../utils/handlers');
const { initializeDbTables, initializeDbConnection } = require('../../init/initialiseHelper');

const router = express.Router();

// Routes
router.get('/', optionalAuth, async (req, res) => {
  console.log('[ROUTE] GET /api/channels');
  await initializeDbConnection();
  //Commented re-initialising song table
  //await initializeDbTables(Channel, Song);
  
  try {
    const channels = await Channel.find();
    sendResponse(res, channels);
  } catch (error) {
    handleError(res, error, '/api/channels');
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  console.log(`[ROUTE] GET /api/channels/${req.params.id}`);
  
  try {
    const channel = await Channel.findById(req.params.id);
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