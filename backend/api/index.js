require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Channel = require('../models/Channel');
const { Song } = require('../models/Song');
const { initializeDbTables, initializeDbConnection } = require('../init/initialiseHelper');
const { getUniqueAISuggestions, } = require('../utils/aiHelpers');
const songCacheService = require('../services/songCacheService');
const { MINIMUM_SONG_COUNT} = require('../config/constants');

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
        // New format: JSON array of IDs
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

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[LOCAL] Server running on port ${PORT}`);
  });
}

module.exports = app;