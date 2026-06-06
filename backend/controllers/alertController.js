const Alert = require('../models/Alert');

/**
 * @desc    Create a new alert
 * @route   POST /api/alerts
 */
const createAlert = async (req, res) => {
  try {
    const { symbol, criteriaType, value } = req.body;
    const userId = req.user._id;

    if (!symbol || !criteriaType || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide symbol, criteriaType, and value'
      });
    }

    const alert = await Alert.create({
      userId,
      symbol: symbol.toUpperCase(),
      criteriaType,
      value: Number(value),
      status: 'PENDING'
    });

    res.status(201).json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('CreateAlert error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error creating alert'
    });
  }
};

/**
 * @desc    Get all active/triggered alerts for current user
 * @route   GET /api/alerts
 */
const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error('GetAlerts error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching alerts'
    });
  }
};

/**
 * @desc    Delete/Cancel an alert
 * @route   DELETE /api/alerts/:id
 */
const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    if (alert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this alert'
      });
    }

    await Alert.deleteOne({ _id: alert._id });

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('DeleteAlert error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error deleting alert'
    });
  }
};

const PushSubscription = require('../models/PushSubscription');
const { vapidPublicKey } = require('../utils/pushNotifier');

/**
 * @desc    Get VAPID Public Key for subscription
 * @route   GET /api/alerts/vapid-public-key
 */
const getVapidPublicKey = async (req, res) => {
  res.json({
    success: true,
    publicKey: vapidPublicKey
  });
};

/**
 * @desc    Save/Register Web Push subscription
 * @route   POST /api/alerts/subscribe-push
 */
const subscribePush = async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription object'
      });
    }

    // Save or update subscription
    await PushSubscription.findOneAndUpdate(
      { userId: req.user._id, endpoint: subscription.endpoint },
      {
        userId: req.user._id,
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Subscribed to push notifications successfully'
    });
  } catch (error) {
    console.error('SubscribePush error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error saving push subscription'
    });
  }
};

module.exports = { createAlert, getAlerts, deleteAlert, getVapidPublicKey, subscribePush };
