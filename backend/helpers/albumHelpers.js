const Album = require('../models/Album');
const logger = require('../utils/loggerUtils');

/**
 * Fetches all albums of a user.
 */
const getAlbumsByUser = async (userId) => {
  try {
    const albums = await Album.find({ userId })
      .sort({ updatedAt: -1 })
      .select('_id name description songs createdAt updatedAt');
    logger.debug(`[getAlbumsByUser] Found ${albums.length} albums for user: ${userId}`);
    return albums;
  } catch (error) {
    logger.error(`[getAlbumsByUser] Error fetching albums for user: ${userId}`, error);
    return [];
  }
};

/**
 * Fetches a single album by albumId and userId.
 */
const getAlbumByIdAndUser = async (albumId, userId) => {
  try {
    const album = await Album.findOne({ _id: albumId, userId });
    logger.debug(`[getAlbumByIdAndUser] Found album with ID: ${albumId}`);
    return album;
  } catch (error) {
    logger.error(`[getAlbumByIdAndUser] Error fetching album ID: ${albumId}`, error);
    return null;
  }
};

/**
 * Creates a new album for a user.
 */
const createAlbum = async (userId, { name, description, songIds }) => {
  try {
    const album = new Album({
      userId,
      name,
      description: description || '',
      songs: Array.isArray(songIds) ? songIds.map(songId => ({ songId })) : []
    });
    await album.save();
    logger.debug(`[createAlbum] Created album for user: ${userId}`);
    return album;
  } catch (error) {
    logger.error(`[createAlbum] Error creating album for user: ${userId}`, error);
    throw error;
  }
};

/**
 * Updates album name.
 */
const updateAlbumName = async (albumId, userId, name) => {
  try {
    const album = await Album.findOneAndUpdate(
      { _id: albumId, userId },
      { name },
      { new: true }
    );
    logger.debug(`[updateAlbumName] Updated album name for ID: ${albumId}`);
    return album;
  } catch (error) {
    logger.error(`[updateAlbumName] Error updating album ID: ${albumId}`, error);
    return null;
  }
};

/**
 * Deletes album by id and user.
 */
const deleteAlbumByIdAndUser = async (albumId, userId) => {
  try {
    const result = await Album.findOneAndDelete({ _id: albumId, userId });
    logger.debug(`[deleteAlbumByIdAndUser] Deleted album ID: ${albumId}`);
    return result;
  } catch (error) {
    logger.error(`[deleteAlbumByIdAndUser] Error deleting album ID: ${albumId}`, error);
    return null;
  }
};

/**
 * Adds song to album if not already present.
 */
const addSongToAlbum = async (albumId, userId, songId) => {
  try {
    const album = await getAlbumByIdAndUser(albumId, userId);
    if (!album) return null;

    if (!album.songs.some(s => s.songId.toString() === songId)) {
      album.songs.push({ songId });
      await album.save();
    }
    logger.debug(`[addSongToAlbum] Added song ${songId} to album ${albumId}`);
    return album;
  } catch (error) {
    logger.error(`[addSongToAlbum] Error adding song ${songId} to album ${albumId}`, error);
    return null;
  }
};

/**
 * Removes song from album.
 */
const removeSongFromAlbum = async (albumId, userId, songId) => {
  try {
    const album = await getAlbumByIdAndUser(albumId, userId);
    if (!album) return null;

    album.songs = album.songs.filter(s => s.songId.toString() !== songId);
    await album.save();
    logger.debug(`[removeSongFromAlbum] Removed song ${songId} from album ${albumId}`);
    return album;
  } catch (error) {
    logger.error(`[removeSongFromAlbum] Error removing song ${songId} from album ${albumId}`, error);
    return null;
  }
};

module.exports = {
  getAlbumsByUser,
  getAlbumByIdAndUser,
  createAlbum,
  updateAlbumName,
  deleteAlbumByIdAndUser,
  addSongToAlbum,
  removeSongFromAlbum
};
