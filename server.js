/**
 * Local Development Proxy Server
 *
 * In production, Vercel runs the /api/lifx.js serverless function.
 * Locally, Vite proxies /api/* to this Express server (port 3001),
 * which does the same job: forwards requests to LIFX with your secret token.
 *
 * Start with: node server.js
 * Then in a separate terminal: npm run dev
 */

import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json());

const LIFX_BASE_URL = 'https://api.lifx.com/v1';

app.post('/api/lifx', async (req, res) => {
  const { endpoint, method = 'PUT', body } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint' });
  }

  if (!process.env.LIFX_API_TOKEN) {
    return res.status(500).json({ error: 'LIFX_API_TOKEN not set in .env' });
  }

  try {
    const lifxResponse = await fetch(`${LIFX_BASE_URL}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.LIFX_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await lifxResponse.json();
    return res.status(lifxResponse.status).json(data);
  } catch (error) {
    console.error('LIFX proxy error:', error);
    return res.status(500).json({ error: 'Failed to reach LIFX API' });
  }
});

app.listen(3001, () => {
  console.log('Local LIFX proxy running on http://localhost:3001');
  console.log('LIFX token:', process.env.LIFX_API_TOKEN ? '✓ loaded' : '✗ MISSING — check your .env file');
});
