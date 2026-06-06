const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    const { validateRegisterInput } = require('../utils/validators');
    const { errors, isValid } = validateRegisterInput({ name, email, password });
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: Object.values(errors)[0]
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with default virtual balance
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      virtualBalance: 10000,
      portfolio: [],
      trades: [],
      totalPnL: 0
    });

    // Create Watchlist document for user
    const Watchlist = require('../models/Watchlist');
    await Watchlist.create({ userId: user._id, symbols: [] });

    // Create Initial Deposit Transaction
    await Transaction.create({
      userId: user._id,
      type: 'INITIAL_DEPOSIT',
      amount: 10000,
      description: 'Initial sign-up virtual balance credit',
      status: 'COMPLETED'
    });

    // Generate token
    const token = generateToken(user._id);

    console.log(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        virtualBalance: user.virtualBalance,
        portfolio: user.portfolio,
        watchlist: [],
        totalPnL: user.totalPnL,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    console.log(`User logged in: ${user.email}`);

    const Watchlist = require('../models/Watchlist');
    let watchlistDoc = await Watchlist.findOne({ userId: user._id });
    const watchlistSymbols = watchlistDoc ? watchlistDoc.symbols : [];

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        virtualBalance: user.virtualBalance,
        portfolio: user.portfolio,
        watchlist: watchlistSymbols,
        totalPnL: user.totalPnL,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('trades');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const Watchlist = require('../models/Watchlist');
    let watchlistDoc = await Watchlist.findOne({ userId: req.user._id });
    const watchlistSymbols = watchlistDoc ? watchlistDoc.symbols : [];

    const userObj = user.toObject();
    userObj.watchlist = watchlistSymbols;

    res.json({
      success: true,
      user: userObj
    });
  } catch (error) {
    console.error('GetMe error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user data'
    });
  }
};

/**
 * @desc    Google auth login/signup
 * @route   POST /api/auth/google
 */
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create user with default virtual balance
      const generatedPassword = Math.random().toString(36).slice(-10) + 'A1!';
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(generatedPassword, salt);

      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: hashedPassword,
        virtualBalance: 10000,
        portfolio: [],
        trades: [],
        totalPnL: 0
      });

      // Create Watchlist document for user
      const Watchlist = require('../models/Watchlist');
      await Watchlist.create({ userId: user._id, symbols: [] });

      // Create Initial Deposit Transaction
      await Transaction.create({
        userId: user._id,
        type: 'INITIAL_DEPOSIT',
        amount: 10000,
        description: 'Initial Google sign-up virtual balance credit',
        status: 'COMPLETED'
      });
    }

    // Generate token
    const jwtToken = generateToken(user._id);

    // Fetch watchlist symbols
    const Watchlist = require('../models/Watchlist');
    let watchlistDoc = await Watchlist.findOne({ userId: user._id });
    const watchlistSymbols = watchlistDoc ? watchlistDoc.symbols : [];

    console.log(`User logged in via Google: ${user.email}`);

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        virtualBalance: user.virtualBalance,
        portfolio: user.portfolio,
        watchlist: watchlistSymbols,
        totalPnL: user.totalPnL,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Google Login Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Google login failed: ' + error.message
    });
  }
};

module.exports = { register, login, getMe, googleLogin };
