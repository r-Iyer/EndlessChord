const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  videoId: String,
  title: String,
  artist: String,
  composer: String,
  album: String,
  year: String,
  genre: [String],  // Array of strings
  language: [String],  // Array of strings
  playCount: { type: Number, default: 0 },
  lastPlayed: Date,
});

const Song = mongoose.model('Song', songSchema);
module.exports = { Song, songSchema };