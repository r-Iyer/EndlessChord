require('dotenv').config();
const express = require('express');
const { addAISuggestionsIfNeeded } = require('../../utils/aiUtils');
const { parseExcludeIds, getSongsWithExclusions } = require('../../utils/songUtils');
const { optionalAuth } = require('../../utils/authUtils');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const { addFavoriteStatus } = require('../../utils/favoriteUtils');
const { getChannelsInDbById } = require('../../helpers/channelHelpers');
const { getUserRecentSongsInDb } = require('../../helpers/userHelpers');
const logger = require('../../utils/loggerUtils');

const router = express.Router();

router.get('/:channelId', optionalAuth, addFavoriteStatus, async (req, res) => {
  const { source } = req.query;
  const entity = req.baseUrl.split('/')[2];

  logger.info(`[ROUTE] GET /api/songs/${req.params.channelId} — Source: ${source}`);
  
  try {
    const channel = await getChannelsInDbById(req.params.channelId);
    if (!channel) {
      return sendResponse(res, { message: 'Channel not found' }, 404);
    }
    
    const excludeIds = parseExcludeIds(req.query.excludeIds);
    const userRecentIds = await getUserRecentSongsInDb(req);

    //Exclude IDs involving both user recent songs and existing queue of songs
    const allExcludeIds = [...new Set([...(userRecentIds || []), ...excludeIds])];
    
    //Get all songs from the DB with exclusions applied
    let songs = await getSongsWithExclusions(channel.genre, channel.language, allExcludeIds, source, entity);
  
    logger.info(`[ROUTE] GET /api/songs/${req.params.channelId} — Found ${songs.length} matching songs in database`);

    //Append AI suggested songs if needed
    let { songs: updatedSongs, aiSuggestionsAdded } = await addAISuggestionsIfNeeded(songs, channel, allExcludeIds, source, req.user.id, entity);
    
    logger.info(`[ROUTE] GET /api/songs/${req.params.channelId} — Returning ${updatedSongs.length} songs for channel ${channel.name}`);
    logger.info(`[ROUTE] GET /api/songs/${req.params.channelId} — AI Suggestions added:  ${aiSuggestionsAdded}`);

    sendResponse(res, updatedSongs);
  } catch (error) {
    handleError(res, error, `/api/songs/${req.params.channelId}`);
  }
});

module.exports = router;