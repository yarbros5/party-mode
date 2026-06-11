/**
 * Scene Presets
 *
 * Each preset defines the lighting state for a named vibe.
 * These are plain data objects — no logic here, just values.
 *
 * LIFX color values:
 *   hue:        0–360  (position on the color wheel)
 *   saturation: 0–1    (0 = white, 1 = fully saturated color)
 *   brightness: 0–1    (0 = off, 1 = max brightness)
 *   kelvin:     2500–9000 (color temperature, only used when saturation = 0)
 *   duration:   seconds for the transition animation
 *
 * FUTURE (Sprint 3): Claude AI will generate dynamic scene parameters
 * based on audio energy and screen colors, using this same shape.
 */

export const PRESETS = {
  rave: {
    label: 'Rave',
    emoji: '🎉',
    // Rave cycles through these colors in order, fading between each one.
    // Add, remove, or reorder colors here to change the rave palette.
    colors: [
      { hue: 0,   saturation: 1.0, brightness: 1.0, kelvin: 3500 }, // Red
      { hue: 30,  saturation: 1.0, brightness: 1.0, kelvin: 3500 }, // Orange
      { hue: 60,  saturation: 1.0, brightness: 1.0, kelvin: 3500 }, // Yellow
      { hue: 120, saturation: 1.0, brightness: 1.0, kelvin: 3500 }, // Green
      { hue: 180, saturation: 1.0, brightness: 1.0, kelvin: 3500 }, // Cyan
      { hue: 240, saturation: 1.0, brightness: 1.0, kelvin: 3500 }, // Blue
      { hue: 280, saturation: 1.0, brightness: 1.0, kelvin: 3500 }, // Purple
      { hue: 320, saturation: 1.0, brightness: 1.0, kelvin: 3500 }, // Pink
    ],
  },

  chill: {
    label: 'Chill',
    emoji: '🌊',
    color: {
      hue: 200,        // Cool blue
      saturation: 0.6,
      brightness: 0.5,
      kelvin: 4000,
    },
    duration: 2.0,     // Slow fade for calm
  },

  horror: {
    label: 'Horror',
    emoji: '🩸',
    color: {
      hue: 0,          // Red
      saturation: 1.0,
      brightness: 0.3, // Dim and menacing
      kelvin: 3500,
    },
    duration: 0.5,
  },

  blackout: {
    label: 'Blackout',
    emoji: '🌑',
    color: {
      hue: 0,
      saturation: 0,
      brightness: 0,   // Lights off
      kelvin: 3500,
    },
    duration: 1.0,
  },
};
