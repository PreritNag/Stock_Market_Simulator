const mongoose = require('mongoose');

const ohlcvSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  open: {
    type: Number,
    required: true
  },
  high: {
    type: Number,
    required: true
  },
  low: {
    type: Number,
    required: true
  },
  close: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    required: true
  }
}, { _id: false });

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Symbol is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Stock name is required'],
    trim: true
  },
  sector: {
    type: String,
    trim: true
  },
  market: {
    type: String,
    default: 'NSE'
  },
  currentPrice: {
    type: Number,
    default: 0
  },
  change: {
    type: Number,
    default: 0
  },
  changePercent: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['STOCK', 'ETF', 'INDEX', 'FOREX', 'CRYPTO'],
    default: 'STOCK'
  },
  peRatio: {
    type: Number,
    default: null
  },
  dividendYield: {
    type: Number,
    default: null
  },
  marketCap: {
    type: Number,
    default: null
  },
  volume: {
    type: Number,
    default: 0
  },
  ohlcv: {
    type: [ohlcvSchema],
    default: []
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
stockSchema.index({ name: 'text', symbol: 'text' });

module.exports = mongoose.model('Stock', stockSchema);
