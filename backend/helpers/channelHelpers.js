const Channel = require('../models/Channel');
const logger = require('../utils/loggerUtils');

/**
* Fetch all channels from the database.
* @returns {Promise<Array>} Array of channel documents
*/
const getChannelsInDb = async () => {
  try {
    // Fetch all channels
    const channels = await Channel.find().exec();
    logger.debug(`[getChannelsInDb] Retrieved ${channels.length} channels`);
    return channels;
  } catch (error) {
    logger.error('[getChannelsInDb ERROR]', error);
    // Return empty array on error
    return [];
  }
};

/**
* Fetch a single channel by its ID from the request parameters.
* @param {Object} req - Express request object
* @returns {Promise<Object|null>} Channel document or null if not found
*/
const getChannelsInDbById = async (channelId) => {
  try {
    
    if (!channelId) {
      logger.warn('[getChannelsInDbById] No channelId provided in request parameters');
      // If no channelId provided, return null or handle as needed
      return null;
    }
    
    // Find channel by ID
    const channel = await Channel.findById(channelId).exec();
    logger.debug(`[getChannelsInDbById] Retrieved channel: ${channel ? channel.name : 'not found'}`);
    return channel;
  } catch (error) {
    logger.error('[getChannelsInDbById ERROR]', error);
    // Return null on error to indicate not found / failure
    return null;
  }
};

const deleteAllChannelsInDb = async () => {
  await Channel.deleteMany({})
  logger.debug(`Deleted ${channelResult.deletedCount} channels`);
}

const insertChannelsInDb = async(channelSeeds) => {
    await Channel.insertMany(channelSeeds);
    logger.debug('[DB] Channels created.');
};


module.exports = { getChannelsInDb, getChannelsInDbById, deleteAllChannelsInDb, insertChannelsInDb};
