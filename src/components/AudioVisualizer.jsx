/**
 * AudioVisualizer
 *
 * Displays a real-time bar chart of audio energy levels.
 * Renders directly to a <canvas> using requestAnimationFrame —
 * no React state updates, so it's smooth without causing re-renders.
 *
 * Props:
 *   analyser - the object returned by createAudioAnalyser(), or null if
 *              no audio stream is active
 */

import { useEffect, useRef } from 'react';

const BARS = [
  { key: 'bass',   label: 'Bass',   color: '#f97316' },
  { key: 'mid',    label: 'Mid',    color: '#a78bfa' },
  { key: 'treble', label: 'Treble', color: '#38bdf8' },
  { key: 'energy', label: 'Energy', color: '#4ade80' },
];

export default function AudioVisualizer({ analyser }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function draw() {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // If no analyser, draw empty bars.
      const data = analyser ? analyser.sample() : { energy: 0, bass: 0, mid: 0, treble: 0 };

      const barWidth = width / BARS.length;
      const gap = 6;

      BARS.forEach(({ key, label, color }, i) => {
        const value = data[key] ?? 0;
        const barH = Math.max(2, value * (height - 24)); // Leave room for label
        const x = i * barWidth + gap / 2;
        const w = barWidth - gap;
        const y = height - barH - 20;

        // Bar fill
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.roundRect(x, y, w, barH, 4);
        ctx.fill();

        // Background track
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.roundRect(x, 0, w, height - 22, 4);
        ctx.fill();

        // Re-draw bar on top of track
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.roundRect(x, y, w, barH, 4);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w / 2, height - 4);
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser]);

  return (
    <div style={styles.container}>
      <span style={styles.label}>🎵 Audio</span>
      <canvas
        ref={canvasRef}
        width={200}
        height={80}
        style={styles.canvas}
      />
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
  canvas: {
    width: '100%',
    height: '80px',
    borderRadius: '8px',
  },
};
