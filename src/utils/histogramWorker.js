const clamp01 = (v) => Math.min(1, Math.max(0, v));

const buildLut = (blackPoint, whitePoint, midPoint) => {
  const range = whitePoint - blackPoint;
  const midTone = clamp01((midPoint - blackPoint) / range);
  const m = Math.min(0.999, Math.max(0.001, midTone));
  const isLinear = Math.abs(m - 0.5) < 1e-6;
  const gamma = isLinear ? 1 : Math.log(0.5) / Math.log(m);

  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    const norm = clamp01((v - blackPoint) / range);
    const transformed = isLinear ? norm : norm ** gamma;
    lut[v] = Math.round(clamp01(transformed) * 255);
  }
  return lut;
};

const computeHistogram = (data, bucketCount = 256) => {
  const histogram = new Array(bucketCount).fill(0);
  let counted = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const brightness = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const bucket = Math.min(Math.floor((brightness / 255) * (bucketCount - 1)), bucketCount - 1);
    histogram[bucket]++;
    counted++;
  }
  if (counted === 0) return histogram;
  return histogram.map((c) => (c / counted) * 100);
};

let canvas = null;
let ctx = null;
let originalData = null;
let width = 0;
let height = 0;

const dispose = () => {
  originalData = null;
  if (canvas) {
    canvas.width = 0;
    canvas.height = 0;
  }
  canvas = null;
  ctx = null;
  width = 0;
  height = 0;
};

self.onmessage = async (event) => {
  const { id, type, payload } = event.data;

  try {
    if (type === 'init') {
      const { bitmap } = payload;
      width = bitmap.width;
      height = bitmap.height;
      canvas = new OffscreenCanvas(width, height);
      ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const imageData = ctx.getImageData(0, 0, width, height);
      originalData = imageData.data;

      const histogram = computeHistogram(originalData);
      self.postMessage({ id, ok: true, result: { histogram, width, height } });
      return;
    }

    if (type === 'stretch') {
      if (!originalData || !ctx) {
        throw new Error('Worker not initialized');
      }

      const { blackPoint, whitePoint, midPoint } = payload;
      if (blackPoint >= whitePoint) {
        throw new Error('Invalid stretch range');
      }

      const lut = buildLut(blackPoint, whitePoint, midPoint);
      const out = new Uint8ClampedArray(originalData.length);
      for (let i = 0; i < originalData.length; i += 4) {
        out[i] = lut[originalData[i]];
        out[i + 1] = lut[originalData[i + 1]];
        out[i + 2] = lut[originalData[i + 2]];
        out[i + 3] = originalData[i + 3];
      }

      ctx.putImageData(new ImageData(out, width, height), 0, 0);
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 });
      self.postMessage({ id, ok: true, result: { blob } });
      return;
    }

    if (type === 'dispose') {
      dispose();
      self.postMessage({ id, ok: true });
      self.close();
      return;
    }

    throw new Error(`Unknown message type: ${type}`);
  } catch (error) {
    self.postMessage({ id, ok: false, error: error.message || String(error) });
  }
};
