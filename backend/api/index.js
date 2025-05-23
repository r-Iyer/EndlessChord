require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Channel = require('../models/Channel');
const { Song } = require('../models/Song');
const { initializeDbTables, initializeDbConnection } = require('../init/initialiseHelper');
const { addAISuggestionsIfNeeded } = require('../utils/aiHelpers');
const { MINIMUM_SONG_COUNT, DEFAULT_SONG_COUNT } = require('../config/constants');
const { sortByRelevance, getSortingStats, CONFIDENCE_THRESHOLD } = require('../utils/sortingHelpers'); 
const { parseExcludeIds, getRecentlyPlayedIds, getSongsWithExclusions } = require('../utils/songHelpers');

const app = express();
app.use(cors());
app.use(express.json());

// Generic error handler
const handleError = (res, error, message = 'Server error', statusCode = 500) => {
  console.error(`[ERROR] ${message}:`, error);
  return res.status(statusCode).json({ message });
};

// Generic response handler
const sendResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json(data);
};

// Routes
app.get('/api/channels', async (req, res) => {
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

app.get('/api/channels/:id', async (req, res) => {
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

// Updated channel songs route to also use confidence scoring when needed

app.get('/api/channels/:id/songs', async (req, res) => {
  const { source } = req.query;
  console.log(`[ROUTE] GET /api/channels/${req.params.id}/songs — Source: ${source}`);
  
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return sendResponse(res, { message: 'Channel not found' }, 404);
    }
    
    const excludeIds = parseExcludeIds(req.query.excludeIds);
    //const recentlyPlayedIds = await getRecentlyPlayedIds(channel.language);
    //Temporary
    const recentlyPlayedIds = [];
    const allExcludeIds = [...new Set([...recentlyPlayedIds, ...excludeIds])];
    
    let songs = await getSongsWithExclusions(channel.language, allExcludeIds);
    
  

    const { songs: updatedSongs, aiSuggestionsAdded } = await addAISuggestionsIfNeeded(songs, channel, allExcludeIds);
    songs = updatedSongs;

    //If no aiSuggestions were added, and it is initial click, return the minimum number of songs
    if(aiSuggestionsAdded == false && source == 'initial') {
      songs = sortSongsByLastPlayed(songs);
      songs = songs.slice(0, MINIMUM_SONG_COUNT);
    }
    
    console.log(`[SONGS] Returning ${songs.length} songs for channel ${channel.name}`);
    sendResponse(res, songs);
  } catch (error) {
    handleError(res, error, `/api/channels/${req.params.id}/songs`);
  }
});

// Updated search route
app.get('/api/search', async (req, res) => {
  const { q: searchQuery, excludeIds: excludeIdsParam } = req.query;
  console.log(`[ROUTE] GET /api/search — Query: ${searchQuery}`);
  
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

      const { songs: enhancedSongs, aiSuggestionsAdded } = await addAISuggestionsIfNeeded(finalSongs, searchChannel, existingVideoIds);
    
      finalSongs =   enhancedSongs.map(song =>
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

app.post('/api/songs/played', async (req, res) => {
  console.log('[ROUTE] POST /api/songs/played');
  
  try {
    const { songIds } = req.body;
    
    if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
      return sendResponse(res, { message: 'Invalid request. songIds array is required.' }, 400);
    }
    
    const updateResults = await Promise.all(
      songIds.map(async (songId) => {
        const song = await Song.findById(songId);
        if (song) {
          song.playCount += 1;
          song.lastPlayed = new Date();
          await song.save();
          return { id: songId, success: true };
        }
        return { id: songId, success: false, message: 'Song not found' };
      })
    );
    
    console.log(`[SONGS] Updated play count for ${updateResults.filter(r => r.success).length} songs`);
    sendResponse(res, { success: true, updates: updateResults });
  } catch (error) {
    handleError(res, error, '/api/songs/played');
  }
});

// Create search regex
const createSearchRegex = (searchQuery) => {
  const words = searchQuery.split(/\s+/)
  .filter(w => w.length > 2)
  .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(?:${words.join('|')})\\b`, 'i');
};

// Build search query
const buildSearchQuery = (searchRegex, excludeIds) => {
  const query = {
    $or: [
      { title: searchRegex },
      { artist: searchRegex },
      { composer: searchRegex },
      { description: searchRegex },
      { tags: searchRegex }
    ]
  };
  
  if (excludeIds.length > 0) {
    query.videoId = { $nin: excludeIds };
  }
  
  return query;
};

const sortSongsByLastPlayed = songs =>
  songs.slice().sort((a, b) =>
    (a.lastPlayed ? 1 : 0) - (b.lastPlayed ? 1 : 0) ||
    (a.lastPlayed - b.lastPlayed)
  );

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[LOCAL] Server running on port ${PORT}`);
  });
}

module.exports = app;