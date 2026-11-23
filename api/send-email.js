// Server-side Resend dispatcher.
// The Resend API key is read only from server environment variables here —
// it is never included in the browser bundle.

const apiKey = process.env.RESEND_API_KEY;
const defaultFrom =
  process.env.EMAIL_FROM ||
  'CITE Hackathon 2026 <onboarding@resend.dev>';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ configured: Boolean(apiKey) });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!apiKey) {
    return res.status(503).json({ error: 'RESEND_API_KEY is not configured on the server.' });
  }

  const { to, subject, html, text } = req.body || {};
  if (!to || !subject) {
    return res.status(400).json({ error: 'Missing recipient or subject.' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: defaultFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || `<p>${String(text || '').replace(/\n/g, '<br/>')}</p>`,
        text: text || '',
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal delivery failure' });
  }
}
