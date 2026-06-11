/**
 * PowerToggle
 *
 * A large on/off button for the Game Room lights.
 * Props:
 *   isOn      - boolean, current power state
 *   onToggle  - function called when user clicks (receives no arguments;
 *               the parent decides what to do)
 *   disabled  - boolean, grays out the button while a request is in flight
 */

export default function PowerToggle({ isOn, onToggle, disabled }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        ...styles.button,
        background: isOn
          ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
          : 'rgba(255,255,255,0.1)',
        boxShadow: isOn
          ? '0 0 30px rgba(124, 58, 237, 0.5)'
          : 'none',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span style={styles.icon}>{isOn ? '💡' : '🌑'}</span>
      <span style={styles.label}>{isOn ? 'Lights On' : 'Lights Off'}</span>
    </button>
  );
}

const styles = {
  button: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '28px 48px',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '16px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    width: '100%',
  },
  icon: {
    fontSize: '40px',
  },
  label: {
    letterSpacing: '0.05em',
  },
};
