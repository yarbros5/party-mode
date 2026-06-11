/**
 * Local Development Server
 *
 * In production, Vercel runs the serverless functions in /api/.
 * Locally, Vite proxies /api/* to this Express server (port 3001),
 * which mirrors what those functions do.
 *
 * Start with: npm run server
 * Then in a separate terminal: npm run dev
 */

import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(express.json());

const LIFX_BASE_URL = 'https://api.lifx.com/v1';
const LIFX_GROUP = 'Game Room';
const selector = `group:${LIFX_GROUP}`;

// ── /api/lifx — generic LIFX proxy (Sprint 1) ─────────────────────────────

app.post('/api/lifx', async (req, res) => {
  const { endpoint, method = 'PUT', body } = req.body;

  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });

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

// ── /api/vibe — Claude AI interpretation layer (Sprint 2) ─────────────────

// Shared system prompt (kept in sync with api/vibe.js).
const SYSTEM_PROMPT = `You are a lighting controller for a single smart bulb in a gaming room (LIFX).
When given a vibe description, respond with ONLY a valid JSON object.
No explanation. No markdown. No preamble. Just the raw JSON.

The JSON must contain these fields:

  hue         - integer 0–360
                (0=red, 30=orange, 60=yellow, 120=green,
                 180=cyan, 240=blue, 280=purple, 320=pink)
  saturation  - float 0.0–1.0  (0=white/warm, 1=full color)
  brightness  - float 0.0–1.0
  kelvin      - integer 2500–9000  (used when saturation is low:
                2500=candlelight, 4000=neutral, 6500=daylight)
  duration    - integer milliseconds for the color transition (100–5000)
  effect      - (optional) object, only include when movement enhances the vibe:
    {
      "type":    "pulse" | "breathe",
      "period":  float seconds per cycle (0.5–4.0)
    }
    Effects run indefinitely until the user changes the scene manually. Never include a cycles field.

Be creative and specific. The light should feel like it belongs in the moment.
Only return the JSON. No other text.`;

function buildColorString({ hue, saturation, brightness, kelvin }) {
  return `hue:${hue} saturation:${saturation} brightness:${brightness} kelvin:${kelvin}`;
}

app.post('/api/vibe', async (req, res) => {
  const { vibe } = req.body;
  if (!vibe?.trim()) return res.status(400).json({ error: 'Missing vibe description' });

  // Step 1: Ask Claude.
  let lightingParams;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: vibe.trim() }],
    });
    lightingParams = JSON.parse(message.content[0].text.trim());
  } catch (err) {
    console.error('Claude error:', err);
    return res.status(500).json({ error: 'Failed to interpret vibe — Claude error' });
  }

  // Step 2: Fire LIFX.
  try {
    const { hue, saturation, brightness, kelvin, duration, effect } = lightingParams;
    const colorString = buildColorString({ hue, saturation, brightness, kelvin });

    if (effect) {
      await fetch(`${LIFX_BASE_URL}/lights/${selector}/effects/${effect.type}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.LIFX_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          color: colorString,
          period: effect.period,
          ...(effect.cycles !== undefined && { cycles: effect.cycles }),
          power_on: true,
        }),
      });
    } else {
      await fetch(`${LIFX_BASE_URL}/lights/${selector}/state`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${process.env.LIFX_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ color: colorString, duration: duration / 1000 }),
      });
    }
  } catch (err) {
    console.error('LIFX error:', err);
    return res.status(500).json({ error: 'Claude responded but LIFX call failed' });
  }

  return res.status(200).json(lightingParams);
});

app.listen(3001, () => {
  console.log('Local dev server running on http://localhost:3001');
  console.log('LIFX token:     ', process.env.LIFX_API_TOKEN   ? '✓ loaded' : '✗ MISSING');
  console.log('Anthropic key:  ', process.env.ANTHROPIC_API_KEY ? '✓ loaded' : '✗ MISSING');
});
