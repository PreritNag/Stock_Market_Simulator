/**
 * Users Seeder
 * Seeds demo accounts with pre-configured portfolios and balances
 */

require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Watchlist = require('../models/Watchlist');
const Transaction = require('../models/Transaction');

const DEMO_USERS = [
  {
    name: 'Demo Investor',
    email: 'demo@example.com',
    password: 'password123',
    virtualBalance: 15000,
    portfolio: [
      { symbol: 'RELIANCE', qty: 2, avgPrice: 2450.50 },
      { symbol: 'TCS', qty: 1, avgPrice: 3480.00 }
    ],
    totalPnL: 120.00
  },
  {
    name: 'Alpha Trader',
    email: 'trader@example.com',
    password: 'password123',
    virtualBalance: 50000,
    portfolio: [
      { symbol: 'INFY', qty: 10, avgPrice: 1490.00 },
      { symbol: 'SBIN', qty: 25, avgPrice: 615.00 },
      { symbol: 'HDFCBANK', qty: 5, avgPrice: 1580.00 }
    ],
    totalPnL: -450.00
  }
];

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI not found in environment. Make sure ../.env exists with MONGO_URI set.');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, { dbName: 'stock_simulator' });
    console.log('MongoDB connected successfully');

    for (const demoUser of DEMO_USERS) {
      console.log(`Processing demo user: ${demoUser.email}...`);

      // Delete existing user if any
      const existing = await User.findOne({ email: demoUser.email });
      if (existing) {
        await User.deleteOne({ _id: existing._id });
        await Watchlist.deleteOne({ userId: existing._id });
        await Transaction.deleteMany({ userId: existing._id });
        console.log(`  Cleared existing data for ${demoUser.email}`);
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(demoUser.password, salt);

      // Create User
      const user = await User.create({
        name: demoUser.name,
        email: demoUser.email,
        password: hashedPassword,
        virtualBalance: demoUser.virtualBalance,
        portfolio: demoUser.portfolio,
        totalPnL: demoUser.totalPnL,
        createdAt: new Date()
      });

      // Create Watchlist
      await Watchlist.create({
        userId: user._id,
        symbols: ['RELIANCE', 'TCS', 'INFY']
      });

      // Create Initial deposit transaction
      await Transaction.create({
        userId: user._id,
        type: 'INITIAL_DEPOSIT',
        amount: 10000,
        description: 'Initial sign-up virtual balance credit',
        status: 'COMPLETED',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      });

      // Create top-up transaction if virtualBalance > 10000
      if (demoUser.virtualBalance > 10000) {
        await Transaction.create({
          userId: user._id,
          type: 'DEPOSIT',
          amount: demoUser.virtualBalance - 10000,
          description: 'Demo account booster top-up',
          status: 'COMPLETED',
          timestamp: new Date()
        });
      }

      console.log(`  ✓ Created user ${user.name} (${user.email})`);
    }

    console.log('\n✅ Successfully seeded demo users!');
    await mongoose.disconnect();
    console.log('MongoDB disconnected. Seeder finished.');
    process.exit(0);
  } catch (error) {
    console.error('User seeder error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedUsers();
