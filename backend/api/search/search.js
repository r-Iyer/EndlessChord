require('dotenv').config();
const express = require('express');
const { requireAuth } = require('../../utils/authUtils');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const { addAISuggestionsIfNeeded } = require('../../utils/aiUtils');
const { parseExcludeIds } = require('../../utils/songUtils');
const { searchSongsWithPostProcessing } = require('../../utils/searchUtils');
const { MINIMUM_SONG_COUNT } = require('../../config/constants');
const { addFavoriteStatus } = require('../../utils/userUtils');
const { createChannelWithSearchQuery } = require('../../utils/channelUtils.js');
const logger = require('../../utils/loggerUtils');

const router = express.Router();

router.get('/', requireAuth, addFavoriteStatus, async (req, res) => {
  const { q: searchQuery, excludeIds: excludeIdsParam, source: source } = req.query;
  logger.info(`[ROUTE] GET /api/search — Query: ${searchQuery}`);
  logger.info(`[ROUTE] GET /api/search — source: ${source}`);

  try {
    if (!searchQuery) {
      return sendResponse(res, { message: 'Search query is required' }, 400);
    }
    
    const excludeIds = parseExcludeIds(excludeIdsParam);

    // Find Songs with matching query in the database and exclude songs in current queue
    // Note: Songs returned are sorted by score and last played
    // Beyond a certain threshold, songs are shuffled
    // Rule III.1.b, Rule III.2.b
    let songs = await searchSongsWithPostProcessing(searchQuery, excludeIds);

    logger.info(`[ROUTE] GET /api/search — Found ${songs.length} matching songs in database`);
    
    // Add AI suggestions only if we don't have enough high-quality results
    if (songs.length < MINIMUM_SONG_COUNT) {      
      // Create dummy channel with search query
      const searchChannel = createChannelWithSearchQuery(searchQuery);
      
      const existingVideoIds = [...excludeIds, ...songs.map(s => s.videoId)];

      let { songs: updatedSongs } = await addAISuggestionsIfNeeded(songs, searchChannel, existingVideoIds, source, req.user?.id, null);
      //updatedSongs = sortSongsBySearchRelevance(updatedSongs, searchQuery);
      songs = updatedSongs;
    }
    
    logger.info(`[ROUTE] GET /api/search — Returning ${songs.length} songs for query "${searchQuery}"`);
    
    sendResponse(res, songs);
  } catch (error) {
    handleError(res, error, '/api/search');
  }
});

module.exports = router;
