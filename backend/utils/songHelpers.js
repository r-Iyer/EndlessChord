const { Song } = require('../models/Song');

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
    language: { $in: [language] },
    lastPlayed: { $exists: true }
  }).sort({ lastPlayed: -1 }).select('videoId');
  return recentlyPlayed.map(song => song.videoId);
};

// Get songs with exclusions
const getSongsWithExclusions = async (genre, language, excludeIds) => {
  return await Song.find({ 
    genre: { $in: [genre] },      // Check if genre array contains this value
    language: { $in: [language] }, // Check if language array contains this value
    videoId: { $nin: excludeIds }
  }).sort({ playCount: 1 });
};

module.exports = { parseExcludeIds, getRecentlyPlayedIds, getSongsWithExclusions };
