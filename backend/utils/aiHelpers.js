const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenAI } = require("@google/genai");

async function getAISuggestions(channel, Song) {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
  const MAX_RETRIES = 5;
  const BACKOFF_FACTOR = 1000;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[AI] Fetching suggestions for channel: ${channel.name}, attempt ${attempt}`);
      const existingSongs = await Song.find({ language: channel.language });
      // Only use song titles for examples
      const songExamples = existingSongs.map(song =>
        `"${song.title}"`
      ).join('\n');
      const recommendationPrompt = `I need recommendations for 10 ${channel.language} music having description ${channel.description}, for the channel "${channel.name}", similar to these examples:

${songExamples}

Do not recommend the songs I mentioned above. Those are just examples. You can suggest songs from any year.
For each recommendation, provide only the song title, artist name, album name (if known), release year, and genre in JSON format:
[{
  "title": "Song Title",
  "artist": "Artist Name", 
  "album": "Album Name",
  "year": "Year",
  "genre": "Genre"
}, ...]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: recommendationPrompt
      });

      let recommendedSongs = [];
      try {
        const responseText = await response.text;
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.error('No JSON array found in response');
          return [];
        }
        recommendedSongs = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Error parsing AI recommendations:', parseError);
        return [];
      }

      const songsWithVideoInfo = await Promise.all(
        recommendedSongs.map(async (song) => {
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
                album: song.album || "Unknown",
                year: song.year,
                genre: song.genre
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

module.exports = { getAISuggestions, searchYouTube, extractTopResultFromHTML };
