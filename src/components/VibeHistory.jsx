/**
 * VibeHistory
 *
 * Shows the last 5 vibes the user has tried as clickable chips.
 * Clicking one re-fires that vibe through Claude.
 *
 * Props:
 *   history   - array of vibe strings, most recent first
 *   onVibe    - function called with the vibe string when a chip is clicked
 *   isLoading - boolean, disables chips while a request is in flight
 */

export default function VibeHistory({ history, onVibe, isLoading }) {
  if (history.length === 0) return null;

  return (
    <div style={styles.container}>
      <span style={styles.label}>Recent</span>
      <div style={styles.chips}>
        {history.map((vibe, index) => (
          <button
            key={index}
            onClick={() => onVibe(vibe)}
            disabled={isLoading}
            style={{
              ...styles.chip,
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {vibe}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  label: {
    color: '#64748b',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  chip: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    color: '#94a3b8',
    fontSize: '13px',
    padding: '6px 12px',
    transition: 'background 0.2s, color 0.2s',
  },
};
