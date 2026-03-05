import OneSignal from 'react-onesignal';

let initialized = false;

// ─────────────────────────────────────────────
// Initialize OneSignal — call once on app load
// ─────────────────────────────────────────────
export const initOneSignal = async () => {
  if (initialized) return;

  try {
    await OneSignal.init({
      appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
      safari_web_id: '', // leave empty if not using Safari push
      notifyButton: {
        enable: false, // We handle permission ourselves
      },
      allowLocalhostAsSecureOrigin: true, // for local dev
      serviceWorkerParam: { scope: '/' },
    });

    initialized = true;
    console.log('✅ OneSignal initialized');
  } catch (err) {
    console.error('OneSignal init error:', err);
  }
};

// ─────────────────────────────────────────────
// Link logged-in user to OneSignal
// ─────────────────────────────────────────────
export const setOneSignalUser = async (uid, name, email) => {
  try {
    // Request permission
    await OneSignal.Notifications.requestPermission();

    // Link Firebase UID as OneSignal External User ID
    await OneSignal.login(uid);

    // Set user tags for targeting
    await OneSignal.User.addTags({
      uid,
      name:  name  || '',
      email: email || '',
    });

    console.log('✅ OneSignal user set:', uid);
  } catch (err) {
    console.error('OneSignal user set error:', err);
  }
};

// ─────────────────────────────────────────────
// Logout OneSignal when user logs out
// ─────────────────────────────────────────────
export const logoutOneSignal = async () => {
  try {
    await OneSignal.logout();
    console.log('✅ OneSignal logged out');
  } catch (err) {
    console.error('OneSignal logout error:', err);
  }
};

// ─────────────────────────────────────────────
// Send push notification to a SPECIFIC user
// Uses OneSignal REST API via fetch
// ─────────────────────────────────────────────
export const sendPushToUser = async (targetUid, title, message, url = '/dashboard') => {
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // REST API key — only use from backend ideally
        // For client side: use public REST API key (read-only safe)
        'Authorization': `Basic ${import.meta.env.VITE_ONESIGNAL_REST_KEY}`,
      },
      body: JSON.stringify({
        app_id:             import.meta.env.VITE_ONESIGNAL_APP_ID,
        include_aliases:    { external_id: [targetUid] },
        target_channel:     'push',
        headings:           { en: title },
        contents:           { en: message },
        url:                `${window.location.origin}${url}`,
        web_url:            `${window.location.origin}${url}`,
        chrome_web_icon:    `${window.location.origin}/vite.svg`,
        small_icon:         'vite',
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error('OneSignal push error:', data.errors);
    } else {
      console.log('✅ Push sent to:', targetUid);
    }
  } catch (err) {
    console.error('Push send error:', err);
  }
};

// ─────────────────────────────────────────────
// Send push notification to ALL employees
// ─────────────────────────────────────────────
export const sendPushToAll = async (title, message, url = '/dashboard', excludeUid = null) => {
  try {
    const body = {
      app_id:           import.meta.env.VITE_ONESIGNAL_APP_ID,
      included_segments: ['All'],
      headings:         { en: title },
      contents:         { en: message },
      url:              `${window.location.origin}${url}`,
      web_url:          `${window.location.origin}${url}`,
      chrome_web_icon:  `${window.location.origin}/vite.svg`,
    };

    // Exclude the admin who triggered it
    if (excludeUid) {
      body.excluded_aliases = { external_id: [excludeUid] };
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${import.meta.env.VITE_ONESIGNAL_REST_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (data.errors) {
      console.error('OneSignal broadcast error:', data.errors);
    } else {
      console.log('✅ Broadcast push sent');
    }
  } catch (err) {
    console.error('Broadcast push error:', err);
  }
};
