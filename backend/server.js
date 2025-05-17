const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require("@google/genai");
const connectDB = require('./config/db');
const Channel = require('./models/Channel');
const Song = require('./models/Song');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

// Initialize seed data if database is empty
async function initializeDatabase() {
    const channelCount = await Channel.countDocuments();
    
    // Always clear songs collection when server starts
    await Song.deleteMany({});
    console.log('Songs collection cleared');
    
    if (channelCount === 0) {
        console.log('Initializing database with seed data...');
        
        const hindiChannel = new Channel({
            name: 'Hindi Hits',
            description: 'Popular Hindi music from Bollywood and beyond',
            language: 'hindi',
            genre: 'various',
            seedSongs: []
        });
        
        const englishChannel = new Channel({
            name: 'English Pop',
            description: 'Top English pop hits from around the world',
            language: 'english',
            genre: 'pop',
            seedSongs: []
        });
        
        await Promise.all([
            hindiChannel.save(),
            englishChannel.save()
        ]);
        
        console.log('Database initialized with seed data.');
    }
}

// Helper functions
async function getAISuggestions(channel) {
    const MAX_RETRIES = 5;
    const BACKOFF_FACTOR = 1000;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Step 1: Get existing songs for examples
            const existingSongs = await Song.find({ language: channel.language }).limit(5);
            const songExamples = existingSongs.map(song => 
                `"${song.title}" by ${song.artist} (${song.year}, ${song.genre})`
            ).join('\n');
            
            // Step 2: Get AI recommendations (without asking for URLs)
            const recommendationPrompt = `I need recommendations for 10 popular ${channel.language} music videos similar to these examples:
        
  ${songExamples}
  
  Do not recommend the songs I mentioned above. Those are just examples.
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
            
            // Step 3: Parse AI recommendations
            let recommendedSongs = [];
            try {
                const responseText = await response.text;
                
                // Extract JSON content
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
            
            // Step 4: Search YouTube API for each recommended song
            const songsWithVideoInfo = await Promise.all(
                recommendedSongs.map(async (song) => {
                    try {
                        // Create search query from song info
                        const searchQuery = `${song.title} ${song.artist} official music video`;
                        
                        // Use YouTube API to search
                        const searchResults = await searchYouTubeAlternative(searchQuery);
                        
                        if (searchResults) {
                            const bestMatch = searchResults; // Get the top search result
                            
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
            
            // Filter out any failed searches
            return songsWithVideoInfo.filter(song => song !== null);
            
        } catch (error) {
            if (attempt < MAX_RETRIES) {
                console.warn(`Error with AI or YouTube API. Retrying in ${BACKOFF_FACTOR * attempt}ms...`);
                await new Promise(resolve => setTimeout(resolve, BACKOFF_FACTOR * attempt));
            } else {
                console.error('Error getting AI suggestions:', error);
                return [];
            }
        }
    }
    
    console.error('Max retries reached. Unable to fetch AI suggestions.');
    return [];
}

// Function to search YouTube videos using YouTube Data API
async function searchYouTubeVideos(query) {
    try {
        // You'll need to set up the YouTube API client and API key
        // This is a simplified example
        const youtubeApiKey = process.env.YOUTUBE_API_KEY;
        
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${youtubeApiKey}`
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('YouTube search error:', error);
        return [];
    }
}

// Alternative implementation using YouTube search scraping if API is not available
// Note: This approach may break if YouTube changes their page structure
/**
 * Search YouTube and extract only the top video result for a query
 * @param {string} query - The search term to look for on YouTube
 * @returns {Promise<Object|null>} - Object with videoId and title of the top result, or null if no results
 */
