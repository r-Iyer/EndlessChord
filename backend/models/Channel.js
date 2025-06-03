const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: String,
  description: String,
  language: String,
  genre: [String],
  startYear: String,
  endYear: String
});

module.exports = mongoose.model('Channel', channelSchema);
