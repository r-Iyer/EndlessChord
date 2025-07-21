const { Song } = require('../models/Song');
const logger = require('../utils/loggerUtils');

const buildYearFilter = (startYear, endYear) => {
  const startYearNum = startYear ? Number(startYear) : null;
  const endYearNum = endYear ? Number(endYear) : null;
  
  const yearFilter = {};
  if (startYearNum !== null && !isNaN(startYearNum)) {
    yearFilter.$gte = startYearNum;
  }
  if (endYearNum !== null && !isNaN(endYearNum)) {
    yearFilter.$lte = endYearNum;
  }
  
  return yearFilter;
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildBaseMatch = (genreFilter, languageFilter, excludeIds) => {
  const baseConditions = [];

  // Language condition (case-insensitive)
  if (languageFilter.length > 0) {
    const langConditions = languageFilter.map(lang => ({
      language: { 
        $regex: `^${escapeRegex(lang)}$`,
        $options: 'i'
      }
    }));
    baseConditions.push({ $or: langConditions });
  } else {
    // Preserve original behavior: empty filter = no matches
    baseConditions.push({ language: { $in: [] } });
  }

  // Always include videoId exclusion
  baseConditions.push({ videoId: { $nin: excludeIds } });

  // Genre condition (case-insensitive, only if filter has values)
  if (genreFilter.length > 0) {
    const genreConditions = genreFilter.map(genre => ({
      genre: { 
        $regex: `^${escapeRegex(genre)}$`,
        $options: 'i'
      }
    }));
    baseConditions.push({ $or: genreConditions });
  }

  return { $and: baseConditions };
};

const buildAggregationPipeline = (baseMatch, yearFilter) => {
  // Year extraction stages moved inside pipeline builder
  const yearExtractionStages = [
    {
      $addFields: {
        yearMatch: {
          $regexFind: { input: "$year", regex: /(\d{4})/ }
        }
      }
    },
    {
      $addFields: {
        yearNum: {
          $cond: [
            { $gt: ["$yearMatch", null] },
            { $toInt: "$yearMatch.match" },
            null
          ]
        }
      }
    }
  ];
  
  const pipeline = [
    { $match: baseMatch },
    ...yearExtractionStages
  ];
  
  if (Object.keys(yearFilter).length > 0) {
    pipeline.push({ $match: { yearNum: yearFilter } });
  }
  
  return pipeline;
};

const getSongsWithExclusionsFromDb = async (
  genreFilter,
  languageFilter,
  excludeIds,
  startYear,
  endYear
) => {
  try {
    const yearFilter = buildYearFilter(startYear, endYear);
    const baseMatch = buildBaseMatch(genreFilter, languageFilter, excludeIds);
    const pipeline = buildAggregationPipeline(baseMatch, yearFilter);
    
    const songs = await Song.aggregate(pipeline).exec();
    logger.debug(`[getSongsWithExclusionsFromDb] Found ${songs.length} songs with exclusions and year filter`);
    return songs;
  } catch (error) {
    logger.error("[getSongsWithExclusionsFromDb] Error fetching songs:", error);
    return [];
  }
};


const getSongByVideoIdFromDb = async (videoId) => {
  try {
    const song = await Song.findOne({ videoId: videoId });
    logger.debug(`[getSongByVideoIdFromDb] Found ${song.length} songs with exclusions and year filter`);
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

const getSongsFromIdListFromDb = async (songIds) => {
  try {
    const songs = await Song.find({ _id: { $in: songIds } });
    logger.debug(`[getSongsFromIdListFromDb] Found ${songs.length} songs`);
    return songs;
  } catch (err) {
    logger.error(`[getSongsFromIdListFromDb] Error fetching song with videoId: ${videoId}`, err);
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
  getSongByIdFromDb,
  getSongsFromIdListFromDb
};
