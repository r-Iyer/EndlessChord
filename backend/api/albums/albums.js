const express = require('express');
const { requireAuth } = require('../../utils/authUtils');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const logger = require('../../utils/loggerUtils');
const {
  getAlbumsByUser,
  getAlbumByIdAndUser,
  createAlbum,
  updateAlbumName,
  deleteAlbumByIdAndUser,
  addSongToAlbum,
  removeSongFromAlbum
} = require('../../helpers/albumHelpers');
const { getSongsFromIdListFromDb } = require('../../helpers/songHelpers');

const router = express.Router();

/**
 * GET /api/albums
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const albums = await getAlbumsByUser(req.user.id);
    sendResponse(res, { albums });
  } catch (error) {
    handleError(res, error, '/api/albums');
  }
});

/**
 * GET /api/albums/:albumId/songs
 */
router.get('/:albumId/songs', requireAuth, async (req, res) => {
  try {
    const album = await getAlbumByIdAndUser(req.params.albumId, req.user.id);
    if (!album) return sendResponse(res, { message: 'Album not found.' }, 404);

    const songIds = album.songs.map(s => s.songId);
    const songs = await getSongsFromIdListFromDb(songIds);
    const songsMap = new Map(songs.map(s => [s._id.toString(), s]));
    const orderedSongs = songIds.map(id => songsMap.get(id.toString())).filter(Boolean);

    sendResponse(res, { songs: orderedSongs });
  } catch (error) {
    handleError(res, error, '/api/albums/:albumId/songs');
  }
});

/**
 * POST /api/albums
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, songIds } = req.body;
    if (!name) return sendResponse(res, { message: 'Album name is required.' }, 400);

    const album = await createAlbum(req.user.id, { name, description, songIds });
    sendResponse(res, { success: true, album });
  } catch (error) {
    handleError(res, error, '/api/albums');
  }
});

/**
 * PATCH /api/albums/:albumId/rename
 */
router.patch('/:albumId/rename', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return sendResponse(res, { message: 'New album name is required.' }, 400);

    const album = await updateAlbumName(req.params.albumId, req.user.id, name);
    if (!album) return sendResponse(res, { message: 'Album not found.' }, 404);

    sendResponse(res, { success: true, album });
  } catch (error) {
    handleError(res, error, '/api/albums/:albumId/rename');
  }
});

/**
 * PATCH /api/albums/:albumId/add-song
 */
router.patch('/:albumId/add-song', requireAuth, async (req, res) => {
  try {
    const { songId } = req.body;
    if (!songId) return sendResponse(res, { message: 'songId is required.' }, 400);

    const album = await addSongToAlbum(req.params.albumId, req.user.id, songId);
    if (!album) return sendResponse(res, { message: 'Album not found or failed to add song.' }, 404);

    sendResponse(res, { success: true, album });
  } catch (error) {
    handleError(res, error, '/api/albums/:albumId/add-song');
  }
});

/**
 * DELETE /api/albums/:albumId/songs/:songId
 */
router.delete('/:albumId/songs/:songId', requireAuth, async (req, res) => {
  try {
    const album = await removeSongFromAlbum(req.params.albumId, req.user.id, req.params.songId);
    if (!album) return sendResponse(res, { message: 'Album not found or song not removed.' }, 404);

    sendResponse(res, { success: true, album });
  } catch (error) {
    handleError(res, error, '/api/albums/:albumId/songs/:songId');
  }
});

/**
 * DELETE /api/albums/:albumId
 */
router.delete('/:albumId', requireAuth, async (req, res) => {
  try {
    const result = await deleteAlbumByIdAndUser(req.params.albumId, req.user.id);
    if (!result) return sendResponse(res, { message: 'Album not found.' }, 404);

    sendResponse(res, { success: true });
  } catch (error) {
    handleError(res, error, '/api/albums/:albumId');
  }
});

module.exports = router;
