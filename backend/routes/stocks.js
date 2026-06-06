const express = require('express');
const router = express.Router();
const { getAllStocks, getStockBySymbol, searchStocks } = require('../controllers/stockController');

// GET /api/stocks/search?q=query (must be before /:symbol to avoid conflict)
router.get('/search', searchStocks);

// GET /api/stocks
router.get('/', getAllStocks);

// GET /api/stocks/:symbol
router.get('/:symbol', getStockBySymbol);

module.exports = router;
