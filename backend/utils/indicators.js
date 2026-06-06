/**
 * Technical Indicators utility functions
 * Calculates RSI, MACD, and Bollinger Bands from close prices.
 */

/**
 * Calculates Simple Moving Average (SMA)
 */
function calculateSMA(prices, period) {
  const sma = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
function calculateEMA(prices, period) {
  const ema = [];
  if (prices.length === 0) return ema;

  const k = 2 / (period + 1);
  let prevEma = prices[0]; // Seed EMA with first price
  ema.push(prevEma);

  for (let i = 1; i < prices.length; i++) {
    const curEma = prices[i] * k + prevEma * (1 - k);
    ema.push(curEma);
    prevEma = curEma;
  }

  // Nullify initial values that are before the full period is reached to be mathematically strict,
  // or keep them. Let's keep them as estimates but nullify the first (period-1) for a clean chart starting point.
  for (let i = 0; i < Math.min(period - 1, prices.length); i++) {
    ema[i] = null;
  }
  return ema;
}

/**
 * Calculates Relative Strength Index (RSI) - Wilder's Smoothing
 */
function calculateRSI(prices, period = 14) {
  const rsi = [];
  if (prices.length <= period) {
    return Array(prices.length).fill(null);
  }

  // Pre-fill initial periods with null
  for (let i = 0; i < period; i++) {
    rsi.push(null);
  }

  let gains = 0;
  let losses = 0;

  // First RSI value (Simple Average)
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - 100 / (1 + rs));

  // Remaining values (smoothed)
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    let curGain = diff > 0 ? diff : 0;
    let curLoss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + curGain) / period;
    avgLoss = (avgLoss * (period - 1) + curLoss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + rs));
  }

  return rsi;
}

/**
 * Calculates MACD (Moving Average Convergence Divergence)
 */
function calculateMACD(prices, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
  const macdValues = [];
  if (prices.length < longPeriod) {
    return Array(prices.length).fill(null);
  }

  const shortEma = calculateEMA(prices, shortPeriod);
  const longEma = calculateEMA(prices, longPeriod);

  // Compute MACD Line = EMA_12 - EMA_26
  const macdLine = [];
  for (let i = 0; i < prices.length; i++) {
    if (shortEma[i] === null || longEma[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(shortEma[i] - longEma[i]);
    }
  }

  // Compute Signal Line = EMA_9 of MACD Line
  // To calculate EMA of MACD Line, we extract the non-null parts
  const firstNonNullIndex = macdLine.findIndex(val => val !== null);
  const validMacdPart = macdLine.slice(firstNonNullIndex);
  const validSignalPart = calculateEMA(validMacdPart, signalPeriod);

  // Re-align Signal Line and calculate Histogram
  const signalLine = Array(firstNonNullIndex).fill(null).concat(validSignalPart);

  for (let i = 0; i < prices.length; i++) {
    if (macdLine[i] === null || signalLine[i] === null) {
      macdValues.push({
        macd: null,
        signal: null,
        histogram: null
      });
    } else {
      macdValues.push({
        macd: macdLine[i],
        signal: signalLine[i],
        histogram: macdLine[i] - signalLine[i]
      });
    }
  }

  return macdValues;
}

/**
 * Calculates Bollinger Bands (BB)
 */
function calculateBollingerBands(prices, period = 20, multiplier = 2) {
  const bb = [];
  if (prices.length < period) {
    return Array(prices.length).fill(null);
  }

  const sma = calculateSMA(prices, period);

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      bb.push({
        upper: null,
        middle: null,
        lower: null
      });
    } else {
      const currentSma = sma[i];
      // Calculate standard deviation
      const sumSqDiff = prices.slice(i - period + 1, i + 1).reduce((acc, val) => {
        const diff = val - currentSma;
        return acc + diff * diff;
      }, 0);
      const stdDev = Math.sqrt(sumSqDiff / period);

      bb.push({
        upper: currentSma + multiplier * stdDev,
        middle: currentSma,
        lower: currentSma - multiplier * stdDev
      });
    }
  }

  return bb;
}

module.exports = {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands
};
