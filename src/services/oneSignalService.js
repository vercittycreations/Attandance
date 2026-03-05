import OneSignal from 'react-onesignal';

let initialized = false;
let initPromise = null;

export const initOneSignal = async () => {
  if (initialized) return;
  if (initPromise) return initPromise;

  // Timeout added — agar 5 seconds mein init na ho toh skip karo
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve('timeout'), 3000)
  );
const callNotificationAPI = async (payload) => {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Check if response is ok first
    if (!response.ok) {
      const text = await response.text();
      console.warn('❌ API error:', response.status, text);
      return null;
    }

    const text = await response.text();
    if (!text) {
      console.warn('❌ Empty response from API');
      return null;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.warn('❌ Invalid JSON response:', text);
      return null;
    }

    if (data.error) {
      console.warn('❌ Notification error:', data.error);
    } else {
      console.log('✅ Push sent! ID:', data.id, '| Recipients:', data.recipients);
    }

    return data;
  } catch (err) {
    console.warn('❌ API call failed:', err?.message);
    return null;
  }
};
  const init = OneSignal.init({
    appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
    notifyButton: { enable: false },
    allowLocalhostAsSecureOrigin: true,
    serviceWorkerParam: { scope: '/' },
  });

  initPromise = Promise.race([init, timeout])
    .then((result) => {
      if (result === 'timeout') {
        console.warn('⚠️ OneSignal init timed out (blocked or slow)');
      } else {
        initialized = true;
        console.log('✅ OneSignal initialized');
      }
    })
    .catch(err => {
      console.warn('⚠️ OneSignal init failed (ad blocker?):', err?.message);
      initPromise = null;
    });

  return initPromise;
};

export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) return 'unsupported';
    const current = Notification.permission;
    if (current === 'granted') return 'granted';
    if (current === 'denied')  return 'denied';
    const result = await OneSignal.Notifications.requestPermission();
    return result ? 'granted' : 'default';
  } catch (err) {
    console.warn('Permission request error:', err);
    return 'error';
  }
};

export const setOneSignalUser = async (uid, name, email) => {
  try {
    // Wait for init but never block auth
    if (initPromise) {
      await Promise.race([
        initPromise,
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
    }

    // If still not initialized (blocked), silently skip
    if (!initialized) {
      console.warn('⚠️ OneSignal not available — skipping push setup');
      return;
    }

    await requestNotificationPermission();
    await OneSignal.login(uid);
    await OneSignal.User.addTags({
      uid,
      name:  name  || '',
      email: email || '',
    });
    console.log('✅ OneSignal user set:', uid);
  } catch (err) {
    // NEVER block auth flow
    console.warn('⚠️ OneSignal user setup skipped:', err?.message);
  }
};

export const logoutOneSignal = async () => {
  try {
    if (!initialized) return;
    await OneSignal.logout();
  } catch {
    // ignore
  }
};

const callNotificationAPI = async (payload) => {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (data.error) console.warn('❌ Notification error:', data.error);
    else console.log('✅ Push sent! ID:', data.id);
    return data;
  } catch (err) {
    console.warn('❌ API call failed:', err?.message);
  }
};

export const sendPushToUser = async (targetUid, title, message, url = '/dashboard') => {
  return callNotificationAPI({
    targetUid,
    title,
    message,
    url: `${window.location.origin}${url}`,
  });
};

export const sendPushToAll = async (title, message, url = '/dashboard', excludeUid = null) => {
  return callNotificationAPI({
    targetAll: true,
    excludeUid,
    title,
    message,
    url: `${window.location.origin}${url}`,
  });
};