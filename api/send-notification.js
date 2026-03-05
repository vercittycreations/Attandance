const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const admin = require('firebase-admin');

// Init Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { targetUid, targetAll, excludeUid, title, message, url } = req.body || {};

  if (!title || !message)
    return res.status(400).json({ error: 'title and message required' });

  const db = admin.firestore();
  const payload = JSON.stringify({ title, body: message, url, icon: '/vite.svg' });

  try {
    if (targetAll) {
      // Get all active employees with push subscription
      const snap = await db.collection('employees')
        .where('isActive', '==', true)
        .get();

      const results = [];
      await Promise.all(
        snap.docs
          .filter(d => {
            const data = d.data();
            return data.pushSubscription && d.id !== excludeUid;
          })
          .map(async (d) => {
            try {
              await webpush.sendNotification(d.data().pushSubscription, payload);
              results.push({ uid: d.id, success: true });
            } catch (err) {
              // Subscription expired — clean up
              if (err.statusCode === 410) {
                await d.ref.update({ pushSubscription: null });
              }
              results.push({ uid: d.id, success: false });
            }
          })
      );

      const sent = results.filter(r => r.success).length;
      return res.status(200).json({ success: true, sent, total: results.length });

    } else if (targetUid) {
      const empDoc = await db.collection('employees').doc(targetUid).get();
      if (!empDoc.exists)
        return res.status(404).json({ error: 'Employee not found' });

      const sub = empDoc.data()?.pushSubscription;
      if (!sub)
        return res.status(400).json({ error: 'No push subscription for this user' });

      await webpush.sendNotification(sub, payload);
      return res.status(200).json({ success: true });

    } else {
      return res.status(400).json({ error: 'targetUid or targetAll required' });
    }

  } catch (err) {
    console.error('Push error:', err);
    return res.status(500).json({ error: err.message });
  }
};