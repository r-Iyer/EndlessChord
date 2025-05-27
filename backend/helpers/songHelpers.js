const { Song } = require('../models/Song');

const getSongsWithExclusionsFromDb = async (genreFilter, languageFilter, excludeIds) => {
  const song = await Song.find({
    $and: [
      { genre:    { $in: genreFilter } },    // genre must match one of these
      { language: { $in: languageFilter } }, // language must match one of these
      { videoId:  { $nin: excludeIds } }     // exclude these IDs
    ]
  })
  .sort({ playCount: 1 });  
  //console.log(`[getSongsWithExclusionsFromDb] Found ${song.length} songs with exclusions`);
  return song;                // least-played first
}

const findSongByVideoIdFromDb = async (videoId) => {
    const song = await Song.findOne({ videoId: videoId });
    //console.log(`[findSongByVideoIdFromDb] Found song with videoId: ${videoId}`);
    return song;
}

const saveSongToDb = async (song) => {
    song.save();
    //console.log(`[saveSongToDb] Saved song with videoId: ${song.videoId}`);
}

const updateSongInDb = async (videoId, suggestionGenres, suggestionLangs) => {
    await Song.updateOne(
      { videoId: videoId },
      {
        $addToSet: {
          genre:    { $each: suggestionGenres },
          language: { $each: suggestionLangs }
        }
      }
    );
    //console.log(`[updateSongInDb] Updated song with videoId: ${videoId}`);
}

/**
 * Run an aggregation pipeline on the Song collection
 * @param {Array} pipeline - MongoDB aggregation pipeline stages
 * @returns {Promise<Array>} - Aggregated results
 */
const runSongAggregationInDb = async (pipeline) => {
  try {
    const results = await Song.aggregate(pipeline).exec();
    console.log(`[runSongAggregationInDb] Aggregated ${results.length} songs`);
    return results;
  } catch (error) {
    console.error('Aggregation error:', error);
    throw error;
  }
}

const deleteAllSongsInDb = async () => {
  await Song.deleteMany({});
  console.log(`Deleted ${songResult.deletedCount} songs`);
}


module.exports = {
  getSongsWithExclusionsFromDb,
  findSongByVideoIdFromDb,
  saveSongToDb,
  updateSongInDb,
  runSongAggregationInDb,
  deleteAllSongsInDb
};