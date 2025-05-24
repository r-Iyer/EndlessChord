require('dotenv').config();
const express = require('express');
const Channel = require('../../models/Channel');
const User = require('../../models/User');
const { addAISuggestionsIfNeeded } = require('../../utils/aiHelpers');
const { MINIMUM_SONG_COUNT, RECENTLY_PLAYED_THRESHOLD } = require('../../config/constants'); 
const { parseExcludeIds, getRecentlyPlayedIds, getSongsWithExclusions, sortSongsByLastPlayed } = require('../../utils/songHelpers');
const { optionalAuth } = require('../../utils/authHelpers');
const { handleError, sendResponse } = require('../../utils/handlers');

const router = express.Router();

router.get('/:channelId', optionalAuth, async (req, res) => {
  const { source } = req.query;
  console.log(`[ROUTE] GET /api/songs/${req.params.channelId} — Source: ${source}`);
  
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) {
      return sendResponse(res, { message: 'Channel not found' }, 404);
    }
    
    const excludeIds = parseExcludeIds(req.query.excludeIds);
    let recentlyPlayedIds = await getRecentlyPlayedIds(channel.language);

    // Add logged-in user's recent playback history
    if (req.user) {
      const user = await User.findById(req.user.id).select('history');
      const userRecentSongs = user?.history?.filter(entry => 
        new Date(entry.playedAt) > RECENTLY_PLAYED_THRESHOLD
      );
      const userRecentIds = userRecentSongs?.map(entry => entry.songId.toString());
      recentlyPlayedIds = [...new Set([...recentlyPlayedIds, ...(userRecentIds ?? [])])];
    }

    const allExcludeIds = [...new Set([...recentlyPlayedIds, ...excludeIds])];
    
    let songs = await getSongsWithExclusions(channel.genre, channel.language, allExcludeIds);
    
    const { songs: updatedSongs, aiSuggestionsAdded } = await addAISuggestionsIfNeeded(songs, channel, allExcludeIds);
    songs = updatedSongs;

																								 
    if (!aiSuggestionsAdded && source === 'initial') {
      songs = sortSongsByLastPlayed(songs);
      songs = songs.slice(0, MINIMUM_SONG_COUNT);
    }
    
    console.log(`[SONGS] Returning ${songs.length} songs for channel ${channel.name}`);
    sendResponse(res, songs);
  } catch (error) {
    handleError(res, error, `/api/songs/${req.params.channelId}`);
  }
});

module.exports = router;