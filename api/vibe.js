/**
 * Vercel Serverless Function: Vibe → Claude → LIFX
 *
 * Handles two input modes:
 *
 *   Sprint 2 (typed vibe):
 *     Body: { vibe: "intense boss fight" }
 *     Claude receives a plain text description.
 *
 *   Sprint 3 (party mode — real-time data):
 *     Body: { audio: { energy, bass, mid, treble }, screen: { dominant_colors } }
 *     Claude receives live audio energy + screen colors and interprets the moment.
 *
 * In both cases Claude returns a colors array + stepDuration + order, the server
 * sets the first color on the LIFX bulb, and returns the full params to the
 * browser which runs the color cycling loop.
 *
 * FUTURE (Sprint 4): The audio and screen objects could be enriched —
 * e.g. adding motion detection from screen or beat detection from audio.
 * Only the prompt and input shape change here; the rest of the pipeline stays.
 */

import Anthropic from '@anthropic-ai/sdk';

const LIFX_BASE_URL = 'https://api.lifx.com/v1';
const LIFX_GROUP = 'Game Room';
const selector = `group:${LIFX_GROUP}`;

// ── System prompts ────────────────────────────────────────────────────────────

// Used when the input is a typed text description (Sprint 2 / manual vibe input).
const TEXT_VIBE_PROMPT = `You are a lighting controller for a single smart bulb in a gaming room (LIFX).
When given a vibe description, respond with ONLY a valid JSON object.
No explanation. No markdown. No preamble. Just the raw JSON.

The JSON must contain these fields:

  description  - string, one short plain-English phrase describing what the light is doing.
                 Max 8 words. No punctuation.

  colors       - array of 1–8 color objects, each with:
                   hue        integer 0–360 (0=red, 60=yellow, 120=green, 180=cyan, 240=blue, 300=pink)
                   saturation float 0.0–1.0
                   brightness float 0.0–1.0
                   kelvin     integer 2500–9000
                 For a static scene use 1 color. For cycling use 2–8 colors.

  stepDuration - integer milliseconds per color. Minimum 500ms (hardware rate limit).
                   intense:  500–800ms
                   energetic: 800–1500ms
                   calm: 2000–5000ms

  order        - "sequence" or "random"

Rules:
  - High-contrast colors for intense scenes: hues far apart on the wheel.
  - Full saturation + brightness for vivid moments.
  - Low saturation + low brightness for moody/horror scenes.

Only return the JSON. No other text.`;


// Used when the input is real-time audio + screen data (Sprint 3 / party mode).
const PARTY_MODE_PROMPT = `You are a lighting controller for a single smart bulb in a gaming room (LIFX).
You receive real-time data from the player's audio and screen, and respond with
lighting parameters that match the emotional moment of what they're experiencing.

Respond with ONLY a valid JSON object. No explanation. No markdown. No preamble.

Input you will receive:
  audio.energy  - float 0–1, overall loudness right now
  audio.bass    - float 0–1, low frequency energy (kick drum, explosions, bass)
  audio.mid     - float 0–1, mid frequency energy (vocals, most instruments)
  audio.treble  - float 0–1, high frequency energy (hi-hats, sparkle, tension)
  screen.dominant_colors - array of 3 hex colors sampled from the game screen

How to interpret the data:
  - High energy + high bass = action, danger, intensity
  - High treble + low bass = tense, electronic, alert
  - Low energy overall = calm, atmospheric, quiet
  - Very low energy = near silence, stealth, suspense
  - Dark desaturated screen colors = horror, night, moody
  - Bright saturated screen colors = action, daylight, celebration
  - Screen colors that match (monochrome) = atmospheric, cinematic
  - Screen colors that clash = chaotic, intense

The lighting should enhance the emotion, not just copy the screen colors.
Sometimes contrast is better — a dark screen moment is more terrifying with
a dim red pulse than with matching black.

Output JSON fields:

  description  - string, one short plain-English phrase. Max 8 words. No punctuation.

  colors       - array of 1–8 color objects, each with:
                   hue        integer 0–360
                   saturation float 0.0–1.0
                   brightness float 0.0–1.0
                   kelvin     integer 2500–9000

  stepDuration - integer milliseconds per color. Minimum 500ms.
                   intense action: 500–800ms
                   moderate energy: 800–1500ms
                   calm/atmospheric: 2000–5000ms
                   near-silence: static (1 color, stepDuration irrelevant)

  order        - "sequence" or "random"

Only return the JSON. No other text.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildColorString({ hue, saturation, brightness, kelvin }) {
  return `hue:${hue} saturation:${saturation} brightness:${brightness} kelvin:${kelvin}`;
}

function stripMarkdown(text) {
  return text.trim().replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' });
  }

  const { vibe, audio, screen } = req.body;
  const isPartyMode = !vibe && (audio || screen);

  // Build the user message Claude will interpret.
  let userMessage;
  let systemPrompt;

  if (isPartyMode) {
    systemPrompt = PARTY_MODE_PROMPT;
    userMessage = JSON.stringify({ audio, screen });
  } else if (vibe) {
    systemPrompt = TEXT_VIBE_PROMPT;
    userMessage = vibe.trim();
  } else {
    return res.status(400).json({ error: 'Provide either a vibe string or audio/screen data' });
  }

  // ── Step 1: Ask Claude ────────────────────────────────────────────────────
  let lightingParams;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    lightingParams = JSON.parse(stripMarkdown(message.content[0].text));
  } catch (err) {
    console.error('Claude error:', err.message || err);
    return res.status(500).json({ error: `Claude error: ${err.message || 'unknown'}` });
  }

  // ── Step 2: Set the first color on the bulb immediately ──────────────────
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
        duration: lightingParams.stepDuration / 1000,
      }),
    });
  } catch (err) {
    console.error('LIFX error:', err);
    return res.status(500).json({ error: 'Claude responded but LIFX call failed' });
  }

  // ── Step 3: Return full params for the browser color loop ─────────────────
  return res.status(200).json(lightingParams);
}
