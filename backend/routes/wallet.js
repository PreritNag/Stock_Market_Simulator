const express = require('express');
const router = express.Router();
const { getWallet, getTransactions } = require('../controllers/walletController');
const auth = require('../middleware/auth');

// All wallet routes are protected
router.use(auth);

// GET /api/wallet
router.get('/', getWallet);

// GET /api/wallet/transactions
router.get('/transactions', getTransactions);

module.exports = router;
