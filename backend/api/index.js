require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db');
const Channel = require('../models/Channel');
const Song = require('../models/Song');
const { initializeDatabase } = require('../utils/dbInit');
const { getAISuggestions} = require('../utils/aiHelpers');

const app = express();
app.use(cors());
app.use(express.json());

let dbInitialized = false;
let ai;
async function initialize() {
  if (!dbInitialized) {
    console.log('[INIT] Connecting to MongoDB...');
    await connectDB();
    const { GoogleGenAI } = require('@google/genai');
    ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }); // <-- use 'new'
    await initializeDatabase(Channel, Song);
    dbInitialized = true;
    console.log('[INIT] Initialization complete.');
  }
}

app.get('/api/channels', async (req, res) => {
  console.log('[ROUTE] GET /api/channels');
  await initialize();
  try {
    const channels = await Channel.find();
    res.json(channels);
  } catch (error) {
    console.error('[ERROR] /api/channels:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/channels/:id', async (req, res) => {
  console.log(`[ROUTE] GET /api/channels/${req.params.id}`);
  await initialize();
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

// Optional: Get channel by slugified name (for future-proofing)
app.get('/api/channels/by-name/:slug', async (req, res) => {
  await initialize();
  try {
    const slug = req.params.slug.toLowerCase();
    const channels = await Channel.find();
    const channel = channels.find(
      c => c.name.replace(/\s+/g, '-').toLowerCase() === slug
    );
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    res.json(channel);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Returns true if there are duplicate videoIds in the array.
 */
function hasDuplicateVideoIds(songs) {
  const seen = new Set();
  for (const s of songs) {
    if (seen.has(s.videoId)) return true;
    seen.add(s.videoId);
  }
  return false;
}

/**
 * Filters out songs with videoIds in excludeIds or already in baseSongs.
 */
function filterAISuggestions(aiSuggestions, excludeIds, baseSongs) {
  const baseIds = new Set(baseSongs.map(s => s.videoId));
  return aiSuggestions.filter(s =>
    !excludeIds.includes(s.videoId) && !baseIds.has(s.videoId)
  );
}

/**
 * Get AI suggestions with duplicate check and retry logic.
 */
async function getUniqueAISuggestions(channel, Song, excludeIds, baseSongs, maxRetries = 3) {
  let aiSuggestions = [];
  let aiRetryCount = 0;
  do {
    aiSuggestions = await getAISuggestions(channel, Song);
    aiSuggestions = filterAISuggestions(aiSuggestions, excludeIds, baseSongs);
    if (!hasDuplicateVideoIds(aiSuggestions)) break;
    aiRetryCount++;
  } while (aiRetryCount < maxRetries);
  return aiSuggestions;
}

app.get('/api/channels/:id/songs', async (req, res) => {
  console.log(`[ROUTE] GET /api/channels/${req.params.id}/songs`);
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
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

app.get('/api/test-gpt', async (req, res) => {
  console.log('[ROUTE] GET /api/test-gpt');
  await initialize();
  try {
    const prompt = "Say hello to the world in a creative way.";
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });
    const responseText = response.text; // <-- fix here
    const cleanText = responseText.replace(/```json\n|\n```/g, '');
    res.json({ message: cleanText });
  } catch (error) {
    console.error('[ERROR] /api/test-gpt:', error);
    res.status(500).json({ message: 'Error testing Gemini', error: error.message });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[LOCAL] Server running on port ${PORT}`);
  });
}

module.exports = app;