const DEFAULT_SONG_COUNT = 30;
const MAX_RETRIES = 3;
const MINIMUM_SONG_COUNT = 5;
const CACHED_SONG_COUNT_LIMIT = 10;
const CACHED_SONG_COUNT_RETURNED = 4
// Configuration constants
const CONFIDENCE_THRESHOLD = 0.1; // Minimum confidence score to include a song
const FIELD_WEIGHTS = {
    title: 1.0,
    artist: 1.0,
    composer: 1.0,
    album: 1.0,
    genre: 1.0,
    language: 1.0,
    description: 1.0,
    tags: 1.0
};

module.exports = { MINIMUM_SONG_COUNT, CACHED_SONG_COUNT_LIMIT, CACHED_SONG_COUNT_RETURNED, DEFAULT_SONG_COUNT, MAX_RETRIES, CONFIDENCE_THRESHOLD, FIELD_WEIGHTS };