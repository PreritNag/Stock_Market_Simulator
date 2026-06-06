const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// Configure VAPID keys
let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  const generated = webpush.generateVAPIDKeys();
  vapidKeys.publicKey = generated.publicKey;
  vapidKeys.privateKey = generated.privateKey;
  console.log('--------------------------------------------------');
  console.log('Generated Temporary VAPID Keys for Web Push (notifier):');
  console.log('Public Key:', vapidKeys.publicKey);
  console.log('Private Key:', vapidKeys.privateKey);
  console.log('--------------------------------------------------');
}

webpush.setVapidDetails(
  'mailto:support@bullcash.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

/**
 * Send Web Push notification to all subscriptions of a user
 * @param {String} userId - ID of the target user
 * @param {String} title - Notification title
 * @param {String} body - Notification body text
 * @param {Object} data - Optional extra data payload
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({ title, body, data });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth
          }
        };
        await webpush.sendNotification(pushSub, payload);
      } catch (err) {
        // Remove expired/invalid subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`Removing expired subscription: ${sub._id}`);
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error(`Error sending push to subscription ${sub._id}:`, err.message);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (err) {
    console.error('sendPushNotification error:', err.message);
  }
};

module.exports = {
  sendPushNotification,
  vapidPublicKey: vapidKeys.publicKey
};
