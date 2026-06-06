/**
 * Technical Indicator Calculations for Frontend Charting
 */

// Helper: Simple Moving Average (SMA)
export const calculateSMA = (prices, period) => {
  const sma = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((acc, p) => acc + p, 0);
      sma.push(Math.round((sum / period) * 100) / 100);
    }
  }
  return sma;
};

// Helper: Exponential Moving Average (EMA)
export const calculateEMA = (prices, period) => {
  const ema = [];
  if (prices.length === 0) return ema;

  const multiplier = 2 / (period + 1);
  
  // First value is simple average
  const firstSma = prices.slice(0, period).reduce((acc, p) => acc + p, 0) / period;
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      ema.push(null);
    } else if (i === period - 1) {
      ema.push(Math.round(firstSma * 100) / 100);
    } else {
      const val = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
      ema.push(Math.round(val * 100) / 100);
    }
  }
  return ema;
};

// Relative Strength Index (RSI)
export const calculateRSI = (prices, period = 14) => {
  const rsi = [];
  if (prices.length < period) {
    return Array(prices.length).fill(null);
  }

  let gains = 0;
  let losses = 0;

  // First RSI value based on simple averages
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      rsi.push(null);
    } else if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(Math.round((100 - 100 / (1 + rs)) * 100) / 100);
    } else {
      const diff = prices[i] - prices[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(Math.round((100 - 100 / (1 + rs)) * 100) / 100);
    }
  }
  return rsi;
};

// MACD (12, 26, Signal 9)
export const calculateMACD = (prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const macd = [];
  if (prices.length < slowPeriod) {
    return Array(prices.length).fill({ macd: null, signal: null, histogram: null });
  }

  const fastEma = calculateEMA(prices, fastPeriod);
  const slowEma = calculateEMA(prices, slowPeriod);

  const macdValues = [];
  for (let i = 0; i < prices.length; i++) {
    if (fastEma[i] === null || slowEma[i] === null) {
      macdValues.push(null);
    } else {
      macdValues.push(fastEma[i] - slowEma[i]);
    }
  }

  // Filter out nulls to calculate signal EMA
  const validMacdValues = macdValues.filter(v => v !== null);
  const validSignalValues = calculateEMA(validMacdValues, signalPeriod);

  // Map back to match original array index
  let signalIdx = 0;
  for (let i = 0; i < prices.length; i++) {
    if (macdValues[i] === null || i < (slowPeriod + signalPeriod - 2)) {
      macd.push({ macd: null, signal: null, histogram: null });
    } else {
      const macdVal = Math.round(macdValues[i] * 100) / 100;
      const sigVal = Math.round(validSignalValues[signalIdx] * 100) / 100;
      const histVal = Math.round((macdVal - sigVal) * 100) / 100;
      macd.push({ macd: macdVal, signal: sigVal, histogram: histVal });
      signalIdx++;
    }
  }
  return macd;
};

// Bollinger Bands (20, 2)
export const calculateBollingerBands = (prices, period = 20, multiplier = 2) => {
  const bb = [];
  const basis = calculateSMA(prices, period);

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      bb.push({ upper: null, middle: null, lower: null });
    } else {
      const mean = basis[i];
      const slice = prices.slice(i - period + 1, i + 1);
      const variance = slice.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      const upper = Math.round((mean + multiplier * stdDev) * 100) / 100;
      const lower = Math.round((mean - multiplier * stdDev) * 100) / 100;

      bb.push({ upper, middle: mean, lower });
    }
  }
  return bb;
};

