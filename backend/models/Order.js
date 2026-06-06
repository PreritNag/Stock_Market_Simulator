const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  symbol: {
    type: String,
    required: [true, 'Stock symbol is required'],
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: {
      values: ['BUY', 'SELL'],
      message: 'Order type must be BUY or SELL'
    },
    required: [true, 'Order type is required']
  },
  qty: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required']
  },
  total: {
    type: Number
  },
  status: {
    type: String,
    enum: {
      values: ['PENDING', 'EXECUTED', 'CANCELLED'],
      message: 'Status must be PENDING, EXECUTED, or CANCELLED'
    },
    default: 'EXECUTED'
  },
  orderMode: {
    type: String,
    enum: ['MARKET', 'LIMIT', 'STOP'],
    default: 'MARKET'
  },
  triggerPrice: {
    type: Number,
    default: null
  },
  pnl: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
orderSchema.index({ userId: 1, timestamp: -1 });
orderSchema.index({ symbol: 1 });
orderSchema.index({ status: 1 });

// Pre-save: compute total if not set
orderSchema.pre('save', function (next) {
  if (!this.total) {
    this.total = this.price * this.qty;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
