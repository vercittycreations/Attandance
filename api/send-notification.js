export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Body parse check
  let body = req.body;
  if (!body) {
    return res.status(400).json({ error: 'Empty body' });
  }

  const { targetUid, targetAll, excludeUid, title, message, url } = body;

  if (!title || !message) {
    return res.status(400).json({ error: 'title and message required' });
  }

  const appId   = process.env.VITE_ONESIGNAL_APP_ID;
  const restKey = process.env.VITE_ONESIGNAL_REST_KEY;

  if (!appId || !restKey) {
    console.error('Missing env vars:', { appId: !!appId, restKey: !!restKey });
    return res.status(500).json({ error: 'OneSignal env vars missing' });
  }

  try {
    let payload = {
      app_id:          appId,
      headings:        { en: title },
      contents:        { en: message },
      url:             url || 'https://attandance-rho.vercel.app/dashboard',
      web_url:         url || 'https://attandance-rho.vercel.app/dashboard',
      chrome_web_icon: 'https://attandance-rho.vercel.app/vite.svg',
    };

    if (targetAll) {
      payload.included_segments = ['All'];
      if (excludeUid) {
        payload.excluded_aliases = { external_id: [excludeUid] };
      }
    } else if (targetUid) {
      payload.include_aliases = { external_id: [targetUid] };
      payload.target_channel  = 'push';
    } else {
      return res.status(400).json({ error: 'targetUid or targetAll required' });
    }

    console.log('Sending to OneSignal:', JSON.stringify(payload));

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Basic ${restKey}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log('OneSignal raw response:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: 'Invalid JSON from OneSignal', raw: text });
    }

    if (data.errors) {
      console.error('OneSignal errors:', data.errors);
      return res.status(400).json({ error: data.errors });
    }

    return res.status(200).json({
      success:    true,
      id:         data.id,
      recipients: data.recipients
    });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}