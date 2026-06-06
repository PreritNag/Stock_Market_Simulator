const User = require('../models/User');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');

/**
 * @desc    Get wallet info (balance and total P&L)
 * @route   GET /api/wallet
 */
const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('virtualBalance totalPnL');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      wallet: {
        virtualBalance: user.virtualBalance,
        totalPnL: user.totalPnL
      }
    });
  } catch (error) {
    console.error('GetWallet error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching wallet'
    });
  }
};

/**
 * @desc    Get wallet transaction history (top-ups and trades)
 * @route   GET /api/wallet/transactions
 */
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .lean();

    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('GetTransactions error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching transactions'
    });
  }
};

module.exports = { getWallet, getTransactions };
