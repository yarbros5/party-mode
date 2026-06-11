/**
 * screenInput.js — Screen Color Sampling Input
 *
 * Takes a video MediaStream (from getDisplayMedia) and extracts the 3
 * dominant colors from the current frame on demand.
 *
 * Returns an object with two methods:
 *   sample()  → ['#rrggbb', '#rrggbb', '#rrggbb'] — 3 dominant hex colors
 *   destroy() → stops the video and cleans up
 *
 * How it works:
 *   1. Draw the video frame to a small canvas (faster than full resolution)
 *   2. Read all pixel data with getImageData
 *   3. Round each pixel's RGB values to the nearest bucket (reduces ~16M
 *      possible colors down to a few hundred distinct ones)
 *   4. Count how many pixels fall into each bucket
 *   5. Return the 3 most common buckets as hex colors
 *
 *   This is called "color quantization". It's simple enough to read in one
 *   sitting but produces surprisingly good dominant color results.
 *
 * FUTURE (Sprint 4): Could compare frames to detect scene changes
 *   (big color shift = cut/explosion) and give Claude a motion signal.
 */

export function createScreenSampler(stream) {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.muted = true;
  video.play();

  // Small canvas — 100×56 pixels preserves 16:9 ratio and is fast to process.
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 56;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Converts an [r, g, b] array to a '#rrggbb' hex string.
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  function sample() {
    if (video.readyState < 2) {
      return ['#000000', '#000000', '#000000'];
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Count pixels by color bucket. We round to the nearest 32 in each channel,
    // which gives us buckets of size 32×32×32 — coarse enough to group similar
    // colors together, fine enough to distinguish red from orange.
    const bucketSize = 32;
    const counts = {};

    for (let i = 0; i < data.length; i += 4) {
      const r = Math.round(data[i]     / bucketSize) * bucketSize;
      const g = Math.round(data[i + 1] / bucketSize) * bucketSize;
      const b = Math.round(data[i + 2] / bucketSize) * bucketSize;

      // Skip near-black and near-white pixels — they're usually UI chrome,
      // not meaningful game colors.
      const brightness = (r + g + b) / 3;
      if (brightness < 20 || brightness > 235) continue;

      const key = `${r},${g},${b}`;
      counts[key] = (counts[key] || 0) + 1;
    }

    // Sort buckets by count (most common first) and take the top 3.
    const top3 = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => {
        const [r, g, b] = key.split(',').map(Number);
        return rgbToHex(r, g, b);
      });

    // Pad to 3 colors if fewer than 3 distinct colors were found.
    while (top3.length < 3) top3.push('#111111');

    return top3;
  }

  function destroy() {
    video.pause();
    video.srcObject = null;
  }

  return { sample, destroy };
}
