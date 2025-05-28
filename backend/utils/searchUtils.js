const { Song } = require('../models/Song');
const { runSongAggregationInDb } = require('../helpers/songHelpers');
const logger = require('./loggerUtils');

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
    const words = searchTerm.trim().split(/\s+/); // Split input into words

    const pipeline = [
      {
        $search: {
          index: 'default', // Atlas Search index
          compound: {
            should: [
              // For each word, create a compound query that finds the best field match
              ...words.map(word => ({
                compound: {
                  should: ['title', 'artist', 'composer', 'album'].map(field => ({
                    text: {
                      query: word,
                      path: field,
                      fuzzy: {
                        maxEdits: 2,      // Allow 1-2 typos
                        prefixLength: 2   // First 2 characters must match
                      },
                      score: { boost: { value: 2 } } // Optional: boost score for exact matches
                    }
                  })),
                  // This ensures we take the MAX score from any field for this word
                  score: { boost: { value: 1 } }
                }
              }))
            ],
            minimumShouldMatch: words.length // Ensure all words match somewhere
          }
        }
      },
      {
        $match: {
          videoId: { $nin: excludeIds } // Filter out excluded videoIds
        }
      },
      {
        $addFields: {
          score: { $meta: 'searchScore' } // Add relevance score from Atlas Search
        }
      },
      {
        $match: {
          score: { $gte: 0.5 } // Filter out low relevance matches
        }
      },
      {
        $sort: {
          score: -1,       // Sort by relevance
          playCount: 1     // Break ties using play count (ascending)
        }
      }
    ];

    return await runSongAggregationInDb(pipeline);
  } catch (err) {
    logger.error('[SEARCH ERROR]', err);
    return [];
  }
}

module.exports = {
  searchSongsInDb
};