const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },

  // Array of favorited songs
  favorites: [
    {
      songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
      addedAt: { type: Date, default: Date.now }
    }
  ],

  // Array of played songs (history)
  history: [
    {
      songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
      playedAt: { type: Date, default: Date.now },
      playCount: { type: Number, default: 1 } // optional per entry
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
