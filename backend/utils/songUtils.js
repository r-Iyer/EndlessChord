const { Song } = require('../models/Song');
const { getSongsWithExclusionsFromDb, getSongByVideoIdFromDb, saveSongToDb, updateSongInDb } = require('../helpers/songHelpers');
const logger = require('./loggerUtils');
const { INITIAL_LOAD, INITIAL_SONG_COUNT, SONG_PATH, DEFAULT_SONG_COUNT, NEW_SONG_RATIO } = require('../config/constants');
const { getUserHistoryInDb } = require('../helpers/userHelpers');

// Parse exclude IDs safely
const parseExcludeIds = (excludeIdsParam) => {
  try {
    return excludeIdsParam ? JSON.parse(excludeIdsParam) : [];
  } catch (error) {
    logger.error('Error parsing excludeIds:', error);
    return [];
  }
};

// Get songs with exclusions and shuffled
const getSongsWithExclusions = async (genres, languages, excludeIds, source, entity) => {
  const genreFilter = Array.isArray(genres) ? genres : [genres];
  const languageFilter = Array.isArray(languages) ? languages : [languages];

  // Rule I
  // Rule II.1.a, Rule II.2.a, Rule III.1.a, Rule III.2.a
  let songs = await getSongsWithExclusionsFromDb(genreFilter, languageFilter, excludeIds);

  songs = songs.map(song => (song.toObject ? song.toObject() : { ...song }));
  songs = shuffle(songs);

  // Rule II.1.b
  if (entity === SONG_PATH && source === INITIAL_LOAD) {
    songs = songs.slice(0, INITIAL_SONG_COUNT);
  }
  return songs;
};

const selectSongsFromHistory = async (songs, userId, excludeIds) => {
  // 1. Get user history
  const rawHistory = await getUserHistoryInDb(userId);

  // 2. Extract and filter song IDs from history
  const excludeSet = new Set(excludeIds.map(id => id.toString()));
  const historySongIds = new Set(
    rawHistory
      .map(h => h.songId.toString())
      .filter(id => !excludeSet.has(id))
  );

  // 3. Split songs into new and old
  const newSongs = [];
  const oldSongs = [];

  for (const song of songs) {
    const id = song._id.toString();
    if (historySongIds.has(id)) {
      oldSongs.push(song);
    } else {
      newSongs.push(song);
    }
  }

  // 4. Calculate targets
  const newTarget = Math.floor(DEFAULT_SONG_COUNT * NEW_SONG_RATIO);
  const oldTarget = DEFAULT_SONG_COUNT - newTarget;

  let selectedNewSongs = newSongs;
  let selectedOldSongs = [];

  if (newSongs.length >= newTarget) {
    selectedNewSongs = shuffle(newSongs).slice(0, newTarget);
    selectedOldSongs = shuffle(oldSongs).slice(0, oldTarget);
  } else {
    const remaining = DEFAULT_SONG_COUNT - selectedNewSongs.length;
    const maxOldAllowed = Math.floor(DEFAULT_SONG_COUNT * (1 - NEW_SONG_RATIO));
    const oldFillCount = Math.min(remaining, maxOldAllowed);
    selectedOldSongs = shuffle(oldSongs).slice(0, oldFillCount);
  }

  const combined = [...selectedNewSongs, ...selectedOldSongs];

  return {
    songs: combined,
    remainingToFill: DEFAULT_SONG_COUNT - combined.length,
    selectedNewSongs,
    selectedOldSongs,
  };
};

// Shuffle the songs
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Upsert (Update / Insert) a single suggestion into the Song collection,
 * merging in genres & languages.
 */
const upsertSuggestionSong = async (suggestion, baseGenres, baseLangs) => {
  // Appending new Genre and Language
  const suggestionGenres = extractSuggestionGenres(suggestion.genre);
  const suggestionLangs = extractSuggestionLangs(suggestion.language);

  let song = await getSongByVideoIdFromDb(suggestion.videoId);
  if (!song) {
    song = new Song({
      ...suggestion,
      genre: [...new Set([...baseGenres, ...suggestionGenres])],
      language: [...new Set([...baseLangs, ...suggestionLangs])],
    });
    await saveSongToDb(song);
  } else {
    await updateSongInDb(suggestion.videoId, suggestionGenres, suggestionLangs);
    song = await getSongByVideoIdFromDb(suggestion.videoId);
  }

  return song;
};

/**
 * From AI’s raw genre(s), return [composite, ...splits].
 */
const extractSuggestionGenres = (rawGenreField) => {
  if (!rawGenreField) return [];
  const rawGenres = Array.isArray(rawGenreField) ? rawGenreField : [rawGenreField];

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

module.exports = {
  parseExcludeIds,
  getSongsWithExclusions,
  upsertSuggestionSong,
  selectSongsFromHistory,
  shuffle
};
