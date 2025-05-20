const { songSchema } = require('../models/Song');
const mongoose = require('mongoose');

const songCacheSchema = new mongoose.Schema({
  channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true, unique: true },
  songs: [songSchema],  // embed full song objects
  lastUpdated: { type: Date, default: Date.now },
  updating: { type: Boolean, default: false },
});

module.exports = mongoose.model('SongCache', songCacheSchema);