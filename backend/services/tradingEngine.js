/**
 * Trading Engine Service
 * Core trading logic for buy/sell orders and P&L calculations
 */

const User = require('../models/User');
const Stock = require('../models/Stock');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const { broadcastTradeConfirmation } = require('../sockets/tradeSocket');

/**
 * Execute a BUY order
 * - Checks balance
 * - Deducts from virtual balance
 * - Updates portfolio (avgPrice calculation if holding exists)
 * - Creates order record
 * - Adds order to user's trades
 *
 * @param {String} userId - User's MongoDB ObjectId
 * @param {String} symbol - Stock symbol (uppercase)
 * @param {Number} qty - Quantity to buy
 * @returns {Object} { success, order, updatedBalance } or { success: false, message }
 */
const executeBuyOrder = async (userId, symbol, qty, orderMode = 'MARKET', triggerPrice = null) => {
  try {
    // Get current stock price
    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return { success: false, message: `Stock '${symbol}' not found` };
    }

    const price = stock.currentPrice;
    const orderPrice = orderMode === 'MARKET' ? price : Number(triggerPrice);
    const totalCost = Math.round(orderPrice * qty * 100) / 100;

    // Get user and check balance
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.virtualBalance < totalCost) {
      return {
        success: false,
        message: `Insufficient balance. Required: ₹${totalCost.toFixed(2)}, Available: ₹${user.virtualBalance.toFixed(2)}`
      };
    }

    // Deduct balance (lock funds)
    user.virtualBalance = Math.round((user.virtualBalance - totalCost) * 100) / 100;

    const isPending = orderMode !== 'MARKET' && 
      ((orderMode === 'LIMIT' && price > triggerPrice) || 
       (orderMode === 'STOP' && price < triggerPrice));

    let order;

    if (isPending) {
      // Create pending order record
      order = await Order.create({
        userId,
        symbol,
        type: 'BUY',
        qty,
        price: orderPrice, // limit price
        total: totalCost,
        status: 'PENDING',
        orderMode,
        triggerPrice,
        pnl: 0,
        timestamp: new Date()
      });
      user.trades.push(order._id);
      await user.save();

      console.log(`BUY pending placed: ${qty} x ${symbol} @ Limit/Stop ₹${triggerPrice}. Balance: ₹${user.virtualBalance}`);
      return {
        success: true,
        order: order.toObject(),
        updatedBalance: user.virtualBalance
      };
    }

    // Execute immediately
    // Update portfolio
    const existingHolding = user.portfolio.find(h => h.symbol === symbol);
    if (existingHolding) {
      const oldTotal = existingHolding.avgPrice * existingHolding.qty;
      const newTotal = price * qty;
      const totalQty = existingHolding.qty + qty;
      existingHolding.avgPrice = Math.round(((oldTotal + newTotal) / totalQty) * 100) / 100;
      existingHolding.qty = totalQty;
    } else {
      user.portfolio.push({
        symbol,
        qty,
        avgPrice: price
      });
    }

    // Create order record
    order = await Order.create({
      userId,
      symbol,
      type: 'BUY',
      qty,
      price,
      total: totalCost,
      status: 'EXECUTED',
      orderMode,
      triggerPrice,
      pnl: 0,
      timestamp: new Date()
    });

    // Record Transaction
    await Transaction.create({
      userId,
      type: 'TRADE_BUY',
      amount: totalCost,
      description: `Bought ${qty} shares of ${symbol} @ ₹${price.toFixed(2)}`,
      status: 'COMPLETED',
      timestamp: order.timestamp
    });

    // Broadcast trade confirmation
    broadcastTradeConfirmation(userId, {
      type: 'BUY',
      symbol,
      qty,
      price,
      total: totalCost,
      timestamp: order.timestamp
    });

    user.trades.push(order._id);
    await user.save();

    console.log(`BUY executed immediately: ${qty} x ${symbol} @ ₹${price} = ₹${totalCost}. Balance: ₹${user.virtualBalance}`);

    return {
      success: true,
      order: order.toObject(),
      updatedBalance: user.virtualBalance
    };
  } catch (error) {
    console.error('executeBuyOrder error:', error.message);
    return { success: false, message: 'Error executing buy order' };
  }
};

