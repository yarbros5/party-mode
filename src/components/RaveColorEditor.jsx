/**
 * RaveColorEditor
 *
 * Shows the current rave color palette as clickable, draggable swatches.
 * Each swatch opens a color picker. Colors can be added, removed, and reordered.
 *
 * Drag-and-drop uses the browser's built-in HTML5 drag API — no libraries needed.
 * How it works:
 *   1. User starts dragging a swatch → we record which index is being dragged.
 *   2. As they drag over other swatches → we record which index they're hovering.
 *   3. On drop → we reorder the array by moving the dragged item to the hover position.
 *
 * Props:
 *   colors         - array of hex strings, e.g. ['#ff0000', '#00ff00']
 *   onColorsChange - function called with the new colors array on any change
 */

import { useRef, useState } from 'react';

export default function RaveColorEditor({ colors, onColorsChange }) {
  const MIN_COLORS = 2;
  const MAX_COLORS = 12;

  // Track which swatch is being dragged and which one the cursor is over.
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // ── Drag handlers ─────────────────────────────────────────────────────────

  function handleDragStart(index) {
    dragIndexRef.current = index;
  }

  function handleDragOver(e, index) {
    // Must call preventDefault to allow dropping.
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(index) {
    const from = dragIndexRef.current;
    const to = index;

    // If dropped on itself, nothing to do.
    if (from === null || from === to) {
      setDragOverIndex(null);
      return;
    }

    // Build a new array with the dragged item moved to the drop position.
    const updated = [...colors];
    const [moved] = updated.splice(from, 1); // Remove from original position.
    updated.splice(to, 0, moved);             // Insert at new position.

    dragIndexRef.current = null;
    setDragOverIndex(null);
    onColorsChange(updated);
  }

  function handleDragEnd() {
    // Clean up highlight if user drops outside any swatch.
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }

  // ── Color / add / remove handlers ────────────────────────────────────────

  function handleColorChange(index, newHex) {
    const updated = [...colors];
    updated[index] = newHex;
    onColorsChange(updated);
  }

  function handleRemove(index) {
    if (colors.length <= MIN_COLORS) return;
    onColorsChange(colors.filter((_, i) => i !== index));
  }

  function handleAdd() {
    if (colors.length >= MAX_COLORS) return;
    onColorsChange([...colors, '#ffffff']);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>🎨 Rave Colors</span>
        <span style={styles.hint}>drag to reorder · {colors.length} colors</span>
      </div>

      <div style={styles.swatchRow}>
        {colors.map((hex, index) => {
          const isBeingDragged = dragIndexRef.current === index;
          const isDropTarget = dragOverIndex === index && !isBeingDragged;

          return (
            <div
              key={index}
              style={styles.swatchWrapper}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
            >
              <label
                style={{
                  ...styles.swatch,
                  background: hex,
                  // Fade out the swatch being dragged so it's clear it's "lifted".
                  opacity: isBeingDragged ? 0.3 : 1,
                  // Highlight the swatch you're about to drop onto.
                  border: isDropTarget
                    ? '2px solid #fff'
                    : '2px solid rgba(255,255,255,0.2)',
                  transform: isDropTarget ? 'scale(1.15)' : 'scale(1)',
                  cursor: 'grab',
                }}
              >
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  style={styles.hiddenInput}
                />
              </label>

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
          );
        })}

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
    transition: 'transform 0.15s, border-color 0.15s, opacity 0.15s',
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
