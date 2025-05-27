require('dotenv').config();
const express = require('express');
const { addAISuggestionsIfNeeded } = require('../../utils/aiUtils');
const { MINIMUM_SONG_COUNT } = require('../../config/constants'); 
const { parseExcludeIds, getSongsWithExclusions, sortSongsByLastPlayed } = require('../../utils/songUtils');
const { optionalAuth } = require('../../utils/authUtils');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const { addFavoriteStatus } = require('../../utils/favoriteUtils');
const { getChannelsInDbById } = require('../../helpers/channelHelpers');
const { getUserRecentSongsInDb } = require('../../helpers/userHelpers');

const router = express.Router();

router.get('/:channelId', optionalAuth, addFavoriteStatus, async (req, res) => {
  const { source } = req.query;
  console.log(`[ROUTE] GET /api/songs/${req.params.channelId} — Source: ${source}`);
  
  try {
    const channel = await getChannelsInDbById(req.params.channelId);
    if (!channel) {
      return sendResponse(res, { message: 'Channel not found' }, 404);
    }
    
    const excludeIds = parseExcludeIds(req.query.excludeIds);

    let userRecentIds = await getUserRecentSongsInDb(req);

    //Exclude IDs involve both user recent songs and existing queue of songs
    const allExcludeIds = [...new Set([...(userRecentIds || []), ...excludeIds])];
    
    //Get all songs from the DB with exclusions applied
    let songs = await getSongsWithExclusions(channel.genre, channel.language, allExcludeIds);
    console.log(`[ROUTE] GET /api/songs/${req.params.channelId} — Found ${songs.length} matching songs in database`);
    
    //Append AI suggested songs if needed
    let { songs: updatedSongs, aiSuggestionsAdded } = await addAISuggestionsIfNeeded(songs, channel, allExcludeIds);

    //If AI suggestions were not added and it is an initial request, limit the results to a minimum count 
    // (Just to speed up the initial loading of songs)
    if (!aiSuggestionsAdded && source === 'initial') {
      updatedSongs = sortSongsByLastPlayed(updatedSongs);
      updatedSongs = updatedSongs.slice(0, MINIMUM_SONG_COUNT);
    }
    
    console.log(`[ROUTE] GET /api/songs/${req.params.channelId} — Returning ${updatedSongs.length} songs for channel ${channel.name}`);
    sendResponse(res, updatedSongs);
  } catch (error) {
    handleError(res, error, `/api/songs/${req.params.channelId}`);
  }
});

module.exports = router;