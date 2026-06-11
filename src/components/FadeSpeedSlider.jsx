/**
 * FadeSpeedSlider
 *
 * Controls how fast Rave mode cycles through colors.
 * Only shown when Rave is the active scene.
 *
 * Props:
 *   fadeSpeed      - number in seconds (0.5–4.0)
 *   onFadeSpeed    - function called with new value as the user drags
 *   onFadeSpeedCommit - function called when user releases (restarts rave loop)
 */

export default function FadeSpeedSlider({ fadeSpeed, onFadeSpeed, onFadeSpeedCommit }) {
  // Convert seconds to a human-readable label.
  function speedLabel(seconds) {
    if (seconds <= 0.75) return 'Blazing';
    if (seconds <= 1.5)  return 'Fast';
    if (seconds <= 2.5)  return 'Medium';
    return 'Slow';
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>⚡ Fade Speed</span>
        <span style={styles.value}>{speedLabel(fadeSpeed)}</span>
      </div>

      <input
        type="range"
        min={0.5}
        max={4.0}
        step={0.25}
        // Invert the slider so dragging right = faster (lower seconds = faster).
        value={4.5 - fadeSpeed}
        onChange={(e) => onFadeSpeed(4.5 - Number(e.target.value))}
        onMouseUp={(e) => onFadeSpeedCommit(4.5 - Number(e.target.value))}
        onTouchEnd={(e) => onFadeSpeedCommit(4.5 - Number(e.target.value))}
        style={styles.slider}
      />

      <style>{`
        .fade-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(to right, #f97316, #ec4899);
          outline: none;
        }
        .fade-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(249,115,22,0.7);
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#e2e8f0',
    fontSize: '15px',
    fontWeight: '500',
  },
  value: {
    color: '#fb923c',
    fontSize: '15px',
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    WebkitAppearance: 'none',
    height: '8px',
    borderRadius: '4px',
    background: 'linear-gradient(to right, #f97316, #ec4899)',
    outline: 'none',
    cursor: 'pointer',
  },
};
