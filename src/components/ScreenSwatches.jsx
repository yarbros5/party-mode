/**
 * ScreenSwatches
 *
 * Shows the 3 dominant colors currently being sampled from the screen.
 * A visual confirmation that screen capture is working correctly.
 *
 * Props:
 *   colors - array of 3 hex strings, e.g. ['#1a0a2e', '#c0392b', '#e74c3c']
 *            or null/empty if screen capture isn't active
 */

export default function ScreenSwatches({ colors }) {
  const active = colors && colors.length > 0;

  return (
    <div style={styles.container}>
      <span style={styles.label}>🖥️ Screen Colors</span>
      <div style={styles.swatchRow}>
        {active
          ? colors.map((hex, i) => (
              <div
                key={i}
                style={{ ...styles.swatch, background: hex }}
                title={hex}
              />
            ))
          : [0, 1, 2].map(i => (
              <div key={i} style={styles.swatchEmpty} />
            ))
        }
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#94a3b8',
    fontSize: '13px',
  },
  swatchRow: {
    display: 'flex',
    gap: '8px',
  },
  swatch: {
    flex: 1,
    height: '40px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'background 0.5s ease',
  },
  swatchEmpty: {
    flex: 1,
    height: '40px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
};
