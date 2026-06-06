const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, webhook } = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// POST /api/payment/create-order (protected)
router.post('/create-order', auth, createOrder);

// POST /api/payment/verify (protected)
router.post('/verify', auth, verifyPayment);

// POST /api/payment/webhook (no auth - uses Razorpay signature verification)
router.post('/webhook', webhook);

module.exports = router;
