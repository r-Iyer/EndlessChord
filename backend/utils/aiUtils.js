const { MAX_RETRIES, MINIMUM_SONG_COUNT, DEFAULT_SONG_COUNT } = require('../config/constants');
const { upsertSuggestionSong, normalizeBaseFields, shuffle } = require('./songUtils');
const { getYouTubeVideoDetails } = require('./youtubeUtils');
const { getAIRecommendationsGemini } = require('../helpers/aiHelpers');

const addAISuggestionsIfNeeded = async (
  songs,
  channel,
  excludeIds,
  song_count = DEFAULT_SONG_COUNT
) => {
  if (songs.length >= MINIMUM_SONG_COUNT) {
    return { songs: shuffle(songs), aiSuggestionsAdded: false };
  }
  
  try {
    const aiSuggestions = await getUniqueAISuggestions(
      channel,
      excludeIds,
      songs,
      song_count
    );
    console.log('AI suggestions:', aiSuggestions);
    
    const { baseGenres, baseLangs } = normalizeBaseFields(channel);
    
    const newSongs = await Promise.all(
      aiSuggestions.map((sugg) =>
        upsertSuggestionSong(sugg, baseGenres, baseLangs)
    )
  );
  
  const validNewSongs = newSongs.filter(Boolean);
  
  let updatedSongs =  [...songs, ...validNewSongs]

  updatedSongs = updatedSongs.map(song =>
        song.toObject ? song.toObject() : { ...song }
      );

  return {
    songs: updatedSongs,
    aiSuggestionsAdded: validNewSongs.length > 0
  };
} catch (aiError) {
  console.error('Error getting AI suggestions:', aiError);
  return { songs, aiSuggestionsAdded: false };
}
};


/**
* Get AI suggestions with duplicate check and retry logic.
*/
async function getUniqueAISuggestions(channel, excludeIds, baseSongs, song_count) {
  let allSuggestions = [];
  let attempts = 0;
  
  while (allSuggestions.length < MINIMUM_SONG_COUNT && attempts < MAX_RETRIES) {
    const newSuggestions = await getAISuggestions(channel, song_count * 2); // Request more
    const filtered = filterAISuggestions(newSuggestions, excludeIds, baseSongs);
    allSuggestions = [...new Set([...allSuggestions, ...filtered])]; // Merge and dedupe
    attempts++;
  }
  
  return allSuggestions.slice(0, song_count);
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
  const recommendedSongs = await getAIRecommendations(channel, song_count);
  if (recommendedSongs.length === 0) return [];
  
  const youtubeIds = await getYouTubeVideoDetails(recommendedSongs, channel);
  return youtubeIds;
}

// AI Recommendation Part
async function getAIRecommendations(channel, song_count) {  
    const recommendationPrompt = `
You are a helpful music expert. I need recommendations for ${song_count} ${channel.language.toUpperCase()} music tracks 
(description: ${channel.description}). 
      
Please span across the following genres: ${channel.genre.join(', ')}.
      
You can suggest songs from any year or region.  
      
For each recommendation, provide **only** the following fields in a JSON array:
      
[
  {
    "title": "Song Title",
    "artist": "Artist Name",
    "composer": "Composer Name",
    "album": "Album Name",
    "year": "Year",
    "genre": "One of the above genres"
  },
  …
]
`;

    const recommendedSongs = await getAIRecommendationsGemini(recommendationPrompt, channel.name);
    return recommendedSongs;
}

module.exports = { addAISuggestionsIfNeeded };