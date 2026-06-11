/**
 * StatusIndicator
 *
 * Shows whether the app is connected to LIFX, loading, or in an error state.
 * Props:
 *   status  - 'connected' | 'loading' | 'error'
 *   message - optional string to display alongside the status
 */

export default function StatusIndicator({ status, message }) {
  // Map each status to a color and label.
  const config = {
    connected: { color: '#4ade80', dot: '●', label: 'Connected' },
    loading:   { color: '#facc15', dot: '◌', label: 'Connecting...' },
    error:     { color: '#f87171', dot: '●', label: 'Error' },
  };

  const { color, dot, label } = config[status] || config.loading;

  return (
    <div style={styles.container}>
      <span style={{ ...styles.dot, color }}>{dot}</span>
      <span style={styles.text}>
        {label}
        {message && <span style={styles.message}> — {message}</span>}
      </span>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.07)',
    borderRadius: '20px',
  },
  dot: {
    fontSize: '16px',
    lineHeight: 1,
  },
  text: {
    color: '#e2e8f0',
  },
  message: {
    color: '#94a3b8',
    fontSize: '13px',
  },
};
