const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  videoId: String,
  title: String,
  artist: String,
  composer: String,
  album: String,
  year: String,
  genre: [String],
  language: [String],
  playCount: { type: Number, default: 0 },
  lastPlayed: Date,
});

const Song = mongoose.model('Song', songSchema);
module.exports = { Song, songSchema };