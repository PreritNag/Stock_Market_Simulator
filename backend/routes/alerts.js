const express = require('express');
const router = express.Router();
const { createAlert, getAlerts, deleteAlert, getVapidPublicKey, subscribePush } = require('../controllers/alertController');
const auth = require('../middleware/auth');

// Protect all alert routes
router.use(auth);

// GET /api/alerts
router.get('/', getAlerts);

// POST /api/alerts
router.post('/', createAlert);

// DELETE /api/alerts/:id
router.delete('/:id', deleteAlert);

// GET /api/alerts/vapid-public-key
router.get('/vapid-public-key', getVapidPublicKey);

// POST /api/alerts/subscribe-push
router.post('/subscribe-push', subscribePush);

module.exports = router;
