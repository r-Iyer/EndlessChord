const stringSimilarity = require('string-similarity');
const { runSongAggregationInDb } = require('../helpers/songHelpers');
const logger = require('./loggerUtils');
const { SHUFFLE_SCORE_THRESHOLD } = require('../config/constants');
const { shuffle } = require('./songUtils');

/**
* Search songs with strict word-by-word fuzzy matching across multiple fields,
* using the maximum score from any field for each word match.
*
* @param {string} searchTerm - User input for searching
* @param {Array<string>} excludeIds - List of videoIds to exclude
* @returns {Promise<Array>} - Sorted, filtered list of matching songs
*/
async function searchSongsInDb(searchTerm, excludeIds = []) {
  try {
    if (!searchTerm || typeof searchTerm !== 'string') {
      logger.warn('[searchSongsInDb] Invalid searchTerm provided');
      return [];
    }
    
    const words = searchTerm.trim().split(/\s+/); // Split input into words
    
    if (words.length === 0) {
      return [];
    }
    
const searchFields = ['title', 'artist', 'composer', 'album'];
const termWords = searchTerm.toLowerCase().split(/\s+/);

const pipeline = [
  {
    $search: {
      index: 'default',
      compound: {
        should: searchFields.map(field => ({
          compound: {
            must: termWords.map(word => ({
              text: {
                query: word,
                path: field,
                fuzzy: {
                  maxEdits: 1,
                  prefixLength: 2,
                },
                score: { boost: { value: 10 } },
              },
            })),
          }
        })),
        minimumShouldMatch: 1
      }
    }
  },
  {
    $match: {
      videoId: { $nin: excludeIds }
    }
  },
  {
    $addFields: {
      score: { $meta: 'searchScore' }
    }
  },
  {
    $match: {
      score: { $gte: 0.5 }
    }
  },
  {
    $sort: {
      score: -1,
      playCount: 1
    }
  }
];

    
    
    
    // Run aggregation and return results
    return await runSongAggregationInDb(pipeline);
  } catch (err) {
    logger.error('[SEARCH ERROR]', err);
    return [];
  }
}

/**
* Sort songs by how closely they match a given search query (based on title, artist, composer, album).
* Songs with very low relevance retain their original order.
*
* @param {Array<Object>} songs - Array of song objects
* @param {string} searchQuery - The search string
* @param {number} threshold - Relevance score threshold below which original order is preserved
* @returns {Array<Object>} - Sorted array of songs
*/
const sortSongsBySearchRelevance = (songs, searchQuery, threshold = 0.2) => {
  if (!searchQuery || typeof searchQuery !== 'string') return songs;
  
  const query = searchQuery.toLowerCase();
  
  const scored = songs.map((song, index) => {
    const fields = [song.title, song.artist, song.composer, song.album]
    .filter(Boolean)
    .map(field => field.toLowerCase());
    
    const maxSimilarity = Math.max(
      ...fields.map(field => stringSimilarity.compareTwoStrings(field, query)),
      0
    );
    
    return {
      song: {
        ...song,
        _searchQuery: searchQuery,
        _relevanceScore: maxSimilarity
      },
      index,
      relevance: maxSimilarity
    };
  });
  
  const highRelevance = scored.filter(item => item.relevance >= threshold);
  const lowRelevance = scored.filter(item => item.relevance < threshold);
  
  highRelevance.sort((a, b) => {
    if (b.relevance === a.relevance) {
      // Randomize when scores are equal
      return Math.random() - 0.5;
    }
    return b.relevance - a.relevance;
  });
  
  // Preserve original order for low relevance
  lowRelevance.sort((a, b) => a.index - b.index);
  
  const finalOrder = [...highRelevance, ...lowRelevance].map(item => item.song);
  
  return finalOrder;
};

/**
* Searches songs and shuffles results if all scores are above a threshold.
*
* @param {string} searchQuery - The search string.
* @param {string[]} excludeIds - List of video IDs to exclude.
* @param {number} threshold - Minimum score to trigger shuffle.
* @returns {Promise<Array>} - The processed song list.
*/
const searchSongsWithPostProcessing = async (searchQuery, excludeIds = [], threshold = SHUFFLE_SCORE_THRESHOLD) => {
  let songs = await searchSongsInDb(searchQuery, excludeIds);
  
  if (!Array.isArray(songs) || songs.length === 0) return [];
  
  const allAboveThreshold = songs.every(song => song?.score >= threshold);
  
  if (allAboveThreshold) {
    songs = shuffle(songs); // Use your existing shuffle function
  }
  
  return songs;
}

module.exports = {
  searchSongsInDb,
  sortSongsBySearchRelevance,
  searchSongsWithPostProcessing
};
