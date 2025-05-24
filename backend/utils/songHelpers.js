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

// Get songs with exclusions
const getSongsWithExclusions = async (genre, language, excludeIds) => {
  return await Song.find({ 
    genre: { $in: [genre] },      // Check if genre array contains this value
    language: { $in: [language] }, // Check if language array contains this value
    videoId: { $nin: excludeIds }
  }).sort({ playCount: 1 });
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

module.exports = { parseExcludeIds, getSongsWithExclusions, sortSongsByLastPlayed };
