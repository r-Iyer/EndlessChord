// src/services/albumService.js

import { api } from './apiService';

/**
 * Fetch all albums for the current user.
 */
export const getAlbums = async () => {
  try {
    const response = await api.get('/api/albums');
    return response.data.albums || [];
  } catch (error) {
    console.error('Failed to fetch albums', error);
    return [];
  }
};

/**
 * Fetch a single album's songs by album ID.
 */
export const getAlbumSongs = async (albumId) => {
  try {
    const response = await api.get(`/api/albums/${albumId}/songs`);
    return response.data.songs || [];
  } catch (error) {
    console.error(`Failed to fetch songs for album ${albumId}`, error);
    return [];
  }
};

/**
 * Create a new album, optionally with songs.
 */
export const createAlbum = async (name, songId = null) => {
  const payload = { name };
  if (songId) payload.songIds = [songId];
  const { data } = await api.post('/api/albums', payload);
  return data.album;
};

/**
 * Delete an entire album by ID.
 */
export const deleteAlbum = async (albumId) => {
  try {
    await api.delete(`/api/albums/${albumId}`);
  } catch (error) {
    console.error(`Failed to delete album ${albumId}`, error);
  }
};

/**
 * Rename an album.
 */
export const renameAlbum = async (albumId, newName) => {
  try {
    const { data } = await api.patch(`/api/albums/${albumId}/rename`, { name: newName });
    return data.album;
  } catch (error) {
    console.error(`Failed to rename album ${albumId}`, error);
    return null;
  }
};

/**
 * Add a song to an album.
 */
export const addSongToAlbum = async (albumId, songId) => {
  try {
    await api.patch(`/api/albums/${albumId}/add-song`, { songId });
  } catch (error) {
    console.error(`Failed to add song to album ${albumId}`, error);
  }
};

/**
 * Remove a song from an album.
 */
export const removeSongFromAlbum = async (albumId, songId) => {
  try {
    await api.delete(`/api/albums/${albumId}/songs/${songId}`);
  } catch (error) {
    console.error(`Failed to remove song from album ${albumId}`, error);
  }
};
