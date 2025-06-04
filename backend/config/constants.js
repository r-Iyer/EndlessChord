// Song-related limits and thresholds
const DEFAULT_SONG_COUNT = 20;
const INITIAL_SONG_COUNT = 10;
const MINIMUM_SONG_COUNT = 5;
const MAX_RETRIES = 3;
const NEW_SONG_RATIO = 0.4;
const CACHED_SONG_COUNT_LIMIT = 10;
const CACHED_SONG_COUNT_RETURNED = 4;
const SHUFFLE_SCORE_THRESHOLD = 0.95

// JWT and auth
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '100d';

// Time thresholds
const HOURS_FOR_RECENTLY_PLAYED = 36;
const RECENTLY_PLAYED_THRESHOLD = new Date(Date.now() - HOURS_FOR_RECENTLY_PLAYED * 60 * 60 * 1000);

// Path constants
const SONG_PATH = "songs";
const INITIAL_LOAD = "initial";

//AI Prompt

const RECOMMENDATION_PROMPT_TEMPLATE = `
You are a helpful music expert. I need recommendations for {{SONG_COUNT}} {{LANGUAGE}} music tracks 
(description: {{DESCRIPTION}}). 

Please span across the following genres: {{GENRES}}.

You can suggest songs from any year or region.  

For each recommendation, provide **only** the following fields in a JSON array:

[
  {
    "title": "Song Title",
    "artist": "Artist Name",
    "composer": "Composer Name",
    "album": "Album Name",
    "year": "Year",
    "genre": "One of the above genres",
    "language": "Language of the song"
  }
]
`;

module.exports = {
  DEFAULT_SONG_COUNT,
  INITIAL_SONG_COUNT,
  MINIMUM_SONG_COUNT,
  MAX_RETRIES,
  NEW_SONG_RATIO,
  CACHED_SONG_COUNT_LIMIT,
  CACHED_SONG_COUNT_RETURNED,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  RECENTLY_PLAYED_THRESHOLD,
  SONG_PATH,
  INITIAL_LOAD,
  SHUFFLE_SCORE_THRESHOLD,
  RECOMMENDATION_PROMPT_TEMPLATE
};
