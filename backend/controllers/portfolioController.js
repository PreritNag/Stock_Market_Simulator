const User = require('../models/User');
const Stock = require('../models/Stock');
const Order = require('../models/Order');
const { calculatePortfolioPnL } = require('../services/tradingEngine');

/**
 * @desc    Get user's portfolio with current prices and unrealized P&L
 * @route   GET /api/portfolio
 */
const getPortfolio = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate unrealized P&L for each holding
    const portfolioWithPnL = await calculatePortfolioPnL(user);

    res.json({
      success: true,
      portfolio: portfolioWithPnL.holdings,
      totalInvested: portfolioWithPnL.totalInvested,
      totalCurrentValue: portfolioWithPnL.totalCurrentValue,
      totalUnrealizedPnL: portfolioWithPnL.totalUnrealizedPnL,
      virtualBalance: user.virtualBalance,
      totalPnL: user.totalPnL
    });
  } catch (error) {
    console.error('GetPortfolio error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching portfolio'
    });
  }
};

/**
 * @desc    Get trade history (all executed orders)
 * @route   GET /api/portfolio/history
 */
const getTradeHistory = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user._id,
      status: 'EXECUTED'
    })
      .sort({ timestamp: -1 })
      .lean();

    res.json({
      success: true,
      count: orders.length,
      trades: orders
    });
  } catch (error) {
    console.error('GetTradeHistory error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching trade history'
    });
  }
};

module.exports = { getPortfolio, getTradeHistory };
