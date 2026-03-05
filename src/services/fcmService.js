import { getToken, onMessage } from 'firebase/messaging';
import {
  doc, updateDoc, serverTimestamp,
  collection, getDocs, where, query
} from 'firebase/firestore';
import { db, getMessagingInstance } from '../firebase/config';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// ─────────────────────────────────────
// Save FCM token to Firestore
// ─────────────────────────────────────
export const initializeFCM = async (uid) => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    // Check browser support
    if (!('Notification' in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return null;

    await updateDoc(doc(db, 'employees', uid), {
      deviceToken: token,
      tokenUpdatedAt: serverTimestamp()
    });

    return token;
  } catch (err) {
    console.error('FCM init error:', err);
    return null;
  }
};

// ─────────────────────────────────────
// Foreground message listener
// ─────────────────────────────────────
export const onForegroundMessage = async (callback) => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return () => {};
    return onMessage(messaging, callback);
  } catch {
    return () => {};
  }
};

// ─────────────────────────────────────
// Send push to ONE employee (client side)
// Uses browser Notification API directly
// Works when app IS open
// ─────────────────────────────────────
export const sendLocalNotification = (title, body, url = '/dashboard') => {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const notif = new Notification(title, {
    body,
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: 'workforce-notif',
    vibrate: [200, 100, 200],
  });

  notif.onclick = () => {
    window.focus();
    window.location.href = url;
    notif.close();
  };
};

// ─────────────────────────────────────
// Get all employee tokens from Firestore
// (Admin use only — to notify everyone)
// ─────────────────────────────────────
export const getAllEmployeeTokens = async (excludeUid = null) => {
  const snap = await getDocs(
    query(collection(db, 'employees'), where('isActive', '==', true))
  );
  const tokens = [];
  snap.docs.forEach(d => {
    if (d.id !== excludeUid && d.data().deviceToken) {
      tokens.push(d.data().deviceToken);
    }
  });
  return tokens;
};