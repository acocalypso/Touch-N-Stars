import { defineStore } from 'pinia';

const useWorker =
  typeof Worker !== 'undefined' &&
  typeof OffscreenCanvas !== 'undefined' &&
  typeof createImageBitmap === 'function';

// Cap decoded pixel area to keep memory + JPEG-encode time bounded on phones/iPad.
// Resizing happens inside createImageBitmap with high-quality resampling, so no
// Moiré artefacts like a naive canvas drawImage downscale would produce.
const MAX_DECODE_DIM = 2000;

const decodedDimensions = (w, h) => {
  const max = Math.max(w, h);
  if (max <= MAX_DECODE_DIM) return { width: w, height: h };
  const scale = MAX_DECODE_DIM / max;
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
};

const decodeBitmap = async (blob) => {
  // Decode + downscale via canvas drawImage with imageSmoothingQuality='high'.
  // Implemented this way (instead of createImageBitmap's resizeQuality) because
  // iOS Safari / WKWebView silently ignores resizeQuality and falls back to
  // a low-quality resampler — which produces visible block artefacts after
  // contrast-stretching.
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image load failed'));
      el.src = url;
    });
    const target = decodedDimensions(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, target.width, target.height);
    const bitmap = await createImageBitmap(canvas);
    canvas.width = 0;
    canvas.height = 0;
    return bitmap;
  } finally {
    URL.revokeObjectURL(url);
  }
};

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

const applyLut = (src, dst, lut) => {
  for (let i = 0; i < src.length; i += 4) {
    dst[i] = lut[src[i]];
    dst[i + 1] = lut[src[i + 1]];
    dst[i + 2] = lut[src[i + 2]];
    dst[i + 3] = src[i + 3];
  }
};

const isDefaultStretch = (blackPoint, whitePoint, midPoint) =>
  blackPoint === 0 && whitePoint === 255 && midPoint === 127;

class WorkerEngine {
  constructor() {
    this.worker = null;
    this.nextId = 1;
    this.width = 0;
    this.height = 0;
    this.disposed = false;
    this.pending = new Map(); // id → { resolve, reject, handler }
  }

  _send(type, payload, transfer) {
    return new Promise((resolve, reject) => {
      if (this.disposed || !this.worker) {
        reject(new Error('Engine disposed'));
        return;
      }
      const id = this.nextId++;
      const handler = (event) => {
        if (event.data?.id !== id) return;
        this.worker.removeEventListener('message', handler);
        this.pending.delete(id);
        if (event.data.ok) resolve(event.data.result);
        else reject(new Error(event.data.error || 'Worker error'));
      };
      this.pending.set(id, { resolve, reject, handler });
      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ id, type, payload }, transfer || []);
    });
  }

  async init(imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image (${response.status})`);
    const blob = await response.blob();
    const bitmap = await decodeBitmap(blob);
    this.width = bitmap.width;
    this.height = bitmap.height;

    if (this.disposed) {
      bitmap.close();
      throw new Error('Engine disposed');
    }

    // Classic (non-module) worker — better WKWebView/iOS Safari compatibility.
    this.worker = new Worker(new URL('@/utils/histogramWorker.js', import.meta.url));

    // Surface load/runtime errors so init doesn't hang silently
    let workerError = null;
    const onError = (e) => {
      workerError = e?.message || e?.error?.message || 'Worker load/runtime error';
      console.error('[WorkerEngine] worker error:', workerError, e);
      this.pending.forEach(({ reject, handler }) => {
        if (this.worker) this.worker.removeEventListener('message', handler);
        reject(new Error(workerError));
      });
      this.pending.clear();
    };
    this.worker.addEventListener('error', onError);
    this.worker.addEventListener('messageerror', onError);

    try {
      const result = await this._send('init', { bitmap }, [bitmap]);
      return result.histogram;
    } catch (error) {
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
      throw error;
    }
  }

  async stretch(blackPoint, whitePoint, midPoint) {
    if (!this.worker || this.disposed) throw new Error('Engine disposed');
    const result = await this._send('stretch', { blackPoint, whitePoint, midPoint });
    return result.blob;
  }

  dispose() {
    this.disposed = true;
    // Reject all pending message promises so awaiters unblock
    this.pending.forEach(({ reject, handler }) => {
      if (this.worker) this.worker.removeEventListener('message', handler);
      reject(new Error('Engine disposed'));
    });
    this.pending.clear();
    if (this.worker) {
      try {
        this.worker.postMessage({ id: -1, type: 'dispose' });
      } catch {
        // ignore
      }
      this.worker.terminate();
      this.worker = null;
    }
  }
}

class MainEngine {
  constructor() {
    this.originalData = null;
    this.width = 0;
    this.height = 0;
    this.disposed = false;
  }

  async init(imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image (${response.status})`);
    const blob = await response.blob();
    const bitmap = await decodeBitmap(blob);
    if (this.disposed) {
      bitmap.close();
      throw new Error('Engine disposed');
    }
    this.width = bitmap.width;
    this.height = bitmap.height;
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const imageData = ctx.getImageData(0, 0, this.width, this.height);
    canvas.width = 0;
    canvas.height = 0;
    this.originalData = new Uint8ClampedArray(imageData.data);
    return computeHistogram(this.originalData);
  }

  async stretch(blackPoint, whitePoint, midPoint) {
    if (this.disposed || !this.originalData) throw new Error('Engine disposed');
    const lut = buildLut(blackPoint, whitePoint, midPoint);
    const out = new Uint8ClampedArray(this.originalData.length);
    applyLut(this.originalData, out, lut);
    const stretched = new ImageData(out, this.width, this.height);
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(stretched, 0, 0);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
        'image/jpeg',
        0.95
      );
    });
    canvas.width = 0;
    canvas.height = 0;
    return blob;
  }

  dispose() {
    this.disposed = true;
    this.originalData = null;
  }
}

