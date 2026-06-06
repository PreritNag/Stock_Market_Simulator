const User = require('../models/User');
const Stock = require('../models/Stock');
const Order = require('../models/Order');
const { executeBuyOrder, executeSellOrder } = require('../services/tradingEngine');

/**
 * @desc    Place a new order (BUY or SELL)
 * @route   POST /api/orders
 */
const placeOrder = async (req, res) => {
  try {
    const { symbol, type, qty, orderMode, triggerPrice } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!symbol || !type || !qty) {
      return res.status(400).json({
        success: false,
        message: 'Please provide symbol, type (BUY/SELL), and qty'
      });
    }

    if (!['BUY', 'SELL'].includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Order type must be BUY or SELL'
      });
    }

    const quantity = parseInt(qty);
    if (isNaN(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer'
      });
    }

    // Get current stock price
    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock '${symbol}' not found`
      });
    }

    let result;
    if (type.toUpperCase() === 'BUY') {
      result = await executeBuyOrder(userId, symbol.toUpperCase(), quantity, orderMode, triggerPrice);
    } else {
      result = await executeSellOrder(userId, symbol.toUpperCase(), quantity, orderMode, triggerPrice);
    }

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log(`Order executed: ${type} ${quantity} x ${symbol} @ ₹${result.order.price} for user ${userId}`);

    res.status(201).json({
      success: true,
      order: result.order,
      updatedBalance: result.updatedBalance
    });
  } catch (error) {
    console.error('PlaceOrder error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error placing order'
    });
  }
};

/**
 * @desc    Get all orders for the current user
 * @route   GET /api/orders
 */
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .lean();

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('GetOrders error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching orders'
    });
  }
};

/**
 * @desc    Cancel a pending order
 * @route   PUT /api/orders/:id/cancel
 */
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify the order belongs to the current user
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Only pending orders can be cancelled
    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order with status '${order.status}'. Only PENDING orders can be cancelled.`
      });
    }

    order.status = 'CANCELLED';
    await order.save();

    // If it was a BUY order, refund the balance
    if (order.type === 'BUY') {
      const user = await User.findById(req.user._id);
      user.virtualBalance += order.total;
      await user.save();

      console.log(`Cancelled BUY order ${order._id}, refunded ₹${order.total} to user ${req.user._id}`);
    }

    // If it was a SELL order, return the shares to portfolio
    if (order.type === 'SELL') {
      const user = await User.findById(req.user._id);
      const holdingIndex = user.portfolio.findIndex(h => h.symbol === order.symbol);

      if (holdingIndex >= 0) {
        user.portfolio[holdingIndex].qty += order.qty;
      } else {
        user.portfolio.push({
          symbol: order.symbol,
          qty: order.qty,
          avgPrice: order.price
        });
      }
      await user.save();

      console.log(`Cancelled SELL order ${order._id}, returned ${order.qty} shares of ${order.symbol} to user ${req.user._id}`);
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('CancelOrder error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling order'
    });
  }
};

module.exports = { placeOrder, getOrders, cancelOrder };
