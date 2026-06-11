/**
 * BrightnessSlider
 *
 * A range slider that controls the brightness of the Game Room lights.
 * Props:
 *   brightness         - number 0–100 (percentage, for display)
 *   onBrightness       - called on every drag movement (updates display only)
 *   onBrightnessCommit - called when the user releases the slider (sends to LIFX)
 *   disabled           - boolean, disables input while a request is in flight
 */

export default function BrightnessSlider({ brightness, onBrightness, onBrightnessCommit, disabled }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>Brightness</span>
        <span style={styles.value}>{brightness}%</span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={brightness}
        disabled={disabled}
        onChange={(e) => onBrightness(Number(e.target.value))}
        onMouseUp={(e) => onBrightnessCommit(Number(e.target.value))}
        onTouchEnd={(e) => onBrightnessCommit(Number(e.target.value))}
        style={styles.slider}
      />

      {/* Track fill is handled via CSS custom property set inline */}
      <style>{`
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(
            to right,
            #7c3aed ${brightness}%,
            rgba(255,255,255,0.15) ${brightness}%
          );
          outline: none;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(124,58,237,0.6);
        }
        input[type=range]:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
    color: '#a78bfa',
    fontSize: '15px',
    fontWeight: '600',
    minWidth: '40px',
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
  },
};
