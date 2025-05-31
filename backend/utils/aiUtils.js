const {
  MAX_RETRIES,
  MINIMUM_SONG_COUNT,
  DEFAULT_SONG_COUNT,
  SONG_PATH,
  INITIAL_LOAD,
  INITIAL_SONG_COUNT,
  RECOMMENDATION_PROMPT_TEMPLATE
} = require('../config/constants');
const { upsertSuggestionSong, selectSongsFromHistory } = require('./songUtils');
const { normalizeBaseFields } = require('./channelUtils.js');
const { getYouTubeVideoDetails } = require('./youtubeUtils');
const { getAIRecommendationsGemini } = require('../helpers/aiHelpers');
const logger = require('./loggerUtils');


const addAISuggestionsIfNeeded = async (
  songs,
  channel,
  excludeIds,
  source = null,
  userId = null,
  entity = null,
) => {

  /* Rule III.2.d */
  let minimum_song_count = MINIMUM_SONG_COUNT;
  /* Rule II.2.f, Rule III.2.e */
  let maximum_song_count = (source === INITIAL_LOAD) ? INITIAL_SONG_COUNT : DEFAULT_SONG_COUNT;

  // If the request is not for songs (/songs) for a particular channel (e.g. /search) OR it's an initial load,
  // and we already have enough songs, skip AI suggestions and return early.
  if ((entity !== SONG_PATH || source === INITIAL_LOAD) && songs.length >= MINIMUM_SONG_COUNT) {
    // Rule II.1.d, Rule III.1.d
    songs = songs.slice(0, INITIAL_SONG_COUNT)
    return { songs, aiSuggestionsAdded: false };
  }

  let aiSuggestions = [];
  let aiSuggestionsNeeded = maximum_song_count - songs.length;

  try {
    if (entity === SONG_PATH && userId) {
      const { songs: selectedSongs, remainingToFill } = await selectSongsFromHistory( songs, userId, excludeIds );
      // Rule II.2.b, Rule II.2.c
      songs = selectedSongs;
      aiSuggestionsNeeded = remainingToFill;
      /* Rule II.2.e */ 
      minimum_song_count = aiSuggestionsNeeded;
      maximum_song_count = aiSuggestionsNeeded;
    }

    // Rule II.1.c, Rule III.1.c, Rule II.2.d, Rule III.2.c
    if (aiSuggestionsNeeded > 0) {
      aiSuggestions = await getUniqueAISuggestions(
        channel,
        excludeIds,
        songs,
        minimum_song_count,  // Minimum number of songs required
        maximum_song_count   // Maximum number of songs required
      );
      logger.debug('[addAISuggestionsIfNeeded] AI suggestions:', aiSuggestions);

      const { baseGenres, baseLangs } = normalizeBaseFields(channel);

      // Save new Songs to DB
      const newSongs = await Promise.all(
        aiSuggestions.map((sugg) =>
          upsertSuggestionSong(sugg, baseGenres, baseLangs)
      )
    ).then(results => results.filter(Boolean));

    // Merge the songs from DB and existing list
    let updatedSongs = [...songs, ...newSongs].map(
      (song) => song.toObject?.() || { ...song }
    );

    return {
      songs: updatedSongs,
      aiSuggestionsAdded: newSongs.length > 0,
    };
  }
  return {
    songs,
    aiSuggestionsAdded: false,
  };
} catch (err) {
  logger.error('Error in addAISuggestionsIfNeeded:', err);
  return { songs, aiSuggestionsAdded: false };
}
};


/**
* Get AI suggestions with duplicate check and retry logic.
*/
async function getUniqueAISuggestions(channel, excludeIds, baseSongs, minimum_song_count = MINIMUM_SONG_COUNT, maximum_song_count = DEFAULT_SONG_COUNT) {
  let allSuggestions = [];
  let attempts = 0;

  try {
    while (allSuggestions.length < minimum_song_count && attempts < MAX_RETRIES) {
      logger.info(`[getUniqueAISuggestions] Fething Unique AI suggestions, attempt: ${attempts+1}. Current Song count: ${allSuggestions.length}`);
      const newSuggestions = await getAISuggestions(channel, maximum_song_count * 2); // Request double the required maximum_song_count
      const filtered = filterAISuggestions(newSuggestions, excludeIds, baseSongs);
      allSuggestions = [...new Set([...allSuggestions, ...filtered])]; // Merge and dedupe
      attempts++;
    }
    return allSuggestions.slice(0, maximum_song_count);
  } catch (err) {
    logger.error('[getUniqueAISuggestions ERROR]', err);
    return [];
  }
}

/**
* Filters out songs with videoIds in excludeIds or already in baseSongs.
*/
function filterAISuggestions(aiSuggestions, excludeIds, baseSongs) {
  const baseIds = new Set(baseSongs.map(s => s.videoId));
  return aiSuggestions.filter(s =>
    !excludeIds.includes(s.videoId) && !baseIds.has(s.videoId)
  );
}


//Get AI suggestions and fetch YouTube video details
async function getAISuggestions(channel, song_count) {
  try {
    const recommendedSongs = await getAIRecommendations(channel, song_count);
    if (recommendedSongs.length === 0) return [];

    const youtubeIds = await getYouTubeVideoDetails(recommendedSongs, channel);
    logger.info( `[getAISuggestions] Fetched youtubeIds for ${recommendedSongs.length} songs`);
    return youtubeIds;
  } catch (err) {
    logger.error('[getAISuggestions ERROR]', err);
    return [];
  }
}

// AI Recommendation Part
async function getAIRecommendations(channel, song_count) {  
  try {
    const recommendationPrompt = RECOMMENDATION_PROMPT_TEMPLATE
      .replace('{{SONG_COUNT}}', song_count)
      .replace('{{LANGUAGE}}', channel.language.toUpperCase())
      .replace('{{DESCRIPTION}}', channel.description)
      .replace('{{GENRES}}', channel.genre.join(', '));

    const recommendedSongs = await getAIRecommendationsGemini(recommendationPrompt, channel.name);
    return recommendedSongs;
  } catch (err) {
    logger.error('[getAIRecommendations ERROR]', err);
    return [];
  }
}

module.exports = { addAISuggestionsIfNeeded };
