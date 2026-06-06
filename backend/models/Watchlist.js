const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  symbols: [{
    type: String,
    trim: true
  }]
}, { timestamps: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
