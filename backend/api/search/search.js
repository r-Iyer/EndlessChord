require('dotenv').config();
const express = require('express');
const { optionalAuth } = require('../../utils/authUtils');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const { addAISuggestionsIfNeeded } = require('../../utils/aiUtils');
const { parseExcludeIds, sortSongs } = require('../../utils/songUtils');
const { searchSongsInDb } = require('../../utils/searchUtils');
const { MINIMUM_SONG_COUNT, DEFAULT_SONG_COUNT } = require('../../config/constants');
const { addFavoriteStatus } = require('../../utils/favoriteUtils');
const logger = require('../../utils/loggerUtils');

const router = express.Router();

router.get('/', optionalAuth, addFavoriteStatus, async (req, res) => {
  const { q: searchQuery, excludeIds: excludeIdsParam, source: source } = req.query;
  logger.info(`[ROUTE] GET /api/search — Query: ${searchQuery}`);
  logger.info(`[ROUTE] GET /api/search — source: ${source}`);

  try {
    if (!searchQuery) {
      return sendResponse(res, { message: 'Search query is required' }, 400);
    }
    
    const excludeIds = parseExcludeIds(excludeIdsParam);

    //Find Songs with matching query in the database and exclude songs in current queue
    let songs = await searchSongsInDb(searchQuery, excludeIds);
    logger.info(`[ROUTE] GET /api/search — Found ${songs.length} matching songs in database`);
    
    // Add AI suggestions only if we don't have enough high-quality results
    if ( songs.length < MINIMUM_SONG_COUNT) {      
      const searchChannel = {
        name: "",
        language: "various",
        description: searchQuery,
        genre: [] 
      };
      
      const existingVideoIds = [...excludeIds, ...songs.map(s => s.videoId)];

      //If user has searched for songs, to ensure faster initial loading, we will limit the number of AI suggestions
      let song_count = (source === 'initial') ? MINIMUM_SONG_COUNT : DEFAULT_SONG_COUNT;

      const { songs: updatedSongs } = await addAISuggestionsIfNeeded(songs, searchChannel, existingVideoIds, song_count);
      songs = updatedSongs;
    }

    //Sort songs by score and limit to default count
    songs = sortSongs(songs, searchQuery).slice(0, DEFAULT_SONG_COUNT);
    
    logger.info(`[ROUTE] GET /api/search — Returning ${songs.length} songs for query "${searchQuery}"`);
    
    sendResponse(res, songs);
  } catch (error) {
    handleError(res, error, '/api/search');
  }
});

module.exports = router;