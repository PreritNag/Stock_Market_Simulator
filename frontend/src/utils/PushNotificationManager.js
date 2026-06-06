import api from '../services/api';

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers the Service Worker and Web Push subscriptions
 */
export async function registerPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported in this browser.');
    return;
  }

  try {
    // 1. Register Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('[Service Worker] Registered:', registration);

    // 2. Request Notification Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Notifications] Permission not granted.');
      return;
    }

    // 3. Fetch VAPID public key from backend
    const { data } = await api.get('/alerts/vapid-public-key');
    if (!data || !data.publicKey) {
      console.error('[Notifications] Failed to load VAPID public key.');
      return;
    }

    // 4. Subscribe to Push Manager
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey)
    };

    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    console.log('[Push Manager] Subscribed successfully:', subscription);

    // 5. Send subscription details to backend
    await api.post('/alerts/subscribe-push', { subscription });
    console.log('[Notifications] Subscription saved to backend.');
  } catch (error) {
    console.error('[Notifications] Registration failed:', error.message);
  }
}
