/**
 * Price Socket Module
 * Real-time price updates via Socket.IO
 */

const Stock = require('../models/Stock');
const Alert = require('../models/Alert');
const { simulatePrice } = require('../services/priceEngine');
const { processPendingOrders } = require('../services/tradingEngine');
const { sendPushNotification } = require('../utils/pushNotifier');

/**
 * Check and trigger pending price alerts
 */
const checkAndTriggerAlerts = async (symbol, currentPrice, io) => {
  try {
    const alerts = await Alert.find({ symbol, status: 'PENDING' });
    if (alerts.length === 0) return;

    for (const alert of alerts) {
      let trigger = false;
      const { criteriaType, value, userId } = alert;

      if (criteriaType === 'PRICE_ABOVE' && currentPrice >= value) {
        trigger = true;
      } else if (criteriaType === 'PRICE_BELOW' && currentPrice <= value) {
        trigger = true;
      }

      if (trigger) {
        alert.status = 'TRIGGERED';
        alert.triggeredAt = new Date();
        await alert.save();

        io.to(`user_${userId}`).emit('alert_triggered', {
          id: alert._id,
          symbol,
          criteriaType,
          value,
          currentPrice,
          triggeredAt: alert.triggeredAt
        });

        // Trigger Web Push desktop notification
        const criteriaText = criteriaType === 'PRICE_ABOVE' ? 'rose above' : 'dropped below';
        sendPushNotification(
          userId,
          `Price Alert Triggered: ${symbol}`,
          `${symbol} has ${criteriaText} your target of ₹${value.toFixed(2)}. Current price: ₹${currentPrice.toFixed(2)}.`,
          { url: `/trade/${symbol}` }
        );

        console.log(`Alert triggered: ${symbol} ${criteriaType} ${value} @ ₹${currentPrice} for user ${userId}`);
      }
    }
  } catch (error) {
    console.error('checkAndTriggerAlerts error:', error.message);
  }
};

/**
 * Initialize the price update socket
 * @param {Object} io - Socket.IO server instance
 */
const initPriceSocket = (io) => {
  // Track subscriptions per socket
  const subscriptions = new Map();

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    subscriptions.set(socket.id, new Set());

    // Handle subscribe to specific stock symbol
    socket.on('subscribe', async (symbol) => {
      try {
        const upperSymbol = symbol.toUpperCase();
        const subs = subscriptions.get(socket.id);
        if (subs) {
          subs.add(upperSymbol);
        }

        // Join a room for the symbol
        socket.join(upperSymbol);

        // Emit the stock's full OHLCV data to this client
        const stock = await Stock.findOne({ symbol: upperSymbol });
        if (stock) {
          socket.emit('stockData', {
            symbol: stock.symbol,
            name: stock.name,
            currentPrice: stock.currentPrice,
            change: stock.change,
            changePercent: stock.changePercent,
            ohlcv: stock.ohlcv
          });
          console.log(`Client ${socket.id} subscribed to ${upperSymbol}`);
        } else {
          socket.emit('error', { message: `Stock '${upperSymbol}' not found` });
        }
      } catch (error) {
        console.error(`Subscribe error for ${socket.id}:`, error.message);
        socket.emit('error', { message: 'Error subscribing to stock' });
      }
    });

    // Handle unsubscribe from specific stock symbol
    socket.on('unsubscribe', (symbol) => {
      try {
        const upperSymbol = symbol.toUpperCase();
        const subs = subscriptions.get(socket.id);
        if (subs) {
          subs.delete(upperSymbol);
        }

        socket.leave(upperSymbol);
        console.log(`Client ${socket.id} unsubscribed from ${upperSymbol}`);
      } catch (error) {
        console.error(`Unsubscribe error for ${socket.id}:`, error.message);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      subscriptions.delete(socket.id);
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Price update loop: recursive setTimeout instead of setInterval to prevent overlaps
  let priceUpdateTimeout;

  const runPriceUpdate = async () => {
    try {
      const stocks = await Stock.find({});

      if (stocks.length > 0) {
        const updatedStocks = [];

        // Save stocks in parallel to prevent sequential database bottlenecks
        await Promise.all(stocks.map(async (stock) => {
          // Simulate new price
          simulatePrice(stock);
          
          // Direct updateOne query bypasses Mongoose version mismatch warnings
          await Stock.updateOne(
            { _id: stock._id },
            {
              $set: {
                currentPrice: stock.currentPrice,
                change: stock.change,
                changePercent: stock.changePercent,
                ohlcv: stock.ohlcv,
                updatedAt: stock.updatedAt
              }
            }
          );

          // Process limit/stop orders for this symbol
          await processPendingOrders(stock.symbol, stock.currentPrice);

          // Process price alerts for this symbol
          await checkAndTriggerAlerts(stock.symbol, stock.currentPrice, io);

          updatedStocks.push({
            symbol: stock.symbol,
            name: stock.name,
            currentPrice: stock.currentPrice,
            change: stock.change,
            changePercent: stock.changePercent,
            sector: stock.sector,
            market: stock.market,
            updatedAt: stock.updatedAt
          });

          // Emit the latest candle to subscribers of this specific stock
          const latestCandle = stock.ohlcv.length > 0 ? stock.ohlcv[stock.ohlcv.length - 1] : null;
          if (latestCandle) {
            io.to(stock.symbol).emit('candleUpdate', {
              symbol: stock.symbol,
              candle: latestCandle,
              currentPrice: stock.currentPrice,
              change: stock.change,
              changePercent: stock.changePercent
            });
          }
        }));

        // Emit all updated prices to all connected clients
        io.emit('priceUpdate', updatedStocks);
      }
    } catch (error) {
      console.error('Price update error:', error.message);
    } finally {
      // Schedule next run only after the current update is fully completed
      priceUpdateTimeout = setTimeout(runPriceUpdate, 1000);
    }
  };

  // Start the simulation loop
  priceUpdateTimeout = setTimeout(runPriceUpdate, 1000);

  // Cleanup on server shutdown
  process.on('SIGINT', () => {
    clearTimeout(priceUpdateTimeout);
    console.log('Price update timeout cleared');
  });

  process.on('SIGTERM', () => {
    clearTimeout(priceUpdateTimeout);
    console.log('Price update timeout cleared');
  });

  console.log('Price socket initialized - updating every 1 second');
};

module.exports = { initPriceSocket };
