
const songCacheService = require('../services/songCache');
const Channel = require('../models/Channel');

/**
 * Initialize song cache for all channels
 * @returns {Promise<void>}
 */
async function initializeSongCache() {
  console.log('[CACHE] Initializing song cache for all channels');
  try {
    const channels = await Channel.find();
    console.log(`[CACHE] Found ${channels.length} channels to initialize`);
    
    // Start cache initialization for each channel
    const initPromises = channels.map(channel => {
      console.log(`[CACHE] Starting initialization for channel: ${channel.name}`);
      return songCacheService.refreshCache(channel._id)
        .then(songs => {
          console.log(`[CACHE] Successfully cached ${songs.length} songs for channel: ${channel.name}`);
        })
        .catch(error => {
          console.log(`[CACHE] Error initializing cache for channel ${channel.name}:`, error);
        });
    });
    
    // Wait for all initializations to complete
    await Promise.all(initPromises);
    console.log('[CACHE] All channel caches initialized');
  } catch (error) {
    console.log('[CACHE] Error during cache initialization:', error);
  }
}

module.exports = {
  initializeSongCache
};