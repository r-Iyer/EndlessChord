const Channel = require('../models/Channel');
const { Song } = require('../models/Song');
const { getUniqueAISuggestions, } = require('../utils/aiHelpers');
const SongCache = require('../models/SongCache');
const { CACHED_SONG_COUNT } = require('../config/constants');

/**
* Service for caching songs and managing song retrieval
*/
class SongCacheService {
  constructor() {
    // Structure: { channelName: { songs: [], lastUpdated: Date, updating: boolean } }
    this.channels = {};
  }
  
  /**
  * Initialize cache for a channel
  * @param {string} channelName - Name of the channel to initialize
  * @returns {Object} Channel cache object
  */
  initChannel(channelName) {
    if (!this.channels[channelName]) {
      this.channels[channelName] = {
        songs: [],
        lastUpdated: null,
        updating: false
      };
    }
    return this.channels[channelName];
  }
  

async findSongCacheDb(channelName) {
  return SongCache.findOne({ channelName: channelName });
}
  
  /**
  * Get songs from cache or refresh if needed
  * @param {string} channelName - Name of the channel
  * @param {number} count - Number of songs to return
  * @returns {Promise<Array>} Array of songs
  */
  async getCachedSongs(channelName, count = CACHED_SONG_COUNT) {
    const cache = await this.findSongCacheDb(channelName);
    
    const availableSongs = cache?.songs
    
    // If we have enough songs in cache after filtering
    if (availableSongs?.length >= count) {
      // Trigger cache refresh in background
      if (!cache.updating) {
        this.refreshCache(channelName)
        .then(() => {
          console.log(`[CACHE] Background cache refresh completed for channel ${channelName}`);
        })
        .catch(err => {
          console.error(`[CACHE] Background cache refresh error for channel ${channelName}:`, err);
        });
      }
      
      // Return random selection of songs from cache
      return this.getRandomSongs(availableSongs, count);
    }
    
    // Not enough songs in cache, need to fetch more immediately
    const songs = this.refreshCache(channelName, count);
    this.refreshEmptyChannelCaches();
    return songs;
  }

async updateSongCacheDb(channelName, newSongs, returnCount = CACHED_SONG_COUNT) {
  // Shuffle and select random songs
  const selectedSongs = this.getRandomSongs(newSongs, returnCount);

  // Update cache in MongoDB with embedded song data
  await SongCache.findOneAndUpdate(
    { channelName },
    {
      songs: newSongs,
      lastUpdated: new Date(),
      updating: false,
    },
    { upsert: true, new: true }
  );

  return selectedSongs;
}
  
  /**
  * Get random selection of songs
  * @param {Array} songs - Array of songs to select from
  * @param {number} count - Number of songs to return
  * @returns {Array} Randomly selected songs
  */
  getRandomSongs(songs, count) {
    const shuffled = [...songs].sort(() => 0.5 - Math.random());
    
    return shuffled.slice(0, count);
  }
  
  /**
  * Refresh the cache for a channel
  * @param {string} channelName - Name of the channel
  * @param {number} returnCount - Number of songs to return
  * @returns {Promise<Array>} Array of songs
  */
  async refreshCache(channelName, returnCount = CACHED_SONG_COUNT) {
    let cache = await this.findSongCacheDb(channelName);

    if (!cache) {
      console.log(`[CACHE] No cache found for channel ${channelName}, creating new one.`);
      cache = new SongCache({
        channelName,
        songs: [],
        lastUpdated: null,
        updating: false,
      });
      await cache.save();
    }

    // Prevent concurrent refreshes
    if (cache.updating) {
      // If already updating, wait for existing songs or return empty array
      if (cache.songs.length > 0) {
        const availableSongs = cache.songs
        const songs = this.getRandomSongs(availableSongs, returnCount);
        
        this.updateSongCacheDb(channelName, availableSongs);

        return songs;
      }
      return [];
    }
    
    cache.updating = true;
    
    try {
      // Get channel details
      const channel = await Channel.findOne({ name: channelName }) 
      if (!channel) {
        throw new Error(`Channel ${channelName} not found`);
      }
      
      const newSongs = [];
      try {
        console.log(`[CACHE] Fetching songs for channel: ${channel.name}`);
        const aiSuggestions = await getUniqueAISuggestions(channel, Song, [], [], 10);

       console.log(`[CACHE] Fetched songs for channel: ${channel.name}`);

        for (const suggestion of aiSuggestions) {
          const newSong = new Song({
            ...suggestion,
            language: channel.language
          });
          newSongs.push(newSong);
        }
      } catch (aiError) {
        console.error('[CACHE] Error getting AI suggestions:', aiError);
      }
      // Return requested number of random songs
      const songs = this.getRandomSongs(newSongs, returnCount);

      this.updateSongCacheDb(channelName, newSongs);

      return songs;
    } catch (error) {
      console.error(`[CACHE] Error refreshing cache for channel ${channelName}:`, error);
      return [];
    } finally {
      cache.updating = false;
    }
  }
  
  /**
  * Check and refresh all empty channel caches
  * @returns {Promise<void>}
  */
  async refreshEmptyChannelCaches() {
    try {
      // Get all channels
      const channels = await Channel.find({});
      
      // Process each channel
      for (const channel of channels) {
        const cache = this.channels[channel.name];
        
        // Skip if cache exists and has songs or is currently updating
        if (cache && (cache.songs.length > 0 || cache.updating)) {
          continue;
        }
        
        // Refresh cache for this channel
        this.refreshCache(channel.name).catch(err => 
          console.error(`[CACHE] Error refreshing empty cache for channel ${channel._id}:`, err)
        );
      }
    } catch (error) {
      console.error('[CACHE] Error refreshing empty channel caches:', error);
    }
  }
}

// Export a singleton instance
module.exports = new SongCacheService();