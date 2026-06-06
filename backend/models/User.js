const mongoose = require('mongoose');

const portfolioItemSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    required: true,
    default: 0
  },
  avgPrice: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  virtualBalance: {
    type: Number,
    default: 10000
  },
  portfolio: {
    type: [portfolioItemSchema],
    default: []
  },

  trades: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  totalPnL: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster email lookups - email is already indexed by unique: true

module.exports = mongoose.model('User', userSchema);
