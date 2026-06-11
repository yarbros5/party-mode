/**
 * SceneButtons
 *
 * Four preset scene buttons. Clicking one fires the full preset —
 * color, brightness, and transition duration — all in one LIFX command.
 *
 * Props:
 *   presets        - the PRESETS object from scenes/presets.js
 *   activeScene    - string key of the currently active preset (or null)
 *   onScene        - function called with a preset key string when user clicks
 *   disabled       - boolean, disables buttons while a request is in flight
 */

export default function SceneButtons({ presets, activeScene, onScene, disabled }) {
  return (
    <div style={styles.container}>
      <span style={styles.sectionLabel}>Scenes</span>
      <div style={styles.grid}>
        {Object.entries(presets).map(([key, preset]) => {
          const isActive = activeScene === key;
          return (
            <button
              key={key}
              onClick={() => onScene(key)}
              disabled={disabled}
              style={{
                ...styles.button,
                background: isActive
                  ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                  : 'rgba(255,255,255,0.07)',
                borderColor: isActive
                  ? 'rgba(124,58,237,0.6)'
                  : 'rgba(255,255,255,0.12)',
                boxShadow: isActive
                  ? '0 0 16px rgba(124,58,237,0.4)'
                  : 'none',
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <span style={styles.emoji}>{preset.emoji}</span>
              <span style={styles.label}>{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionLabel: {
    color: '#e2e8f0',
    fontSize: '15px',
    fontWeight: '500',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  button: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '18px 12px',
    border: '1px solid',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  emoji: {
    fontSize: '26px',
  },
  label: {
    letterSpacing: '0.03em',
  },
};
