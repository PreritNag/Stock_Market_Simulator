/**
 * Stock Seeder
 * Seeds 20 Indian NSE stocks with 365 days of historical OHLCV data
 */

require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const Stock = require('../models/Stock');
const { seedHistoricalData } = require('../services/priceEngine');

// diversified symbols including stocks, ETFs, Forex, Crypto, and Indices
const STOCKS = [
  // Stocks
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy', basePrice: 2500, category: 'STOCK', peRatio: 26.4, dividendYield: 0.8, marketCap: 1750000 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'IT', basePrice: 3500, category: 'STOCK', peRatio: 28.1, dividendYield: 1.4, marketCap: 1280000 },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT', basePrice: 1500, category: 'STOCK', peRatio: 24.5, dividendYield: 2.1, marketCap: 620000 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', basePrice: 1600, category: 'STOCK', peRatio: 18.2, dividendYield: 1.1, marketCap: 1210000 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', basePrice: 1050, category: 'STOCK', peRatio: 17.5, dividendYield: 0.9, marketCap: 730000 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', basePrice: 620, category: 'STOCK', peRatio: 9.8, dividendYield: 1.8, marketCap: 550000 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Consumer Goods', basePrice: 2800, category: 'STOCK', peRatio: 52.4, dividendYield: 1.5, marketCap: 268000 },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', basePrice: 440, category: 'STOCK', peRatio: 24.2, dividendYield: 2.7, marketCap: 510000 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', sector: 'Automobile', basePrice: 10500, category: 'STOCK', peRatio: 29.8, dividendYield: 1.1, marketCap: 310000 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd', sector: 'Pharma', basePrice: 1200, category: 'STOCK', peRatio: 33.1, dividendYield: 0.9, marketCap: 280000 },

  // ETFs
  { symbol: 'NIFTYBEES', name: 'Nippon India Nifty 50 ETF', sector: 'Exchange Traded Fund', basePrice: 250, category: 'ETF', peRatio: null, dividendYield: 0.6, marketCap: 18000 },
  { symbol: 'GOLDBEES', name: 'Nippon India Gold ETF', sector: 'Exchange Traded Fund', basePrice: 60, category: 'ETF', peRatio: null, dividendYield: null, marketCap: 9500 },

  // Forex
  { symbol: 'USDINR', name: 'US Dollar / Indian Rupee', sector: 'Currency', basePrice: 83.5, category: 'FOREX', peRatio: null, dividendYield: null, marketCap: null },
  { symbol: 'EURINR', name: 'Euro / Indian Rupee', sector: 'Currency', basePrice: 90.2, category: 'FOREX', peRatio: null, dividendYield: null, marketCap: null },

  // Crypto
  { symbol: 'BTCINR', name: 'Bitcoin / Indian Rupee', sector: 'Cryptocurrency', basePrice: 5800000, category: 'CRYPTO', peRatio: null, dividendYield: null, marketCap: 110000000 },
  { symbol: 'ETHINR', name: 'Ethereum / Indian Rupee', sector: 'Cryptocurrency', basePrice: 300000, category: 'CRYPTO', peRatio: null, dividendYield: null, marketCap: 36000000 },

  // Indices
  { symbol: 'NIFTY50', name: 'Nifty 50 Index', sector: 'Index', basePrice: 22500, category: 'INDEX', peRatio: 22.8, dividendYield: 1.2, marketCap: null },
  { symbol: 'SENSEX', name: 'BSE Sensex Index', sector: 'Index', basePrice: 74000, category: 'INDEX', peRatio: 23.4, dividendYield: 1.1, marketCap: null }
];

const seedStocks = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI not found in environment. Make sure ../.env exists with MONGO_URI set.');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, { dbName: 'stock_simulator' });
    console.log('MongoDB connected successfully');

    // Clear existing stocks
    const deletedCount = await Stock.deleteMany({});
    console.log(`Cleared ${deletedCount.deletedCount} existing stocks`);

    console.log(`\nSeeding ${STOCKS.length} diversified assets with historical data...\n`);

    for (let i = 0; i < STOCKS.length; i++) {
      const stockData = STOCKS[i];

      console.log(`[${i + 1}/${STOCKS.length}] Seeding ${stockData.symbol} - ${stockData.name}...`);

      // Generate 365 days of historical OHLCV data
      const ohlcvData = seedHistoricalData(stockData.symbol, 365, stockData.basePrice);

      // Set current price from the last candle's close
      const lastCandle = ohlcvData[ohlcvData.length - 1];
      const currentPrice = lastCandle.close;

      // Calculate daily change from second-to-last candle
      const prevCandle = ohlcvData.length >= 2 ? ohlcvData[ohlcvData.length - 2] : lastCandle;
      const change = Math.round((currentPrice - prevCandle.close) * 100) / 100;
      const changePercent = Math.round((change / prevCandle.close) * 10000) / 100;

      // Create stock document
      const stock = await Stock.create({
        symbol: stockData.symbol,
        name: stockData.name,
        sector: stockData.sector,
        market: stockData.category === 'FOREX' || stockData.category === 'CRYPTO' ? 'GLOBAL' : 'NSE',
        currentPrice,
        change,
        changePercent,
        category: stockData.category || 'STOCK',
        peRatio: stockData.peRatio || null,
        dividendYield: stockData.dividendYield || null,
        marketCap: stockData.marketCap || null,
        volume: lastCandle.volume || 0,
        ohlcv: ohlcvData,
        updatedAt: new Date()
      });

      console.log(`  ✓ ${stock.symbol}: ₹${currentPrice} (${changePercent >= 0 ? '+' : ''}${changePercent}%) | ${ohlcvData.length} candles`);
    }

    console.log(`\n✅ Successfully seeded ${STOCKS.length} stocks!`);
    console.log('Stock seeding complete. Disconnecting...\n');

    await mongoose.disconnect();
    console.log('MongoDB disconnected. Seeder finished.');
    process.exit(0);
  } catch (error) {
    console.error('Seeder error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run seeder
seedStocks();
