const { Song } = require('../models/Song');
const logger = require('../utils/loggerUtils');

const getSongsWithExclusionsFromDb = async (
  genreFilter,
  languageFilter,
  excludeIds,
  startYear,
  endYear
) => {
  try {
    // Convert string year filters to numbers (or null if invalid/missing)
    const startYearNum = startYear ? Number(startYear) : null;
    const endYearNum   = endYear   ? Number(endYear)   : null;

    // Base match: genre, language, and exclusions
    const matchStage = {
      $and: [
        { genre:    { $in: genreFilter } },
        { language: { $in: languageFilter } },
        { videoId:  { $nin: excludeIds } }
      ]
    };

    // Build your aggregation pipeline
    const pipeline = [
      { $match: matchStage },

      // 1) Use $regexFind to grab the first 4-digit chunk from "year" (if any).
      {
        $addFields: {
          yearMatch: {
            $regexFind: {
              input: "$year",
              regex: /(\d{4})/
            }
          }
        }
      },

      // 2) Convert yearMatch.match → integer.  If no match was found, we set yearNum to null.
      {
        $addFields: {
          yearNum: {
            $cond: [
              { $gt: ["$yearMatch", null] },   // if yearMatch is not null
              { $toInt: "$yearMatch.match" },  // extract the digits and convert to int
              null                              // otherwise, leave yearNum as null
            ]
          }
        }
      }
      // … (we’ll append the next $match for year range below) …
    ];

    // Build numeric year filter
    const yearFilter = {};
    if (startYearNum !== null && !isNaN(startYearNum)) {
      yearFilter.$gte = startYearNum;
    }
    if (endYearNum !== null && !isNaN(endYearNum)) {
      yearFilter.$lte = endYearNum;
    }

    // If the user specified any year-range, we now filter on "yearNum"
    if (Object.keys(yearFilter).length > 0) {
      pipeline.push({
        $match: {
          // Only documents with a non-null yearNum can pass this filter
          yearNum: yearFilter
        }
      });
    }

    // Finally run the aggregate
    const songs = await Song.aggregate(pipeline).exec();
    logger.debug(
      `[getSongsWithExclusionsFromDb] Found ${songs.length} songs with exclusions and year filter`
    );
    return songs;
  } catch (error) {
    logger.error("[getSongsWithExclusionsFromDb] Error fetching songs:", error);
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
