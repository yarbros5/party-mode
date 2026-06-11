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

import { useState } from 'react';

export default function VibeInput({ onVibe, isLoading }) {
  const [value, setValue] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onVibe(trimmed);
  }

  function handleClear() {
    setValue('');
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>✨ Set the Vibe</span>
        <span style={styles.hint}>Describe the moment</span>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputWrapper}>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='e.g. "intense boss fight" or "chill lofi rain"'
            disabled={isLoading}
            spellCheck={true}
            autoComplete="off"
            style={styles.input}
          />
          {/* Clear button — only visible when there's text */}
          {value.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              style={styles.clearButton}
              tabIndex={-1}
            >
              ×
            </button>
          )}
        </div>
        <button type="submit" disabled={isLoading} style={styles.submitButton}>
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
  inputWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    // Extra right padding so text doesn't run under the clear button.
    padding: '12px 36px 12px 14px',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
  },
  clearButton: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '18px',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 2px',
  },
  submitButton: {
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '20px',
    width: '48px',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'opacity 0.2s',
  },
};
