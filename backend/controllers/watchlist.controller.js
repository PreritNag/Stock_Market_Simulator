const Watchlist = require('../models/Watchlist');

/**
 * @desc    Get user's watchlist
 * @route   GET /api/watchlist
 */
const getWatchlist = async (req, res) => {
  try {
    let watchlist = await Watchlist.findOne({ userId: req.user._id });
    
    if (!watchlist) {
      watchlist = await Watchlist.create({ userId: req.user._id, symbols: [] });
    }

    res.json({
      success: true,
      symbols: watchlist.symbols
    });
  } catch (error) {
    console.error('GetWatchlist error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching watchlist'
    });
  }
};

/**
 * @desc    Add symbol to watchlist
 * @route   POST /api/watchlist
 */
const addToWatchlist = async (req, res) => {
  try {
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Symbol is required'
      });
    }

    const formattedSymbol = symbol.trim().toUpperCase();

    let watchlist = await Watchlist.findOne({ userId: req.user._id });
    if (!watchlist) {
      watchlist = new Watchlist({ userId: req.user._id, symbols: [] });
    }

    if (watchlist.symbols.includes(formattedSymbol)) {
      return res.status(400).json({
        success: false,
        message: 'Symbol already in watchlist'
      });
    }

    watchlist.symbols.push(formattedSymbol);
    await watchlist.save();

    res.json({
      success: true,
      message: `${formattedSymbol} added to watchlist`,
      symbols: watchlist.symbols
    });
  } catch (error) {
    console.error('AddToWatchlist error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error adding to watchlist'
    });
  }
};

/**
 * @desc    Remove symbol from watchlist
 * @route   DELETE /api/watchlist/:symbol
 */
const removeFromWatchlist = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Symbol is required'
      });
    }

    const formattedSymbol = symbol.trim().toUpperCase();

    const watchlist = await Watchlist.findOne({ userId: req.user._id });
    if (!watchlist || !watchlist.symbols.includes(formattedSymbol)) {
      return res.status(404).json({
        success: false,
        message: 'Symbol not found in watchlist'
      });
    }

    watchlist.symbols = watchlist.symbols.filter(s => s !== formattedSymbol);
    await watchlist.save();

    res.json({
      success: true,
      message: `${formattedSymbol} removed from watchlist`,
      symbols: watchlist.symbols
    });
  } catch (error) {
    console.error('RemoveFromWatchlist error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error removing from watchlist'
    });
  }
};

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist
};
