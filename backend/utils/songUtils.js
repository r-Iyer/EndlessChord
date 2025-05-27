const { Song } = require('../models/Song');
const stringSimilarity = require('string-similarity');
const { getSongsWithExclusionsFromDb, findSongByVideoIdFromDb, saveSongToDb, updateSongInDb} = require('../helpers/songHelpers');

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
  
  let songs = await getSongsWithExclusionsFromDb(genreFilter, languageFilter, excludeIds);
  
  songs = songs.map(song =>
    song.toObject ? song.toObject() : { ...song }
  );
  return songs;
};


const sortSongsByLastPlayed = songs =>
  songs.slice().sort((a, b) =>
    (a.lastPlayed ? 1 : 0) - (b.lastPlayed ? 1 : 0) ||
(a.lastPlayed - b.lastPlayed)
);

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
  
  let song = await findSongByVideoIdFromDb(suggestion.videoId);
  if (!song) {
    song = new Song({
      ...suggestion,
      genre:    [...new Set([...baseGenres, ...suggestionGenres])],
      language: [...new Set([...baseLangs, ...suggestionLangs])]
    });
    await saveSongToDb(song);
  } else {
    await updateSongInDb(suggestion.videoId, suggestionGenres, suggestionLangs);
    song = await findSongByVideoIdFromDb(suggestion.videoId);
  }
  
  return song;
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

//Shuffle the songs
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};


/**
* Sort enhancedSongs by computed relevance score and playCount.
*/
function sortSongs(enhancedSongs, searchTerm) {
  enhancedSongs.forEach(song => {
    song.score = computeRelevanceScore(song, searchTerm);
  });
  
  return enhancedSongs
  .sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;  // relevance desc
    return a.playCount - b.playCount;                   // playCount asc
  });
}


/**
* Compute relevance score of a song given the search term
* by taking max similarity across multiple fields.
*/
function computeRelevanceScore(song, searchTerm) {
  const fieldsToCheck = ['title', 'artist', 'composer', 'album'];
  const scores = fieldsToCheck.map(field => {
    if (!song[field]) return 0;
    return stringSimilarity.compareTwoStrings(
      song[field].toLowerCase(),
      searchTerm.toLowerCase()
    );
  });
  return Math.max(...scores);
}

module.exports = { parseExcludeIds, getSongsWithExclusions, sortSongsByLastPlayed, upsertSuggestionSong, shuffle,
  computeRelevanceScore, sortSongs };
  