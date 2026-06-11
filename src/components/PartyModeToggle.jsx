/**
 * PartyModeToggle
 *
 * The main feature toggle. When on, the app samples audio + screen
 * and continuously feeds the data to Claude to update the lights.
 *
 * This is the most prominent element in the UI — it's the whole point
 * of the app when everything is working.
 *
 * Props:
 *   isOn      - boolean, current party mode state
 *   onToggle  - function called when user clicks (no arguments)
 *   isLoading - boolean, true while the stream is starting up
 */

export default function PartyModeToggle({ isOn, onToggle, isLoading }) {
  function label() {
    if (isLoading) return 'Starting...';
    if (isOn) return 'Party Mode On';
    return 'Start Party Mode';
  }

  function sublabel() {
    if (isLoading) return 'Requesting screen & audio access';
    if (isOn) return 'Lights are syncing to your screen & audio';
    return 'Syncs lights to your screen colors and audio in real time';
  }

  return (
    <button
      onClick={onToggle}
      disabled={isLoading}
      style={{
        ...styles.button,
        background: isOn
          ? 'linear-gradient(135deg, #7c3aed, #db2777)'
          : 'rgba(255,255,255,0.07)',
        boxShadow: isOn
          ? '0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(219,39,119,0.2)'
          : 'none',
        borderColor: isOn
          ? 'rgba(219,39,119,0.5)'
          : 'rgba(255,255,255,0.12)',
        opacity: isLoading ? 0.7 : 1,
        cursor: isLoading ? 'not-allowed' : 'pointer',
      }}
    >
      <div style={styles.icon}>{isOn ? '🎮' : '🎮'}</div>
      <div style={styles.textGroup}>
        <span style={styles.mainLabel}>{label()}</span>
        <span style={styles.subLabel}>{sublabel()}</span>
      </div>
      <div style={{ ...styles.dot, background: isOn ? '#4ade80' : '#475569' }} />
    </button>
  );
}

const styles = {
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    width: '100%',
    padding: '20px',
    border: '1px solid',
    borderRadius: '16px',
    color: '#fff',
    textAlign: 'left',
    transition: 'all 0.3s ease',
  },
  icon: {
    fontSize: '32px',
    flexShrink: 0,
  },
  textGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  mainLabel: {
    fontSize: '17px',
    fontWeight: '700',
    letterSpacing: '-0.2px',
  },
  subLabel: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background 0.3s',
  },
};
