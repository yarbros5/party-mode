/**
 * Vercel Serverless Function: Vibe → Claude → LIFX
 *
 * This is the AI interpretation layer:
 *   1. Receives a vibe description from the browser
 *   2. Sends it to Claude, which returns a colors array + timing as JSON
 *   3. Sets the first color on the LIFX bulb immediately
 *   4. Returns the full params to the browser
 *
 * The browser then runs a color cycling loop for multi-color vibes,
 * the same way Rave mode works. This means Claude can specify any number
 * of colors, any step rate, and any order — no LIFX effects API limitations.
 *
 * FUTURE (Sprint 3): The `vibe` string input will be replaced by a structured
 * object containing real-time data — audio energy levels and dominant screen
 * colors sampled from the game. The Claude prompt will be updated to interpret
 * that data instead of a typed string. Only the input format changes here;
 * the rest of the pipeline stays the same.
 */

import Anthropic from '@anthropic-ai/sdk';

const LIFX_BASE_URL = 'https://api.lifx.com/v1';
const LIFX_GROUP = 'Game Room';
const selector = `group:${LIFX_GROUP}`;

const SYSTEM_PROMPT = `You are a lighting controller for a single smart bulb in a gaming room (LIFX).
When given a vibe description, respond with ONLY a valid JSON object.
No explanation. No markdown. No preamble. Just the raw JSON.

The JSON must contain these fields:

  description  - string, one short plain-English phrase describing what the light is doing.
                 e.g. "rapid red and cyan strobe" or "slow deep crimson throb".
                 Max 8 words. No punctuation.

  colors       - array of 1–8 color objects, each with:
                   hue        integer 0–360 (0=red, 60=yellow, 120=green, 180=cyan, 240=blue, 300=pink)
                   saturation float 0.0–1.0
                   brightness float 0.0–1.0
                   kelvin     integer 2500–9000
                 For a static scene use 1 color. For cycling use 2–8 colors.
                 The bulb will step through them in the given order.

  stepDuration - integer milliseconds to spend on each color before transitioning.
                 This is also the LIFX transition time, so shorter = snappier cut,
                 longer = smooth fade. No minimum — use your judgment:
                   intense flash: 100–300ms
                   energetic cycle: 400–800ms
                   calm breathing: 2000–5000ms

  order        - "sequence" (step through colors in order, looping) or
                 "random" (pick a random color each step)

Be creative. The light should feel like it belongs in the moment.

Rules:
  - For intense/high-energy scenes: use multiple high-contrast colors (hues far apart
    on the wheel — red + cyan, blue + yellow, etc.). Fast stepDuration.
  - For calm/atmospheric scenes: 1–2 colors, low saturation, slow stepDuration or static.
  - For horror/dread: very low brightness, slow movement or static.
  - Full saturation and brightness for vivid, energetic moments.

Examples:

  "intense boss fight"
    → 4–6 colors cycling fast: red, cyan, yellow, blue — all full brightness,
      stepDuration 200–400ms, order sequence

  "horror, something's behind me"
    → 1–2 colors: deep crimson and near-black, brightness 0.1–0.2,
      stepDuration 3000ms, order sequence — slow dread

  "victory"
    → gold, white, gold, yellow cycling, brightness 1.0, stepDuration 600ms

  "chill lofi"
    → 1 color: desaturated blue-purple, brightness 0.4, static (stepDuration irrelevant)

  "underwater level"
    → 2–3 colors: teal, deep blue, cyan, brightness 0.5, stepDuration 2000ms

Only return the JSON. No other text.`;

// Builds the LIFX color string from a color object.
function buildColorString({ hue, saturation, brightness, kelvin }) {
  return `hue:${hue} saturation:${saturation} brightness:${brightness} kelvin:${kelvin}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vibe } = req.body;
  if (!vibe || typeof vibe !== 'string' || vibe.trim() === '') {
    return res.status(400).json({ error: 'Missing vibe description' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in environment variables' });
  }

  // ── Step 1: Ask Claude for lighting parameters ────────────────────────────
  let lightingParams;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: vibe.trim() }],
    });

    // Strip markdown code fences if Claude wrapped the JSON in ```json ... ```
    const rawJson = message.content[0].text.trim()
      .replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
    lightingParams = JSON.parse(rawJson);
  } catch (err) {
    console.error('Claude error:', err.message || err);
    return res.status(500).json({ error: `Claude error: ${err.message || 'unknown'}` });
  }

  // ── Step 2: Set the first color on the bulb immediately ──────────────────
  // The browser will take over cycling through the remaining colors.
  try {
    const firstColor = lightingParams.colors[0];
    await fetch(`${LIFX_BASE_URL}/lights/${selector}/state`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${process.env.LIFX_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        color: buildColorString(firstColor),
        // stepDuration is in ms; LIFX state endpoint takes seconds.
        duration: lightingParams.stepDuration / 1000,
      }),
    });
  } catch (err) {
    console.error('LIFX error:', err);
    return res.status(500).json({ error: 'Claude responded but LIFX call failed' });
  }

  // ── Step 3: Return full params so the browser can run the color loop ──────
  return res.status(200).json(lightingParams);
}
