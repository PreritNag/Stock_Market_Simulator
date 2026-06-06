const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  criteriaType: {
    type: String,
    enum: ['PRICE_ABOVE', 'PRICE_BELOW', 'RSI_ABOVE', 'RSI_BELOW'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'TRIGGERED', 'CANCELLED'],
    default: 'PENDING'
  },
  triggeredAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

alertSchema.index({ userId: 1, symbol: 1 });
alertSchema.index({ status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
