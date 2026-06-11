/**
 * VibeInput
 *
 * A text box and button that lets the user describe a vibe in plain English.
 * The description is sent to the /api/vibe endpoint, which passes it to
 * Claude and fires the resulting lighting command.
 *
 * Props:
 *   onVibe    - function called with the vibe string when the user submits
 *   isLoading - boolean, true while waiting for Claude to respond
 */

export default function VibeInput({ onVibe, isLoading }) {
  function handleSubmit(e) {
    e.preventDefault();
    const input = e.target.elements.vibe;
    const value = input.value.trim();
    if (!value) return;
    onVibe(value);
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>✨ Set the Vibe</span>
        <span style={styles.hint}>Describe the moment</span>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          name="vibe"
          type="text"
          placeholder='e.g. "intense boss fight" or "chill lofi rain"'
          disabled={isLoading}
          style={styles.input}
          autoComplete="off"
        />
        <button type="submit" disabled={isLoading} style={styles.button}>
          {isLoading ? '...' : '→'}
        </button>
      </form>
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
  hint: {
    color: '#64748b',
    fontSize: '13px',
  },
  form: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
  },
  button: {
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '20px',
    width: '48px',
    cursor: 'pointer',
    flexShrink: 0,
    opacity: 1,
    transition: 'opacity 0.2s',
  },
};
