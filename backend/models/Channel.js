const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: String,
  description: String,
  language: String,
  genre: String,
  seedSongs: [String], // YouTube video IDs to seed the channel
});

module.exports = mongoose.model('Channel', channelSchema);
