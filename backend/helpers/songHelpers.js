const { Song } = require('../models/Song');
const logger = require('../utils/loggerUtils');

const getSongsWithExclusionsFromDb = async (genreFilter, languageFilter, excludeIds) => {
  try {
    const song = await Song.find({
      $and: [
        { genre:    { $in: genreFilter } },    // genre must match one of these
        { language: { $in: languageFilter } }, // language must match one of these
        { videoId:  { $nin: excludeIds } }     // exclude these IDs
      ]
    });
    logger.debug(`[getSongsWithExclusionsFromDb] Found ${song.length} songs with exclusions`);
    return song;
  } catch (error) {
    logger.error('[getSongsWithExclusionsFromDb] Error fetching songs:', error);
    return [];
  }
};

const getSongByVideoIdFromDb = async (videoId) => {
  try {
    const song = await Song.findOne({ videoId: videoId });
    logger.debug(`[getSongByVideoIdFromDb] Found song with videoId: ${videoId}`);
    return song;
  } catch (error) {
    logger.error(`[getSongByVideoIdFromDb] Error fetching song with videoId: ${videoId}`, error);
    return null;
  }
};

const getSongByIdFromDb = async (videoId) => {
  try {
    const song = await Song.findById(videoId);
    logger.debug(`[getSongByIdFromDb] Found song with videoId: ${videoId}`);
    return song;
  } catch (err) {
    logger.error(`[getSongByIdFromDb] Error fetching song with videoId: ${videoId}`, err);
    return null;
  }
};

const saveSongToDb = async (song) => {
  try {
    await song.save();
    logger.debug(`[saveSongToDb] Saved song with videoId: ${song.videoId}`);
  } catch (error) {
    logger.error(`[saveSongToDb] Error saving song with videoId: ${song.videoId}`, error);
  }
};

const updateSongInDb = async (videoId, suggestionGenres, suggestionLangs) => {
  try {
    await Song.updateOne(
      { videoId: videoId },
      {
        $addToSet: {
          genre:    { $each: suggestionGenres },
          language: { $each: suggestionLangs }
        }
      }
    );
    logger.debug(`[updateSongInDb] Updated song with videoId: ${videoId}`);
  } catch (error) {
    logger.error(`[updateSongInDb] Error updating song with videoId: ${videoId}`, error);
  }
};

/**
* Run an aggregation pipeline on the Song collection
* @param {Array} pipeline - MongoDB aggregation pipeline stages
* @returns {Promise<Array>} - Aggregated results
*/
const runSongAggregationInDb = async (pipeline) => {
  try {
    const results = await Song.aggregate(pipeline).exec();
    logger.debug(`[runSongAggregationInDb] Aggregated ${results.length} songs`);
    return results;
  } catch (error) {
    logger.error('[runSongAggregationInDb] Aggregation error:', error);
    throw error;
  }
};

const deleteAllSongsInDb = async () => {
  try {
    const songResult = await Song.deleteMany({});
    logger.debug(`[deleteAllSongsInDb] Deleted ${songResult.deletedCount} songs`);
  } catch (error) {
    logger.error('[deleteAllSongsInDb] Error deleting songs:', error);
  }
};

module.exports = {
  getSongsWithExclusionsFromDb,
  getSongByVideoIdFromDb,
  saveSongToDb,
  updateSongInDb,
  runSongAggregationInDb,
  deleteAllSongsInDb,
  getSongByIdFromDb
};
