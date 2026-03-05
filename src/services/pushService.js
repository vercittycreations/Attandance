// Native Web Push — No third party needed

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
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

// ─────────────────────────────────────────────
// Register Service Worker + Subscribe user
// ─────────────────────────────────────────────
export const initPushNotifications = async (uid) => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push not supported');
      return null;
    }

    // Register SW
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('✅ SW registered');

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission:', permission);
      return null;
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log('✅ Push subscribed');

    // Save subscription to Firestore
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('../firebase/config');

    const subData = subscription.toJSON();
    await updateDoc(doc(db, 'employees', uid), {
      pushSubscription: subData,
      pushUpdatedAt:    serverTimestamp()
    });

    console.log('✅ Subscription saved to Firestore');
    return subData;

  } catch (err) {
    console.warn('Push init error:', err?.message);
    return null;
  }
};

// ─────────────────────────────────────────────
// Send push — calls our Vercel API
// ─────────────────────────────────────────────
export const sendPushToUser = async (targetUid, title, message, url = '/dashboard') => {
  try {
    const res = await fetch('/api/send-notification', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ targetUid, title, message, url }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('Push API error:', res.status, text);
      return;
    }

    const data = await res.json();
    console.log('✅ Push sent:', data);
  } catch (err) {
    console.warn('sendPushToUser error:', err?.message);
  }
};

export const sendPushToAll = async (title, message, url = '/dashboard', excludeUid = null) => {
  try {
    const res = await fetch('/api/send-notification', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ targetAll: true, excludeUid, title, message, url }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('Broadcast API error:', res.status, text);
      return;
    }

    const data = await res.json();
    console.log('✅ Broadcast sent:', data);
  } catch (err) {
    console.warn('sendPushToAll error:', err?.message);
  }
};

// Logout — unsubscribe
export const logoutPush = async (uid) => {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();

    const { doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('../firebase/config');
    await updateDoc(doc(db, 'employees', uid), { pushSubscription: null });
  } catch (err) {
    console.warn('Logout push error:', err?.message);
  }
};