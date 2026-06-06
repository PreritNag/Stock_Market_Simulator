const express = require('express');
const router = express.Router();
const { placeOrder, getOrders, cancelOrder } = require('../controllers/orderController');
const auth = require('../middleware/auth');

// All order routes are protected
router.use(auth);

// POST /api/orders
router.post('/', placeOrder);

// GET /api/orders
router.get('/', getOrders);

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', cancelOrder);

module.exports = router;
