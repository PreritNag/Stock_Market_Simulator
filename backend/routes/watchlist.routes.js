const express = require('express');
const router = express.Router();
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlist.controller');
const auth = require('../middleware/auth');

// All watchlist routes are protected
router.use(auth);

// GET /api/watchlist
router.get('/', getWatchlist);

// POST /api/watchlist
router.post('/', addToWatchlist);

// DELETE /api/watchlist/:symbol
router.delete('/:symbol', removeFromWatchlist);

module.exports = router;