const executeSellOrder = async (userId, symbol, qty, orderMode = 'MARKET', triggerPrice = null) => {
  try {
    // Get current stock price
    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return { success: false, message: `Stock '${symbol}' not found` };
    }

    const price = stock.currentPrice;
    const orderPrice = orderMode === 'MARKET' ? price : Number(triggerPrice);

    // Get user and check holdings
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const holdingIndex = user.portfolio.findIndex(h => h.symbol === symbol);
    if (holdingIndex === -1) {
      return {
        success: false,
        message: `You don't hold any shares of ${symbol}`
      };
    }

    const holding = user.portfolio[holdingIndex];
    if (holding.qty < qty) {
      return {
        success: false,
        message: `Insufficient shares. You hold ${holding.qty} shares of ${symbol}, tried to sell ${qty}`
      };
    }

    const originalAvgPrice = holding.avgPrice;

    // Deduct holdings (lock shares) immediately
    if (holding.qty === qty) {
      user.portfolio.splice(holdingIndex, 1);
    } else {
      holding.qty -= qty;
    }

    const isPending = orderMode !== 'MARKET' && 
      ((orderMode === 'LIMIT' && price < triggerPrice) || 
       (orderMode === 'STOP' && price > triggerPrice));

    let order;

    if (isPending) {
      // Create pending order record, storing original average price in `price` to know the cost basis for realized P&L later
      const totalProceeds = Math.round(orderPrice * qty * 100) / 100;
      order = await Order.create({
        userId,
        symbol,
        type: 'SELL',
        qty,
        price: originalAvgPrice, // Store original cost basis price here
        total: totalProceeds,
        status: 'PENDING',
        orderMode,
        triggerPrice,
        pnl: 0,
        timestamp: new Date()
      });
      user.trades.push(order._id);
      await user.save();

      console.log(`SELL pending placed: ${qty} x ${symbol} @ Limit/Stop ₹${triggerPrice}. Shares locked.`);
      return {
        success: true,
        order: order.toObject(),
        updatedBalance: user.virtualBalance
      };
    }

    // Execute immediately
    const totalProceeds = Math.round(price * qty * 100) / 100;
    const costBasis = originalAvgPrice * qty;
    const pnl = Math.round((totalProceeds - costBasis) * 100) / 100;

    // Add proceeds to balance
    user.virtualBalance = Math.round((user.virtualBalance + totalProceeds) * 100) / 100;
    user.totalPnL = Math.round((user.totalPnL + pnl) * 100) / 100;

    order = await Order.create({
      userId,
      symbol,
      type: 'SELL',
      qty,
      price,
      total: totalProceeds,
      status: 'EXECUTED',
      orderMode,
      triggerPrice,
      pnl,
      timestamp: new Date()
    });

    // Record Transaction
    await Transaction.create({
      userId,
      type: 'TRADE_SELL',
      amount: totalProceeds,
      description: `Sold ${qty} shares of ${symbol} @ ₹${price.toFixed(2)}`,
      status: 'COMPLETED',
      timestamp: order.timestamp
    });

    // Broadcast trade confirmation
    broadcastTradeConfirmation(userId, {
      type: 'SELL',
      symbol,
      qty,
      price,
      total: totalProceeds,
      pnl,
      timestamp: order.timestamp
    });

    user.trades.push(order._id);
    await user.save();

    console.log(`SELL executed immediately: ${qty} x ${symbol} @ ₹${price} = ₹${totalProceeds}. Balance: ₹${user.virtualBalance}`);

    return {
      success: true,
      order: order.toObject(),
      updatedBalance: user.virtualBalance
    };
  } catch (error) {
    console.error('executeSellOrder error:', error.message);
    return { success: false, message: 'Error executing sell order' };
  }
};