// Stochastic RSI (14, 3, 3)
export const calculateStochasticRSI = (prices, period = 14, kPeriod = 3, dPeriod = 3) => {
  const rsi = calculateRSI(prices, period);
  const stochRsiK = [];
  
  for (let i = 0; i < rsi.length; i++) {
    if (i < (period * 2) - 2) {
      stochRsiK.push(null);
    } else {
      const slice = rsi.slice(i - period + 1, i + 1);
      const validSlice = slice.filter(v => v !== null);
      if (validSlice.length < period) {
        stochRsiK.push(null);
        continue;
      }
      
      const minRsi = Math.min(...validSlice);
      const maxRsi = Math.max(...validSlice);
      
      const currentRsi = rsi[i];
      const k = maxRsi === minRsi ? 0 : ((currentRsi - minRsi) / (maxRsi - minRsi)) * 100;
      stochRsiK.push(k);
    }
  }

  // Smooth %K with a SMA
  const validKValues = stochRsiK.map(v => v === null ? 0 : v);
  const percentK = calculateSMA(validKValues, kPeriod);
  
  // Smooth %K to get %D
  const validPercentK = percentK.map(v => v === null ? 0 : v);
  const percentD = calculateSMA(validPercentK, dPeriod);

  const result = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < (period * 2) - 2) {
      result.push({ k: null, d: null });
    } else {
      result.push({
        k: Math.round(percentK[i] * 100) / 100,
        d: Math.round(percentD[i] * 100) / 100
      });
    }
  }
  return result;
};

// Average True Range (ATR)
export const calculateATR = (candles, period = 14) => {
  const atr = [];
  if (candles.length === 0) return atr;

  const tr = [candles[0].high - candles[0].low]; // First TR is High - Low
  
  for (let i = 1; i < candles.length; i++) {
    const highLow = candles[i].high - candles[i].low;
    const highPrevClose = Math.abs(candles[i].high - candles[i - 1].close);
    const lowPrevClose = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(highLow, highPrevClose, lowPrevClose));
  }

  // First ATR is the average of first 14 TR values
  const firstAtr = tr.slice(0, period).reduce((acc, t) => acc + t, 0) / period;

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      atr.push(null);
    } else if (i === period - 1) {
      atr.push(Math.round(firstAtr * 100) / 100);
    } else {
      const val = (atr[i - 1] * (period - 1) + tr[i]) / period;
      atr.push(Math.round(val * 100) / 100);
    }
  }
  return atr;
};

// Convert standard candles to Heikin Ashi candles
export const convertToHeikinAshi = (candles) => {
  const haCandles = [];
  if (candles.length === 0) return haCandles;

  // First HA candle
  let prevOpen = candles[0].open;
  let prevClose = candles[0].close;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    
    // Close = (Open + High + Low + Close) / 4
    const close = (c.open + c.high + c.low + c.close) / 4;
    
    // Open = (prevOpen + prevClose) / 2
    const open = i === 0 ? (c.open + c.close) / 2 : (prevOpen + prevClose) / 2;
    
    // High = Max(High, Open, Close)
    const high = Math.max(c.high, open, close);
    
    // Low = Min(Low, Open, Close)
    const low = Math.min(c.low, open, close);

    haCandles.push({
      time: c.time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: c.volume
    });

    prevOpen = open;
    prevClose = close;
  }

  return haCandles;
};

// Renko Bricks calculation
export const calculateRenko = (candles, brickSize = 5) => {
  if (candles.length === 0) return [];
  const renko = [];

  // Start with first candle's close
  let prevClose = candles[0].close;
  
  // Estimate timeframe interval to space out Renko bricks
  const interval = candles.length > 1 ? (candles[1].time - candles[0].time) : 86400;
  let renkoTime = candles[0].time;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const diff = c.close - prevClose;
    const numBricks = Math.floor(Math.abs(diff) / brickSize);

    if (numBricks > 0) {
      const direction = diff > 0 ? 1 : -1;
      for (let j = 0; j < numBricks; j++) {
        const open = prevClose;
        const close = prevClose + direction * brickSize;
        const high = direction > 0 ? close : open;
        const low = direction > 0 ? open : close;

        renkoTime += interval;

        renko.push({
          time: renkoTime,
          open: Math.round(open * 100) / 100,
          high: Math.round(high * 100) / 100,
          low: Math.round(low * 100) / 100,
          close: Math.round(close * 100) / 100,
          volume: Math.round(c.volume / numBricks),
        });

        prevClose = close;
      }
    }
  }

  return renko;
};

