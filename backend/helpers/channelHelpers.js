const Channel = require('../models/Channel');
const logger = require('../utils/loggerUtils');

/**
* Fetch all channels from the database.
* @returns {Promise<Array>} Array of channel documents
*/
const getChannelsInDb = async () => {
  try {
    const channels = await Channel.find().exec();
    logger.debug(`[getChannelsInDb] Retrieved ${channels.length} channels`);
    return channels;
  } catch (error) {
    logger.error('[getChannelsInDb ERROR]', error);
    return [];
  }
};

/**
* Fetch a single channel by its ID.
* @param {string} channelId - The channel ID
* @returns {Promise<Object|null>} Channel document or null if not found
*/
const getChannelsInDbById = async (channelId) => {
  try {
    if (!channelId) {
      logger.warn('[getChannelsInDbById] No channelId provided');
      return null;
    }

    const channel = await Channel.findById(channelId).exec();
    logger.debug(`[getChannelsInDbById] Retrieved channel: ${channel ? channel.name : 'not found'}`);
    return channel;
  } catch (error) {
    logger.error('[getChannelsInDbById ERROR]', error);
    return null;
  }
};

/**
* Delete all channels from the database.
*/
const deleteAllChannelsInDb = async () => {
  try {
    const channelResult = await Channel.deleteMany({});
    logger.debug(`[deleteAllChannelsInDb] Deleted ${channelResult.deletedCount} channels`);
  } catch (error) {
    logger.error('[deleteAllChannelsInDb ERROR]', error);
  }
};

/**
* Insert multiple channels into the database.
* @param {Array} channelSeeds - Array of channel documents
*/
const insertChannelsInDb = async (channelSeeds) => {
  try {
    await Channel.insertMany(channelSeeds);
    logger.debug('[insertChannelsInDb] Channels created.');
  } catch (error) {
    logger.error('[insertChannelsInDb ERROR]', error);
  }
};

module.exports = {
  getChannelsInDb,
  getChannelsInDbById,
  deleteAllChannelsInDb,
  insertChannelsInDb
};
