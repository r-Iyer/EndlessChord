const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Owner of album
  name: { type: String, required: true }, // Album name
  description: { type: String }, // Optional description
  
  songs: [
    {
      songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
      addedAt: { type: Date, default: Date.now }
    }
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Optional: Auto-update updatedAt when modified
albumSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Album', albumSchema);
