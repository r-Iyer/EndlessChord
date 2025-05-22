require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Channel = require('../models/Channel');
const { Song } = require('../models/Song');
const { initializeDbTables, initializeDbConnection } = require('../init/initialiseHelper');
const { getUniqueAISuggestions } = require('../utils/aiHelpers');
const songCacheService = require('../services/songCacheService');
const { MINIMUM_SONG_COUNT, DEFAULT_SONG_COUNT } = require('../config/constants');

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

// Parse exclude IDs safely
const parseExcludeIds = (excludeIdsParam) => {
  try {
    return excludeIdsParam ? JSON.parse(excludeIdsParam) : [];
  } catch (error) {
    console.error('Error parsing excludeIds:', error);
    return [];
  }
};

// Get recently played song IDs
const getRecentlyPlayedIds = async (language) => {
  const recentlyPlayed = await Song.find({ 
    language,
    lastPlayed: { $exists: true }
  }).sort({ lastPlayed: -1 }).select('videoId');
  return recentlyPlayed.map(song => song.videoId);
};

// Get songs with exclusions
const getSongsWithExclusions = async (language, excludeIds) => {
  return await Song.find({ 
    language,
    videoId: { $nin: excludeIds }
  }).sort({ playCount: 1 });
};

// Add AI suggestions when needed
const addAISuggestionsIfNeeded = async (songs, channel, excludeIds) => {
  if (songs.length >= MINIMUM_SONG_COUNT) return songs;
  
  try {
    const aiSuggestions = await getUniqueAISuggestions(channel, Song, excludeIds, songs, DEFAULT_SONG_COUNT);
    console.log(aiSuggestions);
    
    const newSongs = await Promise.all(
      aiSuggestions.map(async (suggestion) => {
        const exists = await Song.findOne({ videoId: suggestion.videoId });
        if (!exists) {
          const newSong = new Song({ ...suggestion, language: channel.language });
          await newSong.save();
          return newSong;
        }
        return null;
      })
    );
    
    return [...songs, ...newSongs.filter(Boolean)];
  } catch (aiError) {
    console.error('Error getting AI suggestions:', aiError);
    return songs;
  }
};

// Routes
app.get('/api/channels', async (req, res) => {
  console.log('[ROUTE] GET /api/channels');
  await initializeDbConnection();
  await initializeDbTables(Channel, Song);
  
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

app.get('/api/channels/:id/songs', async (req, res) => {
  const { source } = req.query;
  console.log(`[ROUTE] GET /api/channels/${req.params.id}/songs — Source: ${source}`);
  
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return sendResponse(res, { message: 'Channel not found' }, 404);
    }
    
    // Handle initial source
    if (source === 'initial') {
      try {
        const songs = await songCacheService.getCachedSongs(channel.name);
        await Song.insertMany(songs, { ordered: false })
          .catch(err => { if (err.code !== 11000) throw err });
        return sendResponse(res, songs);
      } catch (error) {
        return handleError(res, error, `/api/channels/${req.params.id}/songs`);
      }
    }
    
    const excludeIds = parseExcludeIds(req.query.excludeIds);
    const recentlyPlayedIds = await getRecentlyPlayedIds(channel.language);
    const allExcludeIds = [...new Set([...recentlyPlayedIds, ...excludeIds])];
    
    let songs = await getSongsWithExclusions(channel.language, allExcludeIds);
    songs = await addAISuggestionsIfNeeded(songs, channel, allExcludeIds);
    
    console.log(`[SONGS] Returning ${songs.length} songs for channel ${channel.name}`);
    sendResponse(res, songs);
  } catch (error) {
    handleError(res, error, `/api/channels/${req.params.id}/songs`);
  }
});

app.get('/api/search', async (req, res) => {
  const { q: searchQuery, custom: isCustomSearch, excludeIds: excludeIdsParam } = req.query;
  console.log(`[ROUTE] GET /api/search — Query: ${searchQuery}`);

  try {
    if (!searchQuery) {
      return sendResponse(res, { message: 'Search query is required' }, 400);
    }
    
    const excludeIds = parseExcludeIds(excludeIdsParam);
    const searchRegex = createSearchRegex(searchQuery);
    const query = buildSearchQuery(searchRegex, excludeIds);
    
    let songs = await Song.find(query).sort({ playCount: 1 }).limit(20);
    console.log(`[SEARCH] Found ${songs.length} matching songs in database`);
    
    // Add AI suggestions for custom searches
    if (songs.length < MINIMUM_SONG_COUNT && isCustomSearch === 'true') {
      const searchChannel = {
        name: null,
        language: "various",
        description: searchQuery
      };
      
      songs = await addAISuggestionsIfNeeded(songs, searchChannel, songs.map(s => s.videoId));
    }
    
    const sortedSongs = sortByRelevance(songs, searchQuery);
    console.log(`[SEARCH] Returning ${sortedSongs.length} songs for query "${searchQuery}"`);
    sendResponse(res, sortedSongs);
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
      { description: searchRegex },
      { tags: searchRegex }
    ]
  };
  
  if (excludeIds.length > 0) {
    query.videoId = { $nin: excludeIds };
  }
  
  return query;
};

// Sort songs by relevance
const sortByRelevance = (songs, searchQuery) => {
  return songs.sort((a, b) => {
    const aHasTermInTitle = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const bHasTermInTitle = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (aHasTermInTitle && !bHasTermInTitle) return -1;
    if (!aHasTermInTitle && bHasTermInTitle) return 1;
    
    return (a.playCount || 0) - (b.playCount || 0);
  });
};

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[LOCAL] Server running on port ${PORT}`);
  });
}

module.exports = app;