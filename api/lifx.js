/**
 * Vercel Serverless Function: LIFX API Proxy
 *
 * Why this exists:
 *   The LIFX Cloud API requires a secret token. If we called the LIFX API
 *   directly from the browser, that token would be visible in DevTools to
 *   anyone who opened the page. Instead, the browser calls THIS function,
 *   which lives on the server, and THIS function calls LIFX with the token.
 *   The browser never sees the token.
 *
 * How requests work:
 *   Browser → POST /api/lifx  { endpoint, method, body }
 *            → this function → LIFX Cloud API
 *            ← LIFX response ← this function ← browser
 */

const LIFX_BASE_URL = 'https://api.lifx.com/v1';

export default async function handler(req, res) {
  // Only allow POST requests from our own app.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpoint, method = 'PUT', body } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint' });
  }

  try {
    const lifxResponse = await fetch(`${LIFX_BASE_URL}${endpoint}`, {
      method,
      headers: {
        // The token lives in an environment variable — never hardcoded.
        Authorization: `Bearer ${process.env.LIFX_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await lifxResponse.json();

    // Pass the LIFX status code and response straight back to the browser.
    return res.status(lifxResponse.status).json(data);
  } catch (error) {
    console.error('LIFX proxy error:', error);
    return res.status(500).json({ error: 'Failed to reach LIFX API' });
  }
}
