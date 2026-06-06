const Stock = require('../models/Stock');

/**
 * @desc    Get all stocks (summary view without full OHLCV)
 * @route   GET /api/stocks
 */
const getAllStocks = async (req, res) => {
  try {
    const stocks = await Stock.find({})
      .select('symbol name currentPrice change changePercent sector market category marketCap volume updatedAt')
      .sort({ symbol: 1 });

    res.json({
      success: true,
      count: stocks.length,
      stocks
    });
  } catch (error) {
    console.error('GetAllStocks error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching stocks'
    });
  }
};

/**
 * @desc    Get a single stock by symbol (full data including OHLCV)
 * @route   GET /api/stocks/:symbol
 */
const { calculateRSI, calculateMACD, calculateBollingerBands } = require('../utils/indicators');

const getStockBySymbol = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stock = await Stock.findOne({ symbol });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock with symbol '${symbol}' not found`
      });
    }

    const stockObj = stock.toObject();
    const closePrices = stockObj.ohlcv.map(candle => candle.close);

    const rsi = calculateRSI(closePrices);
    const macd = calculateMACD(closePrices);
    const bb = calculateBollingerBands(closePrices);

    // Merge indicator values into each candle
    stockObj.ohlcv = stockObj.ohlcv.map((candle, idx) => ({
      ...candle,
      rsi: rsi[idx],
      macd: macd[idx] ? macd[idx].macd : null,
      macdSignal: macd[idx] ? macd[idx].signal : null,
      macdHist: macd[idx] ? macd[idx].histogram : null,
      bbUpper: bb[idx] ? bb[idx].upper : null,
      bbMiddle: bb[idx] ? bb[idx].middle : null,
      bbLower: bb[idx] ? bb[idx].lower : null
    }));

    res.json({
      success: true,
      stock: stockObj
    });
  } catch (error) {
    console.error('GetStockBySymbol error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching stock data'
    });
  }
};

/**
 * @desc    Search stocks by symbol or name
 * @route   GET /api/stocks/search?q=query
 */
const searchStocks = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query (q parameter)'
      });
    }

    // Escape special regex characters in the query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const stocks = await Stock.find({
      $or: [
        { symbol: { $regex: escapedQuery, $options: 'i' } },
        { name: { $regex: escapedQuery, $options: 'i' } }
      ]
    })
      .select('symbol name currentPrice change changePercent sector market category marketCap volume')
      .sort({ symbol: 1 })
      .limit(20);

    res.json({
      success: true,
      count: stocks.length,
      stocks
    });
  } catch (error) {
    console.error('SearchStocks error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error searching stocks'
    });
  }
};

module.exports = { getAllStocks, getStockBySymbol, searchStocks };
