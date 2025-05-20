const Channel = require('../models/Channel');
const Song = require('../models/Song');
const { getUniqueAISuggestions, } = require('../utils/aiHelpers');

/**
* Service for caching songs and managing song retrieval
*/
class SongCacheService {
  constructor() {
    // Structure: { channelId: { songs: [], lastUpdated: Date, updating: boolean } }
    this.channels = {};
  }
  
  /**
  * Initialize cache for a channel
  * @param {string} channelId - Id of the channel to initialize
  * @returns {Object} Channel cache object
  */
  initChannel(channelId) {
    if (!this.channels[channelId]) {
      this.channels[channelId] = {
        songs: [],
        lastUpdated: null,
        updating: false
      };
    }
    return this.channels[channelId];
  }
  
  /**
  * Get songs from cache or refresh if needed
  * @param {string} channelId - Id of the channel
  * @param {number} count - Number of songs to return
  * @returns {Promise<Array>} Array of songs
  */
  async getCachedSongs(channelId, count = 3) {
    const cache = this.initChannel(channelId);
    
    const availableSongs = cache.songs
    
    // If we have enough songs in cache after filtering
    if (availableSongs.length >= count) {
      // Trigger cache refresh in background
      if (!cache.updating) {
        this.refreshCache(channelId)
        .then(() => {
          console.log(`Background cache refresh completed for channel ${channelId}`);
        })
        .catch(err => {
          console.error(`Background cache refresh error for channel ${channelId}:`, err);
        });
      }
      
      // Return random selection of songs from cache
      return this.getRandomSongs(availableSongs, count);
    }
    
    // Not enough songs in cache, need to fetch more immediately
    return this.refreshCache(channelId, count);
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
  * @param {string} channelId - Id of the channel
  * @param {number} returnCount - Number of songs to return
  * @returns {Promise<Array>} Array of songs
  */
  async refreshCache(channelId, returnCount = 3) {
    const cache = this.initChannel(channelId);
    
    // Prevent concurrent refreshes
    if (cache.updating) {
      // If already updating, wait for existing songs or return empty array
      if (cache.songs.length > 0) {
        const availableSongs = cache.songs
        return this.getRandomSongs(availableSongs, returnCount);
      }
      return [];
    }
    
    cache.updating = true;
    
    try {
      // Get channel details
      const channel = await Channel.findById(channelId);
      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }
      
      const newSongs = [];
      try {
        console.log(`[CACHE] Fetching songs for channel: ${channel.name}`);
        const aiSuggestions = await getUniqueAISuggestions(channel, Song, [], []);
        
        for (const suggestion of aiSuggestions) {
          const newSong = new Song({
            ...suggestion,
            language: channel.language
          });
          newSongs.push(newSong);
        }
      } catch (aiError) {
        console.error('Error getting AI suggestions:', aiError);
      }
      
      // Update cache
      cache.songs = newSongs;
      cache.lastUpdated = new Date();
      
      // Return requested number of random songs
      return this.getRandomSongs(newSongs, returnCount);
    } catch (error) {
      console.error(`Error refreshing cache for channel ${channelId}:`, error);
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
        const cache = this.channels[channel._id];
        
        // Skip if cache exists and has songs or is currently updating
        if (cache && (cache.songs.length > 0 || cache.updating)) {
          continue;
        }
        
        // Refresh cache for this channel
        this.refreshCache(channel._id).catch(err => 
          console.error(`Error refreshing empty cache for channel ${channel._id}:`, err)
        );
      }
    } catch (error) {
      console.error('Error refreshing empty channel caches:', error);
    }
  }
}

// Export a singleton instance
module.exports = new SongCacheService();