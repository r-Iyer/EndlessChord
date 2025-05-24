const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenAI } = require("@google/genai");
const { Song } = require('../models/Song');
const { MAX_RETRIES, MINIMUM_SONG_COUNT, DEFAULT_SONG_COUNT } = require('../config/constants');


// Add AI suggestions when needed
const addAISuggestionsIfNeeded = async (songs, channel, excludeIds, song_count = DEFAULT_SONG_COUNT) => {
  if (songs.length >= MINIMUM_SONG_COUNT) {
    return {
      songs: shuffle(songs),
      aiSuggestionsAdded: false
    };
  }
  
  try {
    const aiSuggestions = await getUniqueAISuggestions(channel, Song, excludeIds, songs, song_count);
    console.log(aiSuggestions);
    
    const newSongs = await Promise.all(
      aiSuggestions.map(async (suggestion) => {
        const exists = await Song.findOne({ videoId: suggestion.videoId });
        if (!exists) {
          const newSong = new Song({ 
            ...suggestion, 
            genre: [suggestion.genre, channel.genre],
            language: [channel.language] 
          });
          await newSong.save();
          return newSong;
        } else {
          await Song.updateOne(
            { videoId: suggestion.videoId },
            { 
              $addToSet: { 
                genre: suggestion.genre,
                language: channel.language
              }
            }
          );
          return await Song.findOne({ videoId: suggestion.videoId });
        }
      })
    );
    
    const validNewSongs = newSongs.filter(Boolean);
    
    return {
      songs: [...songs, ...validNewSongs],
      aiSuggestionsAdded: validNewSongs.length > 0
    };
  } catch (aiError) {
    console.error('Error getting AI suggestions:', aiError);
    return {
      songs: songs,
      aiSuggestionsAdded: false
    };
  }
};

/**
* Get AI suggestions with duplicate check and retry logic.
*/
async function getUniqueAISuggestions(channel, Song, excludeIds, baseSongs, song_count) {
  let allSuggestions = [];
  let attempts = 0;
  
  while (allSuggestions.length < song_count && attempts < MAX_RETRIES) {
    const newSuggestions = await getAISuggestions(channel, Song, song_count * 2); // Request more
    const filtered = filterAISuggestions(newSuggestions, excludeIds, baseSongs);
    allSuggestions = [...new Set([...allSuggestions, ...filtered])]; // Merge and dedupe
    attempts++;
  }
  
  return allSuggestions.slice(0, song_count);
}

// AI Recommendation Part
async function getAIRecommendations(channel, Song, song_count) {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
  const MAX_RETRIES = 5;
  const BACKOFF_FACTOR = 1000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[AI] Fetching suggestions for channel: ${channel.name}, attempt ${attempt}`);
      
      const existingSongs = await Song.find({ language: channel.language });
      
      const recommendationPrompt = `I need recommendations for ${song_count} ${channel.language} music having description ${channel.description}
You can suggest songs from any year.
For each recommendation, provide only the song title, artist name, composer name (if known), album name (if known), release year, and genre in JSON format:
[{
  "title": "Song Title",
  "artist": "Artist Name", 
  "composer": "Composer Name",
  "album": "Album Name",
  "year": "Year",
  "genre": "Genre"
}, ...]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: recommendationPrompt
      });

      const responseText = await response.text;
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in response');
        return [];
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error(`[AI] Error on attempt ${attempt}:`, error);
      if (attempt < MAX_RETRIES) {
        console.warn(`[AI] Retrying in ${BACKOFF_FACTOR * attempt}ms...`);
        await new Promise(resolve => setTimeout(resolve, BACKOFF_FACTOR * attempt));
      } else {
        console.error('[AI] Max retries reached.');
        return [];
      }
    }
  }
  return [];
}

// YouTube Video Processing Part
async function getYouTubeVideoDetails(songs, channel) {
  try {
    const songsWithVideoInfo = await Promise.all(
      songs.map(async (song) => {
        try {
          const searchQuery = `${song.title} ${song.artist} official music video`;
          const searchResults = await searchYouTube(searchQuery);
          if (searchResults) {
            const bestMatch = searchResults;
            return {
              videoURL: `https://www.youtube.com/watch?v=${bestMatch.id.videoId}`,
              videoId: bestMatch.id.videoId,
              title: song.title,
              artist: song.artist,
              composer: song.composer,
              album: song.album || "Unknown",
              year: song.year,
              genre: song.genre,
              language: channel.language
            };
          }
          return null;
        } catch (error) {
          console.error(`Error searching YouTube for ${song.title}:`, error);
          return null;
        }
      })
    );
    return songsWithVideoInfo.filter(song => song !== null);
  } catch (error) {
    console.error('Error processing YouTube videos:', error);
    return [];
  }
}

async function getAISuggestions(channel, Song, song_count) {
  const recommendedSongs = await getAIRecommendations(channel, Song, song_count);
  if (recommendedSongs.length === 0) return [];
  
  return await getYouTubeVideoDetails(recommendedSongs, channel);
}

async function searchYouTube(query) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    const html = response.data;
    const initialDataRegex = /var ytInitialData = ({.*?});/;
    const match = html.match(initialDataRegex);
    if (match && match[1]) {
      try {
        const initialData = JSON.parse(match[1]);
        const contents = initialData?.contents?.twoColumnSearchResultsRenderer
        ?.primaryContents?.sectionListRenderer?.contents?.[0]
        ?.itemSectionRenderer?.contents;
        if (contents && Array.isArray(contents)) {
          for (const item of contents) {
            if (item.videoRenderer) {
              const { videoId, title } = item.videoRenderer;
              if (videoId) {
                return {
                  id: { videoId },
                  snippet: {
                    title: title?.runs?.[0]?.text || '',
                    thumbnails: {
                      default: { url: `https://i.ytimg.com/vi/${videoId}/default.jpg` }
                    }
                  }
                };
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse YouTube initial data:', e);
      }
    }
    return extractTopResultFromHTML(html);
  } catch (error) {
    console.error('YouTube alternative search error:', error);
    return null;
  }
}

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

async function extractTopResultFromHTML(html) {
  try {
    const $ = cheerio.load(html);
    const videoLinks = $('a#video-title, a.yt-simple-endpoint.style-scope.ytd-video-renderer');
    if (videoLinks.length > 0) {
      const firstVideoLink = $(videoLinks[0]);
      const href = firstVideoLink.attr('href') || '';
      if (href.includes('/watch?v=')) {
        const videoId = href.split('v=')[1]?.split('&')[0];
        if (videoId) {
          return {
            id: { videoId },
            snippet: {
              title: firstVideoLink.text().trim() || firstVideoLink.attr('title') || '',
              thumbnails: {
                default: { url: `https://i.ytimg.com/vi/${videoId}/default.jpg` }
              }
            }
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error('HTML extraction error:', error);
    return null;
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

module.exports = { addAISuggestionsIfNeeded, getUniqueAISuggestions, searchYouTube, extractTopResultFromHTML };
