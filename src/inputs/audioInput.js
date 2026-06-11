/**
 * audioInput.js — Audio Analysis Input
 *
 * Takes a MediaStream (from getDisplayMedia or getUserMedia) and sets up
 * a Web Audio API analyser that can sample frequency data on demand.
 *
 * Returns an object with two methods:
 *   sample()  → { energy, bass, mid, treble }  — all values 0.0–1.0
 *   destroy() → cleans up the AudioContext and disconnects everything
 *
 * How it works:
 *   The Web Audio API gives us an AnalyserNode that runs an FFT (Fast Fourier
 *   Transform) on the audio stream. The FFT output is an array of frequency
 *   bins — each bin represents a small range of Hz and its value is the
 *   loudness in that range. We group those bins into bass, mid, and treble
 *   bands and average them to get a single 0–1 value for each.
 *
 * FUTURE (Sprint 3 → 4): Could add beat detection by watching for sudden
 *   spikes in bass energy relative to the rolling average.
 */

export function createAudioAnalyser(stream) {
  const audioContext = new AudioContext();

  // Connect the stream to the analyser.
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();

  // fftSize controls frequency resolution. 256 gives 128 bins — enough to
  // distinguish bass/mid/treble without being too expensive.
  analyser.fftSize = 256;

  // Smoothing averages each sample with the previous one (0 = no smoothing,
  // 1 = never changes). 0.8 gives a responsive but not jittery reading.
  analyser.smoothingTimeConstant = 0.8;

  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount); // 128 bins

  function sample() {
    analyser.getByteFrequencyData(dataArray); // Fill dataArray with current FFT data.

    const binCount = dataArray.length;
    const binWidth = audioContext.sampleRate / analyser.fftSize; // Hz per bin

    // Calculate which bins fall into each frequency band.
    const bassEnd   = Math.max(1, Math.floor(250  / binWidth));
    const midEnd    = Math.max(bassEnd + 1, Math.floor(4000 / binWidth));

    // Average a range of bins and normalize to 0–1.
    function bandAverage(start, end) {
      let sum = 0;
      const count = end - start;
      for (let i = start; i < end; i++) sum += dataArray[i];
      return count > 0 ? sum / (count * 255) : 0;
    }

    return {
      energy: bandAverage(0, binCount),         // Overall loudness
      bass:   bandAverage(0, bassEnd),           // 0–250 Hz: kick drum, bass guitar
      mid:    bandAverage(bassEnd, midEnd),      // 250–4000 Hz: vocals, most instruments
      treble: bandAverage(midEnd, binCount),     // 4000+ Hz: hi-hats, brightness, sibilance
    };
  }

  function destroy() {
    source.disconnect();
    audioContext.close();
  }

  return { sample, destroy };
}
