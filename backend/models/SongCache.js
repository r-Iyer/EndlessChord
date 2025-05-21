const { songSchema } = require('../models/Song');
const mongoose = require('mongoose');

const songCacheSchema = new mongoose.Schema({
  channelName: {
    type: String,
    ref: 'Channel',       // tells Mongoose which model to populate against
    required: true,
    unique: true,
  },
  songs: [songSchema],  // embed full song objects
  lastUpdated: { type: Date, default: Date.now },
  updating: { type: Boolean, default: false },
});

module.exports = mongoose.model('SongCache', songCacheSchema);