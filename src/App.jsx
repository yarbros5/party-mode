/**
 * App.jsx — Root Component
 *
 * This is the top-level component. It owns all shared state and coordinates
 * between the UI components and the LIFX service layer.
 *
 * Data flow:
 *   User interaction → component callback → App state update → lifxService call
 *
 * FUTURE (Sprint 2/3): The audio engine and Claude AI layer will also call
 *   lifxService from outside this component. App state will be updated via
 *   a shared context or event emitter so the UI reflects AI-driven changes.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import PowerToggle from './components/PowerToggle';
import BrightnessSlider from './components/BrightnessSlider';
import ColorPicker from './components/ColorPicker';
import SceneButtons from './components/SceneButtons';
import FadeSpeedSlider from './components/FadeSpeedSlider';
import RaveColorEditor from './components/RaveColorEditor';
import StatusIndicator from './components/StatusIndicator';
import { PRESETS } from './scenes/presets';
import * as lifx from './services/lifxService';
import './App.css';

// Converts a LIFX hue (0–360) to a hex color string for display in color inputs.
// Saturation and brightness are fixed at 1 since we just need a representative color.
function lifxHueToHex(hue) {
  const h = hue / 360;
  const s = 1, v = 1;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r, g, b;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

// Converts a hex color string (e.g. '#ff6600') to LIFX hue/saturation values.
// LIFX uses hue 0–360 and saturation 0–1, not hex.
function hexToLifxColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  const saturation = max === 0 ? 0 : delta / max;
  const brightness = max;

  return { hue, saturation: Math.round(saturation * 100) / 100, brightness, kelvin: 3500 };
}

export default function App() {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [isOn, setIsOn] = useState(true);
  const [brightness, setBrightness] = useState(80);   // 0–100 for display
  const [color, setColor] = useState('#7c3aed');       // hex for the color picker
  const [activeScene, setActiveScene] = useState(null);
  const [fadeSpeed, setFadeSpeed] = useState(1.5);     // seconds per color in rave mode
  // Rave colors stored as hex strings so the color editor can work with them directly.
  // Initialized by converting the hue values from the preset.
  const [raveColors, setRaveColors] = useState(
    () => PRESETS.rave.colors.map(c => lifxHueToHex(c.hue))
  );

  // ── Request state ─────────────────────────────────────────────────────────
  const [status, setStatus] = useState('loading');
  const [statusMessage, setStatusMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  // ── Rave loop refs ────────────────────────────────────────────────────────
  // We use a ref (not state) for the interval ID because changing it should
  // never trigger a re-render — it's internal bookkeeping, not UI data.
  const raveIntervalRef = useRef(null);
  const raveColorIndexRef = useRef(0);

  // ── Helpers ───────────────────────────────────────────────────────────────

  // Wraps any lifxService call: sets busy flag, catches errors, updates status.
  // Note: rave loop calls lifx.setColor directly (not through send) so it
  // doesn't flip the busy flag on every color change.
  const send = useCallback(async (lifxCall) => {
    setIsBusy(true);
    setStatusMessage('');
    try {
      await lifxCall();
      setStatus('connected');
    } catch (err) {
      setStatus('error');
      setStatusMessage(err.message);
    } finally {
      setIsBusy(false);
    }
  }, []);

  // Stops the rave color loop if it's running.
  function stopRave() {
    if (raveIntervalRef.current) {
      clearInterval(raveIntervalRef.current);
      raveIntervalRef.current = null;
    }
  }

  // Starts the rave color loop at the given speed (seconds per color).
  // hexColors is an array of hex strings; we convert each to LIFX format here.
  function startRave(speed, hexColors) {
    stopRave(); // Clear any existing loop first.
    raveColorIndexRef.current = 0;
    const lifxColors = hexColors.map(hex => hexToLifxColor(hex));

    // Fire the first color immediately so there's no delay on activation.
    lifx.setColor(lifxColors[0], speed).catch(() => {});

    raveIntervalRef.current = setInterval(() => {
      raveColorIndexRef.current = (raveColorIndexRef.current + 1) % lifxColors.length;
      const nextColor = lifxColors[raveColorIndexRef.current];
      // Duration matches the interval so each fade fills exactly one step.
      lifx.setColor(nextColor, speed).catch(() => {});
    }, speed * 1000);
  }

  // Stop the rave loop when the component unmounts (e.g. tab closed).
  useEffect(() => {
    return () => stopRave();
  }, []);

  // ── Check connection on first load ────────────────────────────────────────
  useEffect(() => {
    async function checkConnection() {
      try {
        await lifx.getLights();
        setStatus('connected');
      } catch (err) {
        setStatus('error');
        setStatusMessage(err.message);
      }
    }
    checkConnection();
  }, []);

  // ── Event handlers ────────────────────────────────────────────────────────

  function handlePowerToggle() {
    const next = !isOn;
    setIsOn(next);
    setActiveScene(null);
    stopRave();
    send(() => lifx.setPower(next));
  }

  // Update the display value instantly while dragging — no API call yet.
  function handleBrightnessChange(value) {
    setBrightness(value);
    setActiveScene(null);
    stopRave();
  }

  // Only send to LIFX when the user finishes dragging (mouse/touch released).
  function handleBrightnessCommit(value) {
    send(() => lifx.setBrightness(value / 100));
  }

  function handleColor(hex) {
    setColor(hex);
    setActiveScene(null);
    stopRave();
    send(() => lifx.setColor(hexToLifxColor(hex)));
  }

  function handleScene(key) {
    setActiveScene(key);
    setIsOn(true);

    if (key === 'rave') {
      startRave(fadeSpeed, raveColors);
    } else {
      stopRave();
      const preset = PRESETS[key];
      setBrightness(Math.round(preset.color.brightness * 100));
      send(() => lifx.applyScene(preset));
    }
  }

  // Called while dragging the fade speed slider — update display only.
  function handleFadeSpeedChange(speed) {
    setFadeSpeed(speed);
  }

  // Called when the user releases the fade speed slider — restart rave loop.
  function handleFadeSpeedCommit(speed) {
    setFadeSpeed(speed);
    if (activeScene === 'rave') {
      startRave(speed, raveColors);
    }
  }

  // Called when the user adds, removes, or changes a rave color.
  // Restarts the loop immediately so the new palette takes effect.
  function handleRaveColorsChange(newColors) {
    setRaveColors(newColors);
    if (activeScene === 'rave') {
      startRave(fadeSpeed, newColors);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <header className="app-header">
        <div className="title-row">
          <h1 className="app-title">Party Mode 🎮</h1>
          <StatusIndicator status={status} message={statusMessage} />
        </div>
        <p className="app-subtitle">Game Room Lighting Controller</p>
      </header>

      <main className="controls">
        <section className="card">
          <PowerToggle isOn={isOn} onToggle={handlePowerToggle} disabled={isBusy} />
        </section>

        <section className="card">
          <BrightnessSlider
            brightness={brightness}
            onBrightness={handleBrightnessChange}
            onBrightnessCommit={handleBrightnessCommit}
            disabled={isBusy}
          />
        </section>

        <section className="card">
          <ColorPicker color={color} onColor={handleColor} disabled={isBusy} />
        </section>

        <section className="card">
          <SceneButtons
            presets={PRESETS}
            activeScene={activeScene}
            onScene={handleScene}
            disabled={isBusy}
          />
          {/* Fade speed and color editor only appear when Rave is active */}
          {activeScene === 'rave' && (
            <>
              <FadeSpeedSlider
                fadeSpeed={fadeSpeed}
                onFadeSpeed={handleFadeSpeedChange}
                onFadeSpeedCommit={handleFadeSpeedCommit}
              />
              <RaveColorEditor
                colors={raveColors}
                onColorsChange={handleRaveColorsChange}
              />
            </>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <span>Targeting: Game Room</span>
      </footer>
    </div>
  );
}
