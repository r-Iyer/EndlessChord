const mongoose = require('mongoose');
const logger = require('../utils/loggerUtils');

const songSchema = new mongoose.Schema({
  videoId:    String,
  title:      String,
  artist:     String,
  composer:   String,
  album:      String,
  year:       String,
  genre:      [String],
  language:   [String],
  playCount:  { type: Number, default: 0 },
  lastPlayed: Date,
});

// 1) Attach a static to initialize your Atlas Search index
songSchema.statics.initSearchIndex = async function() {
  // `this` === the compiled Model, so `this.collection` is the raw MongoDB Collection
  await this.collection.createSearchIndex({
    name: 'default',
    definition: {
      mappings: {
        fields: {
          title:    { type: 'string' },
          artist:   { type: 'string' },
          composer: { type: 'string' },
          album:    { type: 'string' },
        }
      }
    }
  });
  logger.info('✅ Atlas Search index “default” is ready');
};

// 2) Compile & export your Model
const Song = mongoose.model('Song', songSchema);

module.exports = { Song, songSchema };
