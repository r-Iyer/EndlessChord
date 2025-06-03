const { Song } = require('../models/Song');
const logger = require('../utils/loggerUtils');

const getSongsWithExclusionsFromDb = async (genreFilter, languageFilter, excludeIds, startYear, endYear) => {
  try {
    // Convert string year filters to numbers, or null if invalid/missing
    const startYearNum = startYear ? Number(startYear) : null;
    const endYearNum = endYear ? Number(endYear) : null;
    
    // Match stage filters by genre, language, and excludes given video IDs
    const matchStage = {
      $and: [
        { genre:    { $in: genreFilter } },    // genre must match one of these
        { language: { $in: languageFilter } }, // language must match one of these
        { videoId:  { $nin: excludeIds } }     // exclude these IDs
      ]
    };
    
    // Build aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      
      // Convert 'year' string to integer as 'yearNum' for numeric filtering
      {
        $addFields: {
          yearNum: { $toInt: "$year" }
        }
      }
    ];
    
    // Build numeric year filter object
    const yearFilter = {};
    if (startYearNum !== null && !isNaN(startYearNum)) {
      yearFilter.$gte = startYearNum;
    }
    if (endYearNum !== null && !isNaN(endYearNum)) {
      yearFilter.$lte = endYearNum;
    }
    
    // If a year filter is defined, apply it to 'yearNum' field
    if (Object.keys(yearFilter).length > 0) {
      pipeline.push({
        $match: {
          yearNum: yearFilter
        }
      });
    }
    
    // Execute aggregation pipeline
    const songs = await Song.aggregate(pipeline).exec();
    
    logger.debug(`[getSongsWithExclusionsFromDb] Found ${songs.length} songs with exclusions and year filter`);
    return songs;
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
