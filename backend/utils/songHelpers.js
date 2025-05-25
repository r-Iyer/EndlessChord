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

// Get songs with exclusions (now genre & language can be arrays)
const getSongsWithExclusions = async (genres, languages, excludeIds) => {
  const genreFilter    = Array.isArray(genres)    ? genres    : [genres];
  const languageFilter = Array.isArray(languages) ? languages : [languages];

  return await Song.find({
    $and: [
      { genre:    { $in: genreFilter } },    // genre must match one of these
      { language: { $in: languageFilter } }, // language must match one of these
      { videoId:  { $nin: excludeIds } }     // exclude these IDs
    ]
  })
  .sort({ playCount: 1 });                  // least-played first
};


const sortSongsByLastPlayed = songs =>
  songs.slice().sort((a, b) =>
    (a.lastPlayed ? 1 : 0) - (b.lastPlayed ? 1 : 0) ||
    (a.lastPlayed - b.lastPlayed)
  );

// Helpers

/**
 * Ensure the channel’s genres/langs are arrays.
 */
const normalizeBaseFields = (channel) => {
  const baseGenres = Array.isArray(channel.genre)
    ? channel.genre
    : [channel.genre];
  const baseLangs = Array.isArray(channel.language)
    ? channel.language
    : [channel.language];
  return { baseGenres, baseLangs };
};

/**
 * From AI’s raw genre(s), return [composite, ...splits].
 */
const extractSuggestionGenres = (rawGenreField) => {
  if (!rawGenreField) return [];
  const rawGenres = Array.isArray(rawGenreField)
    ? rawGenreField
    : [rawGenreField];

  const splitGenres = rawGenres
    .flatMap((g) =>
      g
        .split(/[\s,&\/-]+/)
        .map((s) => s.trim())
    )
    .filter(Boolean);

  // composite + splits
  return [...rawGenres, ...splitGenres];
};

/**
 * Normalize AI’s language field into an array.
 */
const extractSuggestionLangs = (rawLangField) => {
  if (!rawLangField) return [];
  return Array.isArray(rawLangField) ? rawLangField : [rawLangField];
};

/**
 * Upsert a single suggestion into the Song collection,
 * merging in genres & languages.
 */
const upsertSuggestionSong = async (
  suggestion,
  baseGenres,
  baseLangs
) => {
  const suggestionGenres = extractSuggestionGenres(suggestion.genre);
  const suggestionLangs  = extractSuggestionLangs(suggestion.language);

  let song = await Song.findOne({ videoId: suggestion.videoId });
  if (!song) {
    song = new Song({
      ...suggestion,
      genre:    [...new Set([...baseGenres, ...suggestionGenres])],
      language: [...new Set([...baseLangs, ...suggestionLangs])]
    });
    await song.save();
  } else {
    await Song.updateOne(
      { videoId: suggestion.videoId },
      {
        $addToSet: {
          genre:    { $each: suggestionGenres },
          language: { $each: suggestionLangs }
        }
      }
    );
    song = await Song.findOne({ videoId: suggestion.videoId });
  }

  return song;
};

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

module.exports = { parseExcludeIds, getSongsWithExclusions, sortSongsByLastPlayed, 
  normalizeBaseFields, extractSuggestionGenres, extractSuggestionLangs, upsertSuggestionSong, shuffle };
