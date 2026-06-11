/**
 * LIFX Service — Output Layer
 *
 * This is the single place in the app that sends lighting commands.
 * All components call functions from this file. No component talks
 * to the API directly.
 *
 * Why this matters for future sprints:
 *   FUTURE (Sprint 2): The audio input engine will call setColor() here
 *     when it detects a beat or energy spike.
 *   FUTURE (Sprint 3): The Claude AI layer will call applyState() here
 *     with AI-generated lighting parameters based on audio + screen color.
 *   FUTURE (Sprint 3): The screen color sampler will feed color data into
 *     Claude, which will then call this service with the result.
 *
 * Keeping all output in one place means we only need to change things
 * here — not scattered across components — when those sprints arrive.
 */

// The LIFX group we're controlling. Change this if your group is named differently.
const LIFX_GROUP = 'Game Room';

// Builds the selector string LIFX uses to target a group.
const groupSelector = `group:${LIFX_GROUP}`;

/**
 * Low-level helper: sends a command through our serverless proxy.
 * Returns the parsed JSON response, or throws on network/server errors.
 */
async function callLifx(endpoint, method = 'PUT', body = null) {
  const response = await fetch('/api/lifx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, method, body }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Throw a descriptive error so the UI can display it.
    throw new Error(data.error || `LIFX API error: ${response.status}`);
  }

  return data;
}

/**
 * Turn the Game Room lights on or off.
 * @param {boolean} on - true = on, false = off
 */
export async function setPower(on) {
  return callLifx(`/lights/${groupSelector}/state`, 'PUT', {
    power: on ? 'on' : 'off',
    duration: 0.5,
  });
}

/**
 * Set the brightness of the Game Room lights.
 * @param {number} brightness - 0.0 to 1.0
 */
export async function setBrightness(brightness) {
  return callLifx(`/lights/${groupSelector}/state`, 'PUT', {
    brightness,
    duration: 0.4,
  });
}

/**
 * Set a specific color using LIFX's HSBK format.
 * @param {object} color - { hue, saturation, brightness, kelvin }
 * @param {number} duration - transition time in seconds
 */
export async function setColor(color, duration = 0.5) {
  const { hue, saturation, brightness, kelvin } = color;
  return callLifx(`/lights/${groupSelector}/state`, 'PUT', {
    color: `hue:${hue} saturation:${saturation} brightness:${brightness} kelvin:${kelvin}`,
    duration,
  });
}

/**
 * Apply a full preset scene (color + brightness + duration in one call).
 * @param {object} preset - a preset object from scenes/presets.js
 */
export async function applyScene(preset) {
  return setColor(preset.color, preset.duration);
}

/**
 * Ping LIFX to check if the connection is working.
 * Returns the list of lights in the group, or throws on failure.
 */
export async function getLights() {
  return callLifx(`/lights/${groupSelector}`, 'GET');
}