const processPendingOrders = async (symbol, currentPrice) => {
  try {
    const pendingOrders = await Order.find({ symbol, status: 'PENDING' });
    if (pendingOrders.length === 0) return;

    for (const order of pendingOrders) {
      let trigger = false;
      const { triggerPrice, orderMode, type, qty, userId } = order;

      if (type === 'BUY') {
        if (orderMode === 'LIMIT' && currentPrice <= triggerPrice) {
          trigger = true;
        } else if (orderMode === 'STOP' && currentPrice >= triggerPrice) {
          trigger = true;
        }
      } else if (type === 'SELL') {
        if (orderMode === 'LIMIT' && currentPrice >= triggerPrice) {
          trigger = true;
        } else if (orderMode === 'STOP' && currentPrice <= triggerPrice) {
          trigger = true;
        }
      }

      if (trigger) {
        const user = await User.findById(userId);
        if (!user) continue;

        if (type === 'BUY') {
          // Funds were already locked (deducted) at placement time, but execute at currentPrice and refund the difference
          const limitTotal = order.total;
          const actualTotal = Math.round(currentPrice * qty * 100) / 100;
          const refund = Math.round((limitTotal - actualTotal) * 100) / 100;

          if (refund > 0) {
            user.virtualBalance = Math.round((user.virtualBalance + refund) * 100) / 100;
          }

          const existingHolding = user.portfolio.find(h => h.symbol === symbol);
          if (existingHolding) {
            const oldTotal = existingHolding.avgPrice * existingHolding.qty;
            const newTotal = currentPrice * qty;
            const totalQty = existingHolding.qty + qty;
            existingHolding.avgPrice = Math.round(((oldTotal + newTotal) / totalQty) * 100) / 100;
            existingHolding.qty = totalQty;
          } else {
            user.portfolio.push({
              symbol,
              qty,
              avgPrice: currentPrice
            });
          }

          order.status = 'EXECUTED';
          order.price = currentPrice;
          order.total = actualTotal;
          order.timestamp = new Date();
          await order.save();

          await Transaction.create({
            userId,
            type: 'TRADE_BUY',
            amount: actualTotal,
            description: `Limit/Stop BUY executed: ${qty} shares of ${symbol} @ ₹${currentPrice.toFixed(2)}`,
            status: 'COMPLETED',
            timestamp: order.timestamp
          });

          broadcastTradeConfirmation(userId, {
            type: 'BUY',
            symbol,
            qty,
            price: currentPrice,
            total: actualTotal,
            timestamp: order.timestamp
          });

          await user.save();
          console.log(`Pending BUY executed for user ${userId}: ${qty} ${symbol} @ ₹${currentPrice}`);

        } else if (type === 'SELL') {
          // Shares were already locked (deducted) at placement. order.price contains original avgPrice (cost basis)
          const actualTotal = Math.round(currentPrice * qty * 100) / 100;
          const costBasis = order.price * qty;
          const pnl = Math.round((actualTotal - costBasis) * 100) / 100;

          user.virtualBalance = Math.round((user.virtualBalance + actualTotal) * 100) / 100;
          user.totalPnL = Math.round((user.totalPnL + pnl) * 100) / 100;

          order.status = 'EXECUTED';
          order.price = currentPrice;
          order.total = actualTotal;
          order.pnl = pnl;
          order.timestamp = new Date();
          await order.save();

          await Transaction.create({
            userId,
            type: 'TRADE_SELL',
            amount: actualTotal,
            description: `Limit/Stop SELL executed: ${qty} shares of ${symbol} @ ₹${currentPrice.toFixed(2)}`,
            status: 'COMPLETED',
            timestamp: order.timestamp
          });

          broadcastTradeConfirmation(userId, {
            type: 'SELL',
            symbol,
            qty,
            price: currentPrice,
            total: actualTotal,
            pnl,
            timestamp: order.timestamp
          });

          await user.save();
          console.log(`Pending SELL executed for user ${userId}: ${qty} ${symbol} @ ₹${currentPrice}`);
        }
      }
    }
  } catch (error) {
    console.error('processPendingOrders error:', error.message);
  }
};

const calculatePortfolioPnL = async (user) => {
  try {
    const holdings = [];
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalUnrealizedPnL = 0;

    for (const holding of user.portfolio) {
      const stock = await Stock.findOne({ symbol: holding.symbol })
        .select('symbol name currentPrice change changePercent');

      const currentPrice = stock ? stock.currentPrice : holding.avgPrice;
      const investedValue = Math.round(holding.avgPrice * holding.qty * 100) / 100;
      const currentValue = Math.round(currentPrice * holding.qty * 100) / 100;
      const unrealizedPnL = Math.round((currentValue - investedValue) * 100) / 100;
      const unrealizedPnLPercent = investedValue > 0
        ? Math.round((unrealizedPnL / investedValue) * 10000) / 100
        : 0;

      holdings.push({
        symbol: holding.symbol,
        name: stock ? stock.name : holding.symbol,
        qty: holding.qty,
        avgPrice: holding.avgPrice,
        currentPrice,
        investedValue,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent,
        change: stock ? stock.change : 0,
        changePercent: stock ? stock.changePercent : 0
      });

      totalInvested += investedValue;
      totalCurrentValue += currentValue;
      totalUnrealizedPnL += unrealizedPnL;
    }

    return {
      holdings,
      totalInvested: Math.round(totalInvested * 100) / 100,
      totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
      totalUnrealizedPnL: Math.round(totalUnrealizedPnL * 100) / 100
    };
  } catch (error) {
    console.error('calculatePortfolioPnL error:', error.message);
    return {
      holdings: [],
      totalInvested: 0,
      totalCurrentValue: 0,
      totalUnrealizedPnL: 0
    };
  }
};

module.exports = { executeBuyOrder, executeSellOrder, calculatePortfolioPnL, processPendingOrders };
