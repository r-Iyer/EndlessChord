const cheerio = require('cheerio');
const axios = require('axios');
const logger = require('./loggerUtils');

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
              language: song.language
            };
          }
          return null;
        } catch (error) {
          logger.error(`Error searching YouTube for ${song.title}:`, error);
          return null;
        }
      })
    );
    return songsWithVideoInfo.filter(song => song !== null);
  } catch (error) {
    logger.error('Error processing YouTube videos:', error);
    return [];
  }
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
        logger.error('Failed to parse YouTube initial data:', e);
      }
    }
    return extractTopResultFromHTML(html);
  } catch (error) {
    logger.error('YouTube alternative search error:', error);
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
    logger.error('HTML extraction error:', error);
    return null;
  }
}

module.exports = {
  getYouTubeVideoDetails
};
