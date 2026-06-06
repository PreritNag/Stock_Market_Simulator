let ioInstance = null;

/**
 * Initialize Trade Socket Connection
 * @param {Object} io - Socket.IO instance
 */
const initTradeSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined user room: user_${userId}`);
    });
  });
};

/**
 * Broadcast trade execution details to the specific user's socket room
 * @param {String} userId - User id to target
 * @param {Object} tradeData - Execution details (symbol, quantity, price, action, etc.)
 */
const broadcastTradeConfirmation = (userId, tradeData) => {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit('trade_confirmation', tradeData);
    console.log(`Broadcasted trade confirmation to user_${userId}:`, tradeData);
  }
};

module.exports = {
  initTradeSocket,
  broadcastTradeConfirmation
};
