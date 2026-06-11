/**
 * ColorPicker
 *
 * An HTML color input for choosing a custom light color.
 * The native <input type="color"> gives us a color wheel for free.
 *
 * Props:
 *   color      - hex string like '#ff0000'
 *   onColor    - function called with new hex color string when user picks
 *   disabled   - boolean, disables input while a request is in flight
 *
 * Note: We convert hex → LIFX HSBK in App.jsx before sending to the service,
 * because LIFX uses hue/saturation/brightness, not hex.
 */

export default function ColorPicker({ color, onColor, disabled }) {
  return (
    <div style={styles.container}>
      <span style={styles.label}>Custom Color</span>

      <label style={{ ...styles.swatch, background: color, opacity: disabled ? 0.5 : 1 }}>
        <input
          type="color"
          value={color}
          disabled={disabled}
          onChange={(e) => onColor(e.target.value)}
          style={styles.hiddenInput}
        />
        <span style={styles.swatchIcon}>🎨</span>
      </label>

      <span style={styles.hexLabel}>{color.toUpperCase()}</span>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  label: {
    color: '#e2e8f0',
    fontSize: '15px',
    fontWeight: '500',
    flex: 1,
  },
  swatch: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    border: '2px solid rgba(255,255,255,0.2)',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    flexShrink: 0,
  },
  hiddenInput: {
    // Hide the native input but keep it accessible for click events.
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
  swatchIcon: {
    fontSize: '22px',
  },
  hexLabel: {
    color: '#94a3b8',
    fontSize: '13px',
    fontFamily: 'monospace',
    minWidth: '72px',
  },
};
