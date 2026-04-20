import { nextTick, ref, watch } from 'vue';

const PREVIEWABLE_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tif', 'tiff'];
const FITS_EXTENSIONS = ['fit', 'fits', 'fts'];
const BAYER_PATTERNS = new Set(['RGGB', 'BGGR', 'GRBG', 'GBRG']);

export function useFitsPreview({ apiService }) {
  const previewVisible = ref(false);
  const previewUrl = ref('');
  const previewFileName = ref('');
  const previewMode = ref('image');
  const previewLoading = ref(false);
  const previewError = ref('');

  const fitsCanvasRef = ref(null);
  const fitsPrepared = ref(null);
  const fitsStretchMode = ref('asinh');
  const fitsStretchStrength = ref(6);
  const fitsStats = ref(null);
  const fitsHeaderEntries = ref([]);
  const fitsPerf = ref(createEmptyFitsPerf());

  let fitsRenderFrame = 0;
  let fitsImageData = null;

  function createEmptyFitsPerf() {
    return {
      prepareMs: 0,
      parseMs: 0,
      decodeMs: 0,
      demosaicMs: 0,
      renderMs: 0,
      renderCount: 0,
      queueSkips: 0,
      lastReason: 'idle',
    };
  }

  function getFileExtension(name) {
    return String(name || '')
      .split('.')
      .pop()
      ?.toLowerCase();
  }

  function isPreviewableImage(fileName) {
    return PREVIEWABLE_IMAGE_EXTENSIONS.includes(getFileExtension(fileName));
  }

  function isFitsFile(fileName) {
    return FITS_EXTENSIONS.includes(getFileExtension(fileName));
  }

  function setFitsCanvasRef(el) {
    fitsCanvasRef.value = el;
  }

  function closePreview() {
    if (fitsRenderFrame) {
      cancelAnimationFrame(fitsRenderFrame);
      fitsRenderFrame = 0;
    }

    fitsImageData = null;
    previewVisible.value = false;
    previewUrl.value = '';
    previewFileName.value = '';
    previewMode.value = 'image';
    previewLoading.value = false;
    previewError.value = '';
    fitsPrepared.value = null;
    fitsStats.value = null;
    fitsHeaderEntries.value = [];
    fitsPerf.value = createEmptyFitsPerf();
  }

  function parseFitsValue(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith("'")) {
      return trimmed.replace(/^'/, '').replace(/'$/, '').trim();
    }

    if (trimmed === 'T') {
      return true;
    }

    if (trimmed === 'F') {
      return false;
    }

    const numberValue = Number(trimmed);
    return Number.isNaN(numberValue) ? trimmed : numberValue;
  }

  function parseFitsHeader(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('ascii');
    const header = {};

    let offset = 0;
    while (offset + 80 <= bytes.length) {
      const card = decoder.decode(bytes.slice(offset, offset + 80));
      const key = card.slice(0, 8).trim();

      if (key === 'END') {
        offset += 80;
        break;
      }

      if (card[8] === '=') {
        const valuePart = card.slice(10, 80).split('/')[0] || '';
        header[key] = parseFitsValue(valuePart);
      }

      offset += 80;
    }

    const dataOffset = Math.ceil(offset / 2880) * 2880;
    return { header, dataOffset };
  }

  function readFitsPixel(dataView, bitpix, byteOffset) {
    switch (bitpix) {
      case 8:
        return dataView.getUint8(byteOffset);
      case 16:
        return dataView.getInt16(byteOffset, false);
      case 32:
        return dataView.getInt32(byteOffset, false);
      case -32:
        return dataView.getFloat32(byteOffset, false);
      case -64:
        return dataView.getFloat64(byteOffset, false);
      default:
        throw new Error(`Unsupported FITS BITPIX: ${bitpix}`);
    }
  }

  function bitpixSize(bitpix) {
    return Math.abs(bitpix) / 8;
  }

  function buildFitsHeaderEntries(header, maxEntries = 40) {
    const preferred = [
      'BAYERPAT',
      'BAYERPATTERN',
      'BITPIX',
      'NAXIS',
      'NAXIS1',
      'NAXIS2',
      'BSCALE',
      'BZERO',
      'EXPTIME',
      'GAIN',
      'OFFSET',
      'XBINNING',
      'YBINNING',
      'XPIXSZ',
      'YPIXSZ',
      'FILTER',
      'CAMERA',
      'INSTRUME',
      'OBJECT',
      'DATE-OBS',
      'RA',
      'DEC',
    ];

    const preferredSet = new Set(preferred);
    const orderedKeys = [
      ...preferred.filter((key) => key in header),
      ...Object.keys(header).filter((key) => !preferredSet.has(key)),
    ].slice(0, maxEntries);

    return orderedKeys.map((key) => ({
      key,
      value: String(header[key]),
    }));
  }

  function getFitsBayerPattern(header) {
    const rawPattern = String(header.BAYERPAT || header.BAYERPATTERN || '')
      .trim()
      .toUpperCase();
    return BAYER_PATTERNS.has(rawPattern) ? rawPattern : '';
  }

  function getBayerColor(pattern, x, y) {
    const xx = x & 1;
    const yy = y & 1;

    switch (pattern) {
      case 'RGGB':
        return yy === 0 ? (xx === 0 ? 'R' : 'G') : xx === 0 ? 'G' : 'B';
      case 'BGGR':
        return yy === 0 ? (xx === 0 ? 'B' : 'G') : xx === 0 ? 'G' : 'R';
      case 'GRBG':
        return yy === 0 ? (xx === 0 ? 'G' : 'R') : xx === 0 ? 'B' : 'G';
      case 'GBRG':
        return yy === 0 ? (xx === 0 ? 'G' : 'B') : xx === 0 ? 'R' : 'G';
      default:
        return 'G';
    }
  }

  function averageAtOffsets(values, width, height, x, y, offsets, fallback) {
    let sum = 0;
    let count = 0;

    for (const [dx, dy] of offsets) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= width || yy >= height) {
        continue;
      }

      sum += values[yy * width + xx];
      count += 1;
    }

    return count ? sum / count : fallback;
  }

  function clampToByte(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  function createStretchMapper(low, high, mode, strength) {
    const range = Math.max(1e-9, high - low);
    const safeStrength = Math.max(1e-3, Number(strength) || 1);

    const normalize = (value) => Math.max(0, Math.min(1, (value - low) / range));

    if (mode === 'sqrt') {
      return (value) => Math.sqrt(normalize(value));
    }

    if (mode === 'log') {
      const denom = Math.log1p(safeStrength);
      return (value) => Math.log1p(safeStrength * normalize(value)) / denom;
    }

    if (mode === 'asinh') {
      const denom = Math.asinh(safeStrength);
      return (value) => Math.asinh(safeStrength * normalize(value)) / denom;
    }

    return (value) => normalize(value);
  }

  function buildDebayerChannels(values, width, height, pattern) {
    const rChannel = new Float32Array(width * height);
    const gChannel = new Float32Array(width * height);
    const bChannel = new Float32Array(width * height);

    const cardinal = [
      [0, -1],
      [-1, 0],
      [1, 0],
      [0, 1],
    ];
    const diagonal = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ];
    const horizontal = [
      [-1, 0],
      [1, 0],
    ];
    const vertical = [
      [0, -1],
      [0, 1],
    ];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = y * width + x;
        const center = values[srcIndex];
        const color = getBayerColor(pattern, x, y);

        let r = center;
        let g = center;
        let b = center;

        if (color === 'R') {
          g = averageAtOffsets(values, width, height, x, y, cardinal, center);
          b = averageAtOffsets(values, width, height, x, y, diagonal, center);
        } else if (color === 'B') {
          g = averageAtOffsets(values, width, height, x, y, cardinal, center);
          r = averageAtOffsets(values, width, height, x, y, diagonal, center);
        } else {
          const neighborX = x + 1 < width ? x + 1 : x - 1;
          const horizontalColor = getBayerColor(pattern, Math.max(0, neighborX), y);
          if (horizontalColor === 'R') {
            r = averageAtOffsets(values, width, height, x, y, horizontal, center);
            b = averageAtOffsets(values, width, height, x, y, vertical, center);
          } else {
            r = averageAtOffsets(values, width, height, x, y, vertical, center);
            b = averageAtOffsets(values, width, height, x, y, horizontal, center);
          }
        }

        rChannel[srcIndex] = r;
        gChannel[srcIndex] = g;
        bChannel[srcIndex] = b;
      }
    }

    return {
      rChannel,
      gChannel,
      bChannel,
    };
  }

  function percentileFromSorted(values, p) {
    if (!values.length) {
      return 0;
    }

    const index = Math.min(values.length - 1, Math.max(0, Math.floor(p * (values.length - 1))));
    return values[index];
  }

  function prepareFitsRenderData(arrayBuffer) {
    const prepareStart = performance.now();
    const parseStart = performance.now();
    const { header, dataOffset } = parseFitsHeader(arrayBuffer);
    const parseMs = performance.now() - parseStart;

    const width = Number(header.NAXIS1 || 0);
    const height = Number(header.NAXIS2 || 0);
    const bitpix = Number(header.BITPIX || 0);
    const bzero = Number(header.BZERO ?? 0);
    const bscale = Number(header.BSCALE ?? 1);

    if (!width || !height || !bitpix) {
      throw new Error('Invalid FITS header (missing NAXIS1/NAXIS2/BITPIX)');
    }

    const pixelBytes = bitpixSize(bitpix);
    if (!pixelBytes) {
      throw new Error(`Unsupported FITS BITPIX: ${bitpix}`);
    }

    const pixelCount = width * height;
    const availableBytes = arrayBuffer.byteLength - dataOffset;
    const requiredBytes = pixelCount * pixelBytes;
    if (availableBytes < requiredBytes) {
      throw new Error('FITS file is truncated');
    }

    const decodeStart = performance.now();
    const dataView = new DataView(arrayBuffer, dataOffset);
    const values = new Float32Array(pixelCount);
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    let sum = 0;
    let sumSq = 0;

    for (let i = 0; i < pixelCount; i++) {
      const raw = readFitsPixel(dataView, bitpix, i * pixelBytes);
      const scaled = raw * bscale + bzero;
      const safe = Number.isFinite(scaled) ? scaled : 0;
      values[i] = safe;
      if (safe < min) {
        min = safe;
      }
      if (safe > max) {
        max = safe;
      }
      sum += safe;
      sumSq += safe * safe;
    }
    const decodeMs = performance.now() - decodeStart;

    const bayerPattern = getFitsBayerPattern(header);
    const sample = [];
    const sampleStep = Math.max(1, Math.floor(values.length / 50000));
    for (let i = 0; i < values.length; i += sampleStep) {
      const value = values[i];
      if (Number.isFinite(value)) {
        sample.push(value);
      }
    }

    sample.sort((a, b) => a - b);
    let low = percentileFromSorted(sample, 0.01);
    let high = percentileFromSorted(sample, 0.995);
    if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) {
      low = 0;
      high = 1;
    }

    const mean = sum / Math.max(1, pixelCount);
    const variance = Math.max(0, sumSq / Math.max(1, pixelCount) - mean * mean);
    const std = Math.sqrt(variance);

    let demosaicMs = 0;
    let debayeredChannels = null;
    if (bayerPattern) {
      const demosaicStart = performance.now();
      debayeredChannels = buildDebayerChannels(values, width, height, bayerPattern);
      demosaicMs = performance.now() - demosaicStart;
    }

    return {
      width,
      height,
      bitpix,
      bayerPattern,
      low,
      high,
      min,
      max,
      mean,
      std,
      monoValues: bayerPattern ? null : values,
      debayeredChannels,
      headerEntries: buildFitsHeaderEntries(header),
      perf: {
        prepareMs: performance.now() - prepareStart,
        parseMs,
        decodeMs,
        demosaicMs,
      },
    };
  }

  function renderPreparedFitsToCanvas(prepared, canvas, options = {}) {
    const renderStart = performance.now();
    const {
      width,
      height,
      bitpix,
      bayerPattern,
      low,
      high,
      min,
      max,
      mean,
      std,
      monoValues,
      debayeredChannels,
    } = prepared;

    const stretchMode = options.stretchMode || 'asinh';
    const stretchStrength = Number(options.stretchStrength) || 1;
    const stretchLow = stretchMode === 'linear' ? min : low;
    const stretchHigh = stretchMode === 'linear' ? max : high;
    const mapValueToUnit = createStretchMapper(
      stretchLow,
      stretchHigh,
      stretchMode,
      stretchStrength
    );

    const curveMapper = createStretchMapper(0, 1, stretchMode, stretchStrength);
    const curveSamples = {
      p10: curveMapper(0.1),
      p50: curveMapper(0.5),
      p90: curveMapper(0.9),
    };

    if (!fitsImageData || fitsImageData.width !== width || fitsImageData.height !== height) {
      fitsImageData = new ImageData(width, height);
    }

    const pixels = fitsImageData.data;
    if (bayerPattern && debayeredChannels) {
      const { rChannel, gChannel, bChannel } = debayeredChannels;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcIndex = y * width + x;
          const dstIndex = ((height - 1 - y) * width + x) * 4;
          pixels[dstIndex] = clampToByte(mapValueToUnit(rChannel[srcIndex]) * 255);
          pixels[dstIndex + 1] = clampToByte(mapValueToUnit(gChannel[srcIndex]) * 255);
          pixels[dstIndex + 2] = clampToByte(mapValueToUnit(bChannel[srcIndex]) * 255);
          pixels[dstIndex + 3] = 255;
        }
      }
    } else {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcIndex = y * width + x;
          const dstIndex = ((height - 1 - y) * width + x) * 4;
          const gray = clampToByte(mapValueToUnit(monoValues[srcIndex]) * 255);
          pixels[dstIndex] = gray;
          pixels[dstIndex + 1] = gray;
          pixels[dstIndex + 2] = gray;
          pixels[dstIndex + 3] = 255;
        }
      }
    }

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to render FITS preview');
    }

    ctx.putImageData(fitsImageData, 0, 0);

    return {
      stats: {
        width,
        height,
        bitpix,
        bayerPattern,
        stretchMode,
        stretchStrength,
        low: stretchLow,
        high: stretchHigh,
        clippedLow: low,
        clippedHigh: high,
        min,
        max,
        mean,
        std,
        curveSamples,
      },
      renderMs: performance.now() - renderStart,
    };
  }

  function renderCurrentFitsBuffer(reason = 'render') {
    if (!fitsPrepared.value || !fitsCanvasRef.value) {
      return;
    }

    const result = renderPreparedFitsToCanvas(fitsPrepared.value, fitsCanvasRef.value, {
      stretchMode: fitsStretchMode.value,
      stretchStrength: fitsStretchStrength.value,
    });

    fitsStats.value = result?.stats || null;
    fitsPerf.value = {
      ...fitsPerf.value,
      renderMs: result?.renderMs || 0,
      renderCount: fitsPerf.value.renderCount + 1,
      lastReason: reason,
    };
  }

  function scheduleFitsRender(reason = 'update') {
    if (!fitsPrepared.value || !fitsCanvasRef.value) {
      return;
    }

    if (fitsRenderFrame) {
      fitsPerf.value = {
        ...fitsPerf.value,
        queueSkips: fitsPerf.value.queueSkips + 1,
        lastReason: `queued:${reason}`,
      };
      return;
    }

    fitsRenderFrame = requestAnimationFrame(() => {
      fitsRenderFrame = 0;
      try {
        renderCurrentFitsBuffer(reason);
      } catch (error) {
        previewError.value = error?.message || 'Failed to render FITS preview';
      }
    });
  }

  async function openFitsFile(file) {
    previewFileName.value = file.name || file.path;
    previewMode.value = 'fits';
    previewVisible.value = true;
    previewUrl.value = '';
    previewLoading.value = true;
    previewError.value = '';

    try {
      const buffer = await apiService.fetchFilesystemFileBuffer(file.path);
      const prepared = prepareFitsRenderData(buffer);
      fitsPrepared.value = prepared;
      fitsHeaderEntries.value = prepared.headerEntries;
      fitsPerf.value = {
        ...fitsPerf.value,
        prepareMs: prepared.perf.prepareMs,
        parseMs: prepared.perf.parseMs,
        decodeMs: prepared.perf.decodeMs,
        demosaicMs: prepared.perf.demosaicMs,
        renderMs: 0,
        renderCount: 0,
        queueSkips: 0,
        lastReason: 'prepared',
      };

      previewLoading.value = false;
      await nextTick();

      if (!fitsCanvasRef.value) {
        throw new Error('FITS canvas is not available');
      }

      renderCurrentFitsBuffer('initial-open');
    } catch (error) {
      previewError.value = error?.message || 'Failed to render FITS preview';
      fitsPrepared.value = null;
      fitsImageData = null;
      fitsStats.value = null;
      fitsHeaderEntries.value = [];
    } finally {
      previewLoading.value = false;
    }
  }

  function openFile(file) {
    if (!file?.path) {
      return;
    }

    if (isFitsFile(file.name)) {
      openFitsFile(file);
      return;
    }

    const streamUrl = apiService.getFilesystemFileStreamUrl(file.path);

    if (isPreviewableImage(file.name)) {
      previewFileName.value = file.name || file.path;
      previewUrl.value = streamUrl;
      previewMode.value = 'image';
      previewLoading.value = false;
      previewError.value = '';
      previewVisible.value = true;
      return;
    }

    window.open(streamUrl, '_blank', 'noopener');
  }

  function handlePreviewError() {
    if (previewMode.value !== 'image') {
      return;
    }

    const fallbackUrl = previewUrl.value;
    closePreview();
    if (fallbackUrl) {
      window.open(fallbackUrl, '_blank', 'noopener');
    }
  }

  watch([fitsStretchMode, fitsStretchStrength], () => {
    if (
      !previewVisible.value ||
      previewMode.value !== 'fits' ||
      previewLoading.value ||
      previewError.value
    ) {
      return;
    }

    scheduleFitsRender('stretch-change');
  });

  return {
    previewVisible,
    previewUrl,
    previewFileName,
    previewMode,
    previewLoading,
    previewError,
    fitsStretchMode,
    fitsStretchStrength,
    fitsStats,
    fitsHeaderEntries,
    fitsPerf,
    closePreview,
    openFile,
    handlePreviewError,
    setFitsCanvasRef,
  };
}
