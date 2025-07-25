require('dotenv').config();
const express = require('express');
const { addAISuggestionsIfNeeded } = require('../../utils/aiUtils');
const { parseExcludeIds, getSongsWithExclusions } = require('../../utils/songUtils');
const { requireAuth } = require('../../utils/authUtils');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const { addFavoriteStatus } = require('../../utils/userUtils');
const { getChannelsInDbById } = require('../../helpers/channelHelpers');
const { getUserRecentSongsInDb } = require('../../helpers/userHelpers');
const logger = require('../../utils/loggerUtils');
const { getSongByVideoIdFromDb } = require('../../helpers/songHelpers');

const router = express.Router();

router.get('/song/:videoId', requireAuth, addFavoriteStatus, async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?.id;
  const userName = req.user?.name;

  logger.info(`[ROUTE] GET /api/song/${videoId} — User: ${userName}`);

  try {
    // 1. Fetch song from database by videoId
    const song = await getSongByVideoIdFromDb(videoId);

    if (!song) {
      logger.warn(`[ROUTE] GET /api/song/${videoId} — Song not found`);
      return sendResponse(res, { message: 'Song not found' }, 404);
    }

    logger.info(`[ROUTE] GET /api/song/${videoId} — Found song: ${song.title}`);

    // 3. Return the song
    sendResponse(res, song);
  } catch (error) {
    handleError(res, error, `/api/song/${videoId}`);
  }
});

router.get('/:channelId', requireAuth, addFavoriteStatus, async (req, res) => {
  const { source } = req.query;
  const entity = req.baseUrl.split('/')[2];


  const userId = req.user?.id;
  const userName = req.user?.name;

  logger.info(`[ROUTE] GET /api/songs/${req.params.channelId} — Source: ${source} — User: ${userName}`);

  try {
    const channel = await getChannelsInDbById(req.params.channelId);
    if (!channel) {
      return sendResponse(res, { message: 'Channel not found' }, 404);
    }

    const excludeVideoIds = parseExcludeIds(req.query.excludeIds);
    const userRecentVideoIds = userId ? await getUserRecentSongsInDb(req) : [];

    // Combine exclude IDs uniquely
    const allExcludeVideoIds = [...new Set([...(userRecentVideoIds || []), ...excludeVideoIds])];

    // Get songs with exclusions
    let songs = await getSongsWithExclusions(channel, allExcludeVideoIds, source, entity);

    logger.info(`[ROUTE] GET /api/songs/${req.params.channelId} — Found ${songs.length} matching songs in database`);

    // Append AI suggestions if needed
    let { songs: updatedSongs, aiSuggestionsAdded } = await addAISuggestionsIfNeeded(
      songs,
      channel,
      allExcludeVideoIds,
      source,
      userId,
      entity
    );

    logger.info(`[ROUTE] GET /api/songs/${req.params.channelId} — Returning ${updatedSongs.length} songs for channel ${channel.name}`);
    logger.info(`[ROUTE] GET /api/songs/${req.params.channelId} — AI Suggestions added: ${aiSuggestionsAdded}`);

    sendResponse(res, updatedSongs);
  } catch (error) {
    handleError(res, error, `/api/songs/${req.params.channelId}`);
  }
});

module.exports = router;
