/**
 * Vercel Serverless Function: Vibe → Claude → LIFX
 *
 * This is the AI interpretation layer. It does three things in one request:
 *   1. Receives a vibe description from the browser
 *   2. Sends it to Claude, which responds with LIFX lighting parameters as JSON
 *   3. Fires those parameters directly to the LIFX API
 *   4. Returns the lighting parameters to the browser so the UI can reflect the state
 *
 * Doing steps 2 and 3 server-side means:
 *   - The Anthropic and LIFX API keys never touch the browser
 *   - One round trip from the browser instead of two
 *
 * FUTURE (Sprint 3): The `vibe` string input will be replaced by a structured
 * object containing real-time data — audio energy levels and dominant screen
 * colors sampled from the game. The Claude prompt will be updated to interpret
 * that data instead of a typed string. Only the input format changes here;
 * the Claude → LIFX pipeline stays the same.
 */

import Anthropic from '@anthropic-ai/sdk';

const LIFX_BASE_URL = 'https://api.lifx.com/v1';
const LIFX_GROUP = 'Game Room';
const selector = `group:${LIFX_GROUP}`;

// The system prompt that tells Claude how to behave.
// It instructs Claude to return only valid JSON with LIFX-compatible fields.
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
  description - string, one short plain-English phrase describing what the light is doing,
                e.g. "slow deep crimson pulse" or "bright cool blue, no movement".
                Max 8 words. No punctuation.
  effect      - (optional) object, only include when movement enhances the vibe:
    {
      "type":    "pulse" | "breathe",
      "period":  float seconds per cycle (0.5–4.0)
    }
    Effects run indefinitely until the user changes the scene manually. Never include a cycles field.

Be creative and specific. The light should feel like it belongs in the moment.

Color contrast matters — for tense or dramatic scenes, choose colors with
strong visual identity. Avoid adjacent hues (e.g. red + orange look identical
on a bulb). Instead reach for opposite ends of the wheel or high saturation
contrasted with very low brightness.

Some guidance:

  "horror, something's behind me"
    → deep blood crimson (hue 0), very low brightness ~0.15, slow breathe — pure dread
  "intense boss fight"
    → electric magenta or violent purple (hue 300–320), full brightness, fast pulse — not red, red is too expected
  "chill lofi studying"
    → desaturated blue-purple (hue 240, saturation 0.4), 50% brightness, no effect — calm focus
  "victory / win"
    → warm gold (hue 45, saturation 0.9), high brightness, celebratory breathe — triumph
  "underwater level"
    → deep teal (hue 185, saturation 0.8), medium brightness, slow breathe — submerged and eerie
  "racing game, high speed"
    → ice white-blue (hue 210, saturation 0.3), full brightness, fast pulse — speed and adrenaline
  "sad ending cutscene"
    → cold steel blue (hue 220, saturation 0.5), very low brightness, no effect — melancholy
  "stealth / sneaking"
    → near-black green (hue 120, saturation 1.0, brightness 0.1), no effect — tense silence

Only return the JSON. No other text.`;

// Builds the LIFX color string from the Claude response fields.
function buildColorString({ hue, saturation, brightness, kelvin }) {
  return `hue:${hue} saturation:${saturation} brightness:${brightness} kelvin:${kelvin}`;
}

// Sends a state update (no effect) to LIFX.
async function setLifxState(params) {
  const { hue, saturation, brightness, kelvin, duration } = params;
  const response = await fetch(`${LIFX_BASE_URL}/lights/${selector}/state`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.LIFX_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      color: buildColorString({ hue, saturation, brightness, kelvin }),
      // LIFX state endpoint takes duration in seconds, not milliseconds.
      duration: duration / 1000,
    }),
  });
  return response.ok;
}

// Fires a pulse or breathe effect to LIFX.
async function setLifxEffect(params) {
  const { hue, saturation, brightness, kelvin, effect } = params;
  const response = await fetch(
    `${LIFX_BASE_URL}/lights/${selector}/effects/${effect.type}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LIFX_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        color: buildColorString({ hue, saturation, brightness, kelvin }),
        period: effect.period,
        power_on: true,
        // persist: true keeps the last effect color when the effect ends,
        // instead of snapping back to the previous state (usually bright white).
        persist: true,
      }),
    }
  );
  return response.ok;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vibe } = req.body;

  if (!vibe || typeof vibe !== 'string' || vibe.trim() === '') {
    return res.status(400).json({ error: 'Missing vibe description' });
  }

  // ── Step 1: Ask Claude for lighting parameters ────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in environment variables' });
  }

  let lightingParams;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', // Fast and cheap — perfect for real-time lighting
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: vibe.trim() }],
    });

    // Strip markdown code fences if Claude wrapped the JSON in ```json ... ```
    const rawJson = message.content[0].text.trim().replace(/^```[a-z]*\n?/i, '').replace(/```$/,'').trim();
    lightingParams = JSON.parse(rawJson);
  } catch (err) {
    console.error('Claude error:', err.message || err);
    return res.status(500).json({ error: `Claude error: ${err.message || 'unknown'}` });
  }

  // ── Step 2: Fire the lighting command to LIFX ─────────────────────────────
  try {
    if (lightingParams.effect) {
      await setLifxEffect(lightingParams);
    } else {
      await setLifxState(lightingParams);
    }
  } catch (err) {
    console.error('LIFX error:', err);
    return res.status(500).json({ error: 'Claude responded but LIFX call failed' });
  }

  // ── Step 3: Return the params so the UI can reflect the new state ─────────
  return res.status(200).json(lightingParams);
}
