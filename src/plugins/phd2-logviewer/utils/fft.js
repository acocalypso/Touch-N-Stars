// Cooley-Tukey radix-2 FFT with Hann window.
// Returns { frequencies (Hz), magnitudes (arcsec or px), periods (seconds) }

function nextPow2(n) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function fftInPlace(re, im) {
  const n = re.length;
  // Bit-reverse permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  // Butterfly passes
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const ang = -Math.PI / half;
    const dwRe = Math.cos(ang);
    const dwIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1,
        wIm = 0;
      for (let k = 0; k < half; k++) {
        const uRe = re[i + k],
          uIm = im[i + k];
        const vRe = re[i + k + half] * wRe - im[i + k + half] * wIm;
        const vIm = re[i + k + half] * wIm + im[i + k + half] * wRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + half] = uRe - vRe;
        im[i + k + half] = uIm - vIm;
        const nwRe = wRe * dwRe - wIm * dwIm;
        wIm = wRe * dwIm + wIm * dwRe;
        wRe = nwRe;
      }
    }
  }
}

// signal: array of RA error values
// sampleInterval: mean time between frames in seconds
export function computeFFT(signal, sampleInterval) {
  if (signal.length < 8) return null;

  const n = nextPow2(signal.length);
  const re = new Float64Array(n);
  const im = new Float64Array(n);

  // Apply Hann window to reduce spectral leakage
  for (let i = 0; i < signal.length; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (signal.length - 1)));
    re[i] = signal[i] * w;
  }

  fftInPlace(re, im);

  // Build output — positive frequencies only, skip DC (i=0)
  const halfN = n >> 1;
  const freqs = [];
  const mags = [];
  const periods = [];

  for (let i = 1; i < halfN; i++) {
    const freq = i / (n * sampleInterval); // Hz
    const mag = (2 * Math.sqrt(re[i] ** 2 + im[i] ** 2)) / signal.length;
    freqs.push(freq);
    mags.push(mag);
    periods.push(1 / freq); // seconds
  }

  return { frequencies: freqs, magnitudes: mags, periods };
}