async function searchYouTubeAlternative(query) {
    try {
        // Construct the search URL
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        
        // Make the HTTP request to get the search results page
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        
        // Extract the initial data from the page
        const html = response.data;
        const initialDataRegex = /var ytInitialData = ({.*?});/;
        const match = html.match(initialDataRegex);
        
        // Try to extract from JSON first
        if (match && match[1]) {
            try {
                // Parse the YouTube initial data JSON
                const initialData = JSON.parse(match[1]);
                
                // Navigate through the YouTube response structure to find video results
                const contents = initialData?.contents?.twoColumnSearchResultsRenderer
                    ?.primaryContents?.sectionListRenderer?.contents?.[0]
                    ?.itemSectionRenderer?.contents;
                
                if (contents && Array.isArray(contents)) {
                    // Find the first video result
                    for (const item of contents) {
                        // Check if this is a video result (not an ad, channel, etc.)
                        if (item.videoRenderer) {
                            const { videoId, title } = item.videoRenderer;
                            
                            if (videoId) {
                                // Return only the top result with minimal information
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
                // Fall through to HTML parsing
            }
        }
        
        // Fall back to HTML parsing if JSON extraction fails
        return extractTopResultFromHTML(html);
    } catch (error) {
        console.error('YouTube alternative search error:', error);
        return null;
    }
}

/**
 * Extract just the top video result from HTML using Cheerio as a fallback method
 * @param {string} html - The HTML content of the YouTube search page
 * @returns {Promise<Object|null>} - Object with videoId and title, or null if no results
 */
async function extractTopResultFromHTML(html) {
    try {
        const $ = cheerio.load(html);
        
        // Look for video links in the HTML
        const videoLinks = $('a#video-title, a.yt-simple-endpoint.style-scope.ytd-video-renderer');
        
        if (videoLinks.length > 0) {
            // Get the first video link
            const firstVideoLink = $(videoLinks[0]);
            const href = firstVideoLink.attr('href') || '';
            
            // Extract video ID from href
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

// API Routes
app.get('/api/channels', async (req, res) => {
    try {
        const channels = await Channel.find();
        res.json(channels);
    } catch (error) {
        console.error('Error fetching channels:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/channels/:id', async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }
        res.json(channel);
    } catch (error) {
        console.error('Error fetching channel:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/channels/:id/songs', async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }
        
        // Get exclude parameter (songs to exclude)
        const excludeIds = req.query.exclude ? req.query.exclude.split(',') : [];
        
        // Get recently played songs for this channel
        const recentlyPlayed = await Song.find({ 
            language: channel.language,
            lastPlayed: { $exists: true }
        }).sort({ lastPlayed: -1 }).limit(10).select('videoId');
        
        const recentlyPlayedIds = recentlyPlayed.map(song => song.videoId);
        
        // All IDs to exclude (recently played + explicitly excluded)
        const allExcludeIds = [...new Set([...recentlyPlayedIds, ...excludeIds])];
        
        // Find songs that match channel criteria and haven't been played recently
        let songs = await Song.find({ 
            language: channel.language,
            videoId: { $nin: allExcludeIds }
        }).sort({ playCount: 1 }).limit(5);
        
        // If we don't have enough songs, get AI suggestions
        if (songs.length < 5) {
            try {
                const aiSuggestions = await getAISuggestions(channel);
                console.log(aiSuggestions)
                
                // Process suggestions (create new song entries)
                const newSongs = [];
                for (const suggestion of aiSuggestions) {
                    const exists = await Song.findOne({ videoId: suggestion.videoId });
                    if (!exists) {
                        const newSong = new Song({
                            ...suggestion,
                            language: channel.language
                        });
                        await newSong.save();
                        newSongs.push(newSong);
                    }
                }
                
                // Add new songs to the list if we don't have enough
                if (songs.length < 5) {
                    songs = [...songs, ...newSongs.slice(0, 5 - songs.length)];
                }
            } catch (aiError) {
                console.error('Error getting AI suggestions:', aiError);
                // Continue with existing songs even if AI fails
            }
        }
        
        // Update playCount and lastPlayed for the returned songs
        for (const song of songs) {
            song.playCount += 1;
            song.lastPlayed = new Date();
            await song.save();
        }
        
        res.json(songs);
    } catch (error) {
        console.error('Error fetching songs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/test-gpt', async (req, res) => {
    try {
        const prompt = "Say hello to the world in a creative way.";
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt
        });
        const responseText = await response.text();
        // Remove markdown formatting if present
        const cleanText = responseText.replace(/```json\n|\n```/g, '');
        res.json({ message: cleanText });
    } catch (error) {
        console.error('Error testing Gemini:', error);
        res.status(500).json({ message: 'Error testing Gemini', error: error.message });
    }
});

// Production setup
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    
    app.get('/api/*', (req, res) => {
        res.status(404).json({ message: 'API route not found' });
    });
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    });
}

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeDatabase();
});

module.exports = app;