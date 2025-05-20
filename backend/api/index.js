require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Channel = require('../models/Channel');
const { Song } = require('../models/Song');
const { initializeDbTables, initializeDbConnection } = require('../init/initialiseHelper');
const { getUniqueAISuggestions, } = require('../utils/aiHelpers');
const songCacheService = require('../services/songCache');

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

  const source = req.query.source; // "initial" or "refresh"
  console.log(`[ROUTE] GET /api/channels/${req.params.id}/songs — Source: ${source}`);
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    if (source === 'initial') {
      try {
        const songs = await songCacheService.getCachedSongs(channel._id, 3);
        return res.json(songs);
      } catch (error) {
    console.error(`[ERROR] /api/channels/${req.params.id}/songs:`, error);
    res.status(500).json({ message: 'Server error' });
  }
    }
    const excludeIds = req.query.exclude ? req.query.exclude.split(',') : [];
    const recentlyPlayed = await Song.find({ 
      language: channel.language,
      lastPlayed: { $exists: true }
    }).sort({ lastPlayed: -1 }).select('videoId');
    const recentlyPlayedIds = recentlyPlayed.map(song => song.videoId);
    const allExcludeIds = [...new Set([...recentlyPlayedIds, ...excludeIds])];
    let songs = await Song.find({ 
      language: channel.language,
      videoId: { $nin: allExcludeIds }
    }).sort({ playCount: 1 }).limit(5);

    if (songs.length < 5) {
      try {
        const aiSuggestions = await getUniqueAISuggestions(channel, Song, allExcludeIds, songs);
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

    for (const song of songs) {
      song.playCount += 1;
      song.lastPlayed = new Date();
      await song.save();
    }
    console.log(`[SONGS] Returning ${songs.length} songs for channel ${channel.name}`);
    res.json(songs);
  } catch (error) {
    console.error(`[ERROR] /api/channels/${req.params.id}/songs:`, error);
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