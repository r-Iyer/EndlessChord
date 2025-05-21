require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Channel = require('../models/Channel');
const { Song } = require('../models/Song');
const { initializeDbTables, initializeDbConnection } = require('../init/initialiseHelper');
const { getUniqueAISuggestions, } = require('../utils/aiHelpers');
const songCacheService = require('../services/songCacheService');
const { MINIMUM_SONG_COUNT} = require('../config/constants');
const { DEFAULT_SONG_COUNT } = require('../config/constants');

const app = express();
app.use(cors());
app.use(express.json());

//Fetch all channels

app.get('/api/channels', async (req, res) => {
  console.log('[ROUTE] GET /api/channels');
  await initializeDbConnection();
  await initializeDbTables(Channel, Song);
  try {
    const channels = await Channel.find();
    res.json(channels);
  } catch (error) {
    console.error('[ERROR] /api/channels:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//Fetch a channel by ID

app.get('/api/channels/:id', async (req, res) => {
  console.log(`[ROUTE] GET /api/channels/${req.params.id}`);
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      console.warn('[WARN] Channel not found:', req.params.id);
      return res.status(404).json({ message: 'Channel not found' });
    }
    res.json(channel);
  } catch (error) {
    console.error(`[ERROR] /api/channels/${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

//Fetch songs for a channel

app.get('/api/channels/:id/songs', async (req, res) => {
  
  const source = req.query.source; // "initial" or undefined
  console.log(`[ROUTE] GET /api/channels/${req.params.id}/songs — Source: ${source}`);
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    if (source === 'initial') {
      try {
        const songs = await songCacheService.getCachedSongs(channel.name);
        await Song.insertMany(songs, { ordered: false })
  .catch(err => { if (err.code !== 11000) throw err });
        return res.json(songs);
      } catch (error) {
        console.error(`[ERROR] /api/channels/${req.params.id}/songs:`, error);
        res.status(500).json({ message: 'Server error' });
      }
    }
    let excludeIds = [];
    try {
        excludeIds = JSON.parse(req.query.excludeIds);
      } catch (error) {
        console.error('Error parsing excludeIds:', error);
      }
    const recentlyPlayed = await Song.find({ 
      language: channel.language,
      lastPlayed: { $exists: true }
    }).sort({ lastPlayed: -1 }).select('videoId');
    const recentlyPlayedIds = recentlyPlayed.map(song => song.videoId);
    const allExcludeIds = [...new Set([...recentlyPlayedIds, ...excludeIds])];
    let songs = await Song.find({ 
      language: channel.language,
      videoId: { $nin: allExcludeIds }
    }).sort({ playCount: 1 })
    
    if (songs.length < MINIMUM_SONG_COUNT) {
      try {
        const aiSuggestions = await getUniqueAISuggestions(channel, Song, allExcludeIds, songs, DEFAULT_SONG_COUNT);
        console.log(aiSuggestions)
        const newSongs = [];
        for (const suggestion of aiSuggestions) {
          const exists = await Song.findOne({ videoId: suggestion.videoId });
          if (!exists) {
            const newSong = new Song({
              ...suggestion,
              language: channel.language
            });
            await newSong.save();
            newSongs.push(newSong);
          }
        }
        songs = [...songs, ...newSongs];
      } catch (aiError) {
        console.error('Error getting AI suggestions:', aiError);
      }
    }
    console.log(`[SONGS] Returning ${songs.length} songs for channel ${channel.name}`);
    res.json(songs);
  } catch (error) {
    console.error(`[ERROR] /api/channels/${req.params.id}/songs:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// New API endpoint to update play count
app.post('/api/songs/played', async (req, res) => {
  console.log('[ROUTE] POST /api/songs/played');
  try {
    const { songIds } = req.body;
    
    if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
      return res.status(400).json({ message: 'Invalid request. songIds array is required.' });
    }
    
    const updateResults = [];
    
    for (const songId of songIds) {
      const song = await Song.findById(songId);
      if (song) {
        song.playCount += 1;
        song.lastPlayed = new Date();
        await song.save();
        updateResults.push({ id: songId, success: true });
      } else {
        updateResults.push({ id: songId, success: false, message: 'Song not found' });
      }
    }
    
    console.log(`[SONGS] Updated play count for ${updateResults.filter(r => r.success).length} songs`);
    res.json({ success: true, updates: updateResults });
  } catch (error) {
    console.error('[ERROR] /api/songs/played:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Search API endpoint
 * Searches for songs across all channels based on query parameter
 */
app.get('/api/search', async (req, res) => {
  console.log(`[ROUTE] GET /api/search — Query: ${req.query.q}`);

  try {
    const searchQuery = req.query.q;
    const isCustomSearch = req.query.custom === 'true';
    
    if (!searchQuery) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Parse excludeIds if provided
    let excludeIds = [];
    try {
      if (req.query.excludeIds) {
        excludeIds = JSON.parse(req.query.excludeIds);
      }
    } catch (error) {
      console.error('[ERROR] Failed to parse excludeIds:', error);
    }
    
    // Create search regex for case-insensitive partial matching
    const searchRegex = new RegExp(searchQuery.split(' ').join('|'), 'i');
    
    // Build query with exclusions
    const query = {
      $or: [
        { title: searchRegex },
        { artist: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ]
    };
    
    // Add excludeIds filter if any were provided
    if (excludeIds.length > 0) {
      query.videoId = { $nin: excludeIds };
    }
    
    
    // First, get matching songs from the database
    let songs = await Song.find(query).sort({ playCount: 1 }).limit(20);
    
    console.log(`[SEARCH] Found ${songs.length} matching songs in database`);
    
    // If we don't have enough songs, use AI to generate suggestions
    if (songs.length < MINIMUM_SONG_COUNT && isCustomSearch) {
      try {
        // Get existing video IDs to exclude
        const existingIds = songs.map(song => song.videoId);
        
        // Combine excludeIds with existingIds for AI suggestions
        const combinedExcludeIds = [...existingIds];
        
        // Create a temporary channel object with the search query
        const searchChannel = {
          name: null,
          language: "various",
          description: searchQuery
        };
        
        const aiSuggestions = await getUniqueAISuggestions(
          searchChannel, 
          Song, 
          combinedExcludeIds, 
          [], 
          DEFAULT_SONG_COUNT
        );
        
        // Save new songs to database
        const newSongs = [];
        for (const suggestion of aiSuggestions) {
          const exists = await Song.findOne({ videoId: suggestion.videoId });
          if (!exists) {
            const newSong = new Song({
              ...suggestion,
              language: suggestion.language || "various"
            });
            await newSong.save();
            newSongs.push(newSong);
          }
        }
        
        // Add new songs to our results
        songs = [...songs, ...newSongs];
      } catch (aiError) {
        console.error('[ERROR] Error getting AI suggestions for search:', aiError);
      }
    }
    
    // Improve relevance by sorting based on search term match in title
    songs.sort((a, b) => {
      // Check if search term is in the title
      const aHasTermInTitle = a.title.toLowerCase().includes(searchQuery.toLowerCase());
      const bHasTermInTitle = b.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (aHasTermInTitle && !bHasTermInTitle) return -1;
      if (!aHasTermInTitle && bHasTermInTitle) return 1;
      
      // If both have or don't have term in title,
      // sort by play count (less played first)
      return (a.playCount || 0) - (b.playCount || 0);
    });
    
    console.log(`[SEARCH] Returning ${songs.length} songs for query "${searchQuery}"`);
    res.json(songs);
  } catch (error) {
    console.error('[ERROR] /api/search:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[LOCAL] Server running on port ${PORT}`);
  });
}

module.exports = app;