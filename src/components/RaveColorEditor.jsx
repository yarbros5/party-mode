/**
 * RaveColorEditor
 *
 * Shows the current rave color palette as clickable swatches.
 * Each swatch opens a color picker. Colors can be added or removed.
 *
 * Props:
 *   colors      - array of hex strings, e.g. ['#ff0000', '#00ff00']
 *   onColorsChange - function called with the new colors array on any change
 */

export default function RaveColorEditor({ colors, onColorsChange }) {
  const MIN_COLORS = 2;
  const MAX_COLORS = 12;

  // Replace the color at a given index with a new hex value.
  function handleColorChange(index, newHex) {
    const updated = [...colors];
    updated[index] = newHex;
    onColorsChange(updated);
  }

  // Remove the color at a given index.
  function handleRemove(index) {
    if (colors.length <= MIN_COLORS) return; // Never go below minimum.
    const updated = colors.filter((_, i) => i !== index);
    onColorsChange(updated);
  }

  // Add a new color (default: white) at the end of the list.
  function handleAdd() {
    if (colors.length >= MAX_COLORS) return;
    onColorsChange([...colors, '#ffffff']);
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>🎨 Rave Colors</span>
        <span style={styles.hint}>{colors.length} colors</span>
      </div>

      <div style={styles.swatchRow}>
        {colors.map((hex, index) => (
          <div key={index} style={styles.swatchWrapper}>
            {/* The colored swatch — clicking it opens the hidden color input */}
            <label style={{ ...styles.swatch, background: hex }}>
              <input
                type="color"
                value={hex}
                onChange={(e) => handleColorChange(index, e.target.value)}
                style={styles.hiddenInput}
              />
            </label>

            {/* Remove button — only shown when we have more than the minimum */}
            {colors.length > MIN_COLORS && (
              <button
                onClick={() => handleRemove(index)}
                style={styles.removeButton}
                title="Remove color"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Add button — only shown when we're under the maximum */}
        {colors.length < MAX_COLORS && (
          <button onClick={handleAdd} style={styles.addButton} title="Add color">
            +
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
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
  swatchRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    alignItems: 'center',
  },
  swatchWrapper: {
    position: 'relative',
  },
  swatch: {
    display: 'block',
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    border: '2px solid rgba(255,255,255,0.2)',
    cursor: 'pointer',
    transition: 'transform 0.15s, border-color 0.15s',
  },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
  removeButton: {
    position: 'absolute',
    top: '-7px',
    right: '-7px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: '#ef4444',
    border: 'none',
    color: '#fff',
    fontSize: '13px',
    lineHeight: '18px',
    textAlign: 'center',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    border: '2px dashed rgba(255,255,255,0.25)',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'border-color 0.15s, color 0.15s',
  },
};
