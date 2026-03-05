export const initOneSignal = async () => {
  if (initialized) return;
  if (initPromise) return initPromise;

  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve('timeout'), 5000)
  );

  const init = OneSignal.init({
    appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
    notifyButton: { enable: false },
    allowLocalhostAsSecureOrigin: true,
    // CDN se directly serve karo — local file nahi
    serviceWorkerPath: 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js',
    serviceWorkerParam: { scope: '/' },
  });

  initPromise = Promise.race([init, timeout])
    .then((result) => {
      if (result === 'timeout') {
        console.warn('⚠️ OneSignal timed out');
      } else {
        initialized = true;
        console.log('✅ OneSignal initialized');
      }
    })
    .catch(err => {
      console.warn('⚠️ OneSignal failed:', err?.message);
      initPromise = null;
    });

  return initPromise;
};