const createEngine = () => (useWorker ? new WorkerEngine() : new MainEngine());

export const useHistogramStore = defineStore('histogramStore', {
  state: () => ({
    imageSettings: new Map(),
    engines: new Map(),
    pendingInits: new Map(),
    processingImages: new Set(),
    stretchTimeouts: new Map(),
    pendingStretchValues: new Map(),
  }),

  actions: {
    _ensureSettings(imageUrl) {
      if (!this.imageSettings.has(imageUrl)) {
        this.imageSettings.set(imageUrl, {
          histogram: null,
          blackPoint: 0,
          whitePoint: 255,
          midPoint: 127,
          stretchedImageData: null,
        });
      }
      return this.imageSettings.get(imageUrl);
    },

    async _initEngine(imageUrl) {
      let engine = createEngine();
      // Register engine immediately so clearImageCache can dispose it mid-init
      this.engines.set(imageUrl, engine);
      try {
        const histogram = await engine.init(imageUrl);
        if (engine.disposed) throw new Error('Engine disposed');
        const settings = this._ensureSettings(imageUrl);
        settings.histogram = histogram;
        return histogram;
      } catch (error) {
        engine.dispose();
        if (this.engines.get(imageUrl) === engine) {
          this.engines.delete(imageUrl);
        }
        if (useWorker && !engine.disposed) {
          console.warn('[HistogramStore] Worker engine failed, falling back to main thread', error);
          engine = new MainEngine();
          this.engines.set(imageUrl, engine);
          try {
            const histogram = await engine.init(imageUrl);
            if (engine.disposed) throw new Error('Engine disposed');
            const settings = this._ensureSettings(imageUrl);
            settings.histogram = histogram;
            return histogram;
          } catch (fallbackError) {
            engine.dispose();
            if (this.engines.get(imageUrl) === engine) {
              this.engines.delete(imageUrl);
            }
            throw fallbackError;
          }
        }
        throw error;
      }
    },

    async requestHistogram(imageUrl) {
      if (!imageUrl) return null;

      const settings = this._ensureSettings(imageUrl);
      if (settings.histogram) return settings.histogram;

      if (this.pendingInits.has(imageUrl)) {
        return this.pendingInits.get(imageUrl);
      }

      const promise = this._initEngine(imageUrl)
        .catch((error) => {
          console.error('[HistogramStore] requestHistogram failed', error);
          return null;
        })
        .finally(() => {
          this.pendingInits.delete(imageUrl);
        });

      this.pendingInits.set(imageUrl, promise);
      return promise;
    },

    async applyStretch(imageUrl, blackPoint, whitePoint, midPoint = 127) {
      if (!imageUrl) return;

      const settings = this._ensureSettings(imageUrl);

      const clampedBlack = Math.max(0, Math.min(254, blackPoint));
      const clampedWhite = Math.max(clampedBlack + 1, Math.min(255, whitePoint));
      const clampedMid = Math.min(Math.max(midPoint ?? 127, clampedBlack + 1), clampedWhite - 1);

      settings.blackPoint = clampedBlack;
      settings.whitePoint = clampedWhite;
      settings.midPoint = clampedMid;

      // Default values produce no visible change — clear stretched data, skip work
      if (isDefaultStretch(clampedBlack, clampedWhite, clampedMid)) {
        if (settings.stretchedImageData) {
          URL.revokeObjectURL(settings.stretchedImageData);
          settings.stretchedImageData = null;
        }
        this.pendingStretchValues.delete(imageUrl);
        return;
      }

      this.pendingStretchValues.set(imageUrl, {
        blackPoint: clampedBlack,
        whitePoint: clampedWhite,
        midPoint: clampedMid,
      });

      if (this.processingImages.has(imageUrl)) return;

      if (this.stretchTimeouts.has(imageUrl)) {
        clearTimeout(this.stretchTimeouts.get(imageUrl));
      }

      const timeoutId = setTimeout(async () => {
        this.stretchTimeouts.delete(imageUrl);

        const pending = this.pendingStretchValues.get(imageUrl);
        if (!pending) return;

        this.processingImages.add(imageUrl);
        try {
          if (!this.engines.has(imageUrl)) {
            await this.requestHistogram(imageUrl);
          }
          const engine = this.engines.get(imageUrl);
          if (!engine) return;

          const blob = await engine.stretch(
            pending.blackPoint,
            pending.whitePoint,
            pending.midPoint
          );

          const current = this.imageSettings.get(imageUrl);
          if (current) {
            if (current.stretchedImageData) {
              URL.revokeObjectURL(current.stretchedImageData);
            }
            current.stretchedImageData = URL.createObjectURL(blob);
          }
        } catch (error) {
          console.error('[HistogramStore] Stretch failed', error);
        } finally {
          this.processingImages.delete(imageUrl);

          const after = this.pendingStretchValues.get(imageUrl);
          if (
            after &&
            !this.stretchTimeouts.has(imageUrl) &&
            (after.blackPoint !== pending.blackPoint ||
              after.whitePoint !== pending.whitePoint ||
              after.midPoint !== pending.midPoint)
          ) {
            this.applyStretch(imageUrl, after.blackPoint, after.whitePoint, after.midPoint);
          }
        }
      }, 150);

      this.stretchTimeouts.set(imageUrl, timeoutId);
    },

    getHistogram(imageUrl) {
      return this.imageSettings.get(imageUrl)?.histogram || null;
    },

    getStretchSettings(imageUrl) {
      const settings = this.imageSettings.get(imageUrl);
      if (!settings) {
        return { blackPoint: 0, whitePoint: 255, midPoint: 127, stretchedImageData: null };
      }
      return {
        blackPoint: settings.blackPoint,
        whitePoint: settings.whitePoint,
        midPoint: settings.midPoint,
        stretchedImageData: settings.stretchedImageData,
      };
    },

    resetStretch(imageUrl) {
      const settings = this.imageSettings.get(imageUrl);
      if (!settings) return;
      if (settings.stretchedImageData) {
        URL.revokeObjectURL(settings.stretchedImageData);
      }
      settings.blackPoint = 0;
      settings.whitePoint = 255;
      settings.midPoint = 127;
      settings.stretchedImageData = null;
    },

    clearImageCache(imageUrl) {
      if (this.stretchTimeouts.has(imageUrl)) {
        clearTimeout(this.stretchTimeouts.get(imageUrl));
        this.stretchTimeouts.delete(imageUrl);
      }
      this.pendingStretchValues.delete(imageUrl);

      const engine = this.engines.get(imageUrl);
      if (engine) {
        engine.dispose();
        this.engines.delete(imageUrl);
      }

      const settings = this.imageSettings.get(imageUrl);
      if (settings?.stretchedImageData) {
        URL.revokeObjectURL(settings.stretchedImageData);
      }

      this.imageSettings.delete(imageUrl);
      this.processingImages.delete(imageUrl);
      this.pendingInits.delete(imageUrl);
    },

    clearAllCache() {
      this.stretchTimeouts.forEach((id) => clearTimeout(id));
      this.engines.forEach((engine) => engine.dispose());
      this.imageSettings.forEach((settings) => {
        if (settings.stretchedImageData) {
          URL.revokeObjectURL(settings.stretchedImageData);
        }
      });

      this.imageSettings.clear();
      this.engines.clear();
      this.pendingInits.clear();
      this.processingImages.clear();
      this.stretchTimeouts.clear();
      this.pendingStretchValues.clear();
    },

    isProcessing(imageUrl) {
      return this.processingImages.has(imageUrl);
    },

    isInitializing(imageUrl) {
      return this.pendingInits.has(imageUrl);
    },
  },
});
