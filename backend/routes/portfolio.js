const express = require('express');
const router = express.Router();
const { getPortfolio, getTradeHistory } = require('../controllers/portfolioController');
const auth = require('../middleware/auth');

// All portfolio routes are protected
router.use(auth);

// GET /api/portfolio
router.get('/', getPortfolio);

// GET /api/portfolio/history
router.get('/history', getTradeHistory);

module.exports = router;
