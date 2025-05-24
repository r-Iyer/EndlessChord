require('dotenv').config();
const express = require('express');
const { optionalAuth } = require('../../utils/authHelpers');
const { handleError, sendResponse } = require('../../utils/handlers');
const { Song } = require('../../models/Song');
const { addAISuggestionsIfNeeded } = require('../../utils/aiHelpers');
const { parseExcludeIds } = require('../../utils/songHelpers');
const { sortByRelevance, getSortingStats, CONFIDENCE_THRESHOLD } = require('../../utils/sortingHelpers');
const { createSearchRegex, buildSearchQuery } = require('../../utils/searchHelpers');
const { MINIMUM_SONG_COUNT, DEFAULT_SONG_COUNT } = require('../../config/constants');
const { addFavoriteStatus } = require('../../utils/favoriteHelpers');

const router = express.Router();

router.get('/', optionalAuth, addFavoriteStatus, async (req, res) => {
  const { q: searchQuery, excludeIds: excludeIdsParam, source: source } = req.query;
  console.log(`[ROUTE] GET /api/search — Query: ${searchQuery}`);
  console.log(`[ROUTE] GET /api/search — source: ${source}`);

  try {
    if (!searchQuery) {
      return sendResponse(res, { message: 'Search query is required' }, 400);
    }
    
    const excludeIds = parseExcludeIds(excludeIdsParam);
    const searchRegex = createSearchRegex(searchQuery);
    const query = buildSearchQuery(searchRegex, excludeIds);
    
    // Get more songs initially for better filtering
    let songs = await Song.find(query).sort({ playCount: 1 }).limit(50);
    console.log(`[SEARCH] Found ${songs.length} matching songs in database`);
    
    // Apply sophisticated sorting and confidence filtering
    const sortedAndFilteredSongs = sortByRelevance(songs, searchQuery);
    const sortingStats = getSortingStats(songs, sortedAndFilteredSongs, searchQuery);
    
    console.log(`[SEARCH] Confidence filtering stats:`, {
      original: sortingStats.originalCount,
      filtered: sortingStats.filteredCount,
      avgConfidence: sortingStats.averageConfidence.toFixed(3),
      threshold: CONFIDENCE_THRESHOLD
    });
    
    // Check if we have enough high-quality results before adding AI suggestions
    const hasHighQualityResults = sortedAndFilteredSongs.length >= MINIMUM_SONG_COUNT && 
    sortingStats.averageConfidence >= CONFIDENCE_THRESHOLD;
    
    let finalSongs = sortedAndFilteredSongs;
    
    // Add AI suggestions only if we don't have enough high-quality results
    if (!hasHighQualityResults) {
      console.log(`[SEARCH] Adding AI suggestions - current results: ${finalSongs.length}, avg confidence: ${sortingStats.averageConfidence.toFixed(3)}`);
      
      const searchChannel = {
        name: null,
        language: "various",
        description: searchQuery
      };
      
      const existingVideoIds = [...excludeIds, ...finalSongs.map(s => s.videoId)];

      let song_count = (source === 'initial') ? MINIMUM_SONG_COUNT : DEFAULT_SONG_COUNT;

      const { songs: enhancedSongs, aiSuggestionsAdded } = await addAISuggestionsIfNeeded(finalSongs, searchChannel, existingVideoIds, song_count);
    
      finalSongs = enhancedSongs.map(song =>
        song.toObject ? song.toObject() : { ...song }
      );
    }
    
    // Limit final results
    finalSongs = finalSongs.slice(0, DEFAULT_SONG_COUNT);
    
    console.log(`[SEARCH] Returning ${finalSongs.length} songs for query "${searchQuery}"`);
    
    // Clean up confidence scores from response to maintain original format
    const cleanedSongs = finalSongs.map(song => {
      const { confidenceScore, ...cleanSong } = song;
      return cleanSong;
    });
    
    sendResponse(res, cleanedSongs);
  } catch (error) {
    handleError(res, error, '/api/search');
  }
});

module.exports = router;