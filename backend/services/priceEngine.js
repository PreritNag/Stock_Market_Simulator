/**
 * Price Engine Service
 * Handles price simulation using random walk algorithm and OHLCV generation
 */

/**
 * Generate a random number in a range
 */
const randomInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

/**
 * Round a number to 2 decimal places
 */
const round2 = (num) => {
  return Math.round(num * 100) / 100;
};

/**
 * Simulate a new price for a stock using random walk algorithm
 * Price changes are bounded within ±3%
 * @param {Object} stock - Mongoose stock document
 * @returns {Object} stock - Updated stock with new price, change, changePercent, and OHLCV candle
 */
const simulatePrice = (stock) => {
  const currentPrice = stock.currentPrice;

  // Random walk: small random % change bounded within ±3%
  const changePercent = randomInRange(-3, 3);
  const priceChange = round2(currentPrice * (changePercent / 100));
  const newPrice = round2(currentPrice + priceChange);

  // Ensure price doesn't go below ₹1
  const finalPrice = Math.max(1, newPrice);

  // Calculate change from previous close (last OHLCV candle)
  const previousClose = stock.ohlcv.length > 0
    ? stock.ohlcv[stock.ohlcv.length - 1].close
    : currentPrice;

  const absoluteChange = round2(finalPrice - previousClose);
  const percentChange = round2((absoluteChange / previousClose) * 100);

  // Update stock fields
  stock.currentPrice = finalPrice;
  stock.change = absoluteChange;
  stock.changePercent = percentChange;
  stock.updatedAt = new Date();

  // Generate and add a new OHLCV candle
  const candle = generateOHLCV(finalPrice);
  stock.ohlcv.push(candle);

  // Keep only the last 500 candles to prevent unbounded growth
  if (stock.ohlcv.length > 500) {
    stock.ohlcv = stock.ohlcv.slice(-500);
  }

  return stock;
};

/**
 * Generate a single OHLCV candle from a base price with realistic variation
 * @param {Number} basePrice - The base/close price
 * @returns {Object} OHLCV candle data
 */
const generateOHLCV = (basePrice) => {
  // Realistic intraday variation (within ±2% of base price)
  const variation = basePrice * 0.02;

  const open = round2(basePrice + randomInRange(-variation, variation));
  const close = round2(basePrice);
  const high = round2(Math.max(open, close) + randomInRange(0, variation));
  const low = round2(Math.min(open, close) - randomInRange(0, variation));
  const volume = Math.floor(randomInRange(100000, 5000000));

  return {
    date: new Date(),
    open: Math.max(1, open),
    high: Math.max(1, high),
    low: Math.max(1, low),
    close: Math.max(1, close),
    volume
  };
};

/**
 * Generate historical OHLCV data for seeding
 * @param {String} symbol - Stock symbol (for logging)
 * @param {Number} days - Number of days of historical data
 * @param {Number} startPrice - Starting base price
 * @returns {Array} Array of OHLCV candle objects
 */
const seedHistoricalData = (symbol, days, startPrice) => {
  const ohlcvData = [];
  let currentPrice = startPrice;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    // Random walk for each day (bounded ±3%)
    const dailyChangePercent = randomInRange(-3, 3);
    const priceChange = currentPrice * (dailyChangePercent / 100);
    currentPrice = round2(Math.max(1, currentPrice + priceChange));

    // Generate intraday variation
    const variation = currentPrice * 0.02;
    const open = round2(currentPrice + randomInRange(-variation, variation));
    const close = round2(currentPrice);
    const high = round2(Math.max(open, close) + randomInRange(0, variation * 1.5));
    const low = round2(Math.min(open, close) - randomInRange(0, variation * 1.5));
    const volume = Math.floor(randomInRange(500000, 10000000));

    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    ohlcvData.push({
      date,
      open: Math.max(1, open),
      high: Math.max(1, high),
      low: Math.max(1, low),
      close: Math.max(1, close),
      volume
    });
  }

  console.log(`Generated ${ohlcvData.length} historical candles for ${symbol} (start: ₹${startPrice}, end: ₹${currentPrice})`);

  return ohlcvData;
};

module.exports = { simulatePrice, generateOHLCV, seedHistoricalData };
