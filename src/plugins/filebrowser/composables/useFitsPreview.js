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
  const fitsAutoWhiteBalance = ref(true);
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

  function parseFitsHeaderAt(arrayBuffer, startOffset = 0) {
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('ascii');
    const header = {};

    let offset = startOffset;
    let foundEnd = false;

    while (offset + 80 <= bytes.length) {
      const card = decoder.decode(bytes.slice(offset, offset + 80));
      const key = card.slice(0, 8).trim();

      if (key === 'END') {
        offset += 80;
        foundEnd = true;
        break;
      }

      if (card[8] === '=') {
        const valuePart = card.slice(10, 80).split('/')[0] || '';
        header[key] = parseFitsValue(valuePart);
      }

      offset += 80;
    }

    if (!foundEnd) {
      throw new Error('Invalid FITS header block');
    }

    const headerBytes = offset - startOffset;
    const paddedHeaderBytes = Math.ceil(headerBytes / 2880) * 2880;

    return {
      header,
      headerBytes,
      paddedHeaderBytes,
      nextOffset: startOffset + paddedHeaderBytes,
    };
  }

  function toFiniteNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function estimateHduDataBytes(header) {
    const bitpix = toFiniteNumber(header.BITPIX, 0);
    const naxis = Math.max(0, Math.floor(toFiniteNumber(header.NAXIS, 0)));
    const pcount = Math.max(0, Math.floor(toFiniteNumber(header.PCOUNT, 0)));
    const gcount = Math.max(1, Math.floor(toFiniteNumber(header.GCOUNT, 1)));
    const pixelBytes = Math.abs(bitpix) / 8;

    if (!bitpix || !pixelBytes || !naxis) {
      return 0;
    }

    let pixelCount = 1;
    for (let axis = 1; axis <= naxis; axis++) {
      const axisLen = Math.max(0, Math.floor(toFiniteNumber(header[`NAXIS${axis}`], 0)));
      if (!axisLen) {
        pixelCount = 0;
        break;
      }
      pixelCount *= axisLen;
    }

    if (!pixelCount) {
      return 0;
    }

    return (pixelCount + pcount) * gcount * pixelBytes;
  }

  function selectImageHdu(arrayBuffer) {
    let offset = 0;
    const byteLength = arrayBuffer.byteLength;
    let fallbackHeader = null;

    while (offset + 80 <= byteLength) {
      const parsed = parseFitsHeaderAt(arrayBuffer, offset);
      const { header } = parsed;

      if (!fallbackHeader) {
        fallbackHeader = {
          header,
          dataOffset: parsed.nextOffset,
        };
      }

      const hasGeometry = Number(header.NAXIS1) > 0 && Number(header.NAXIS2) > 0;
      const hasBitpix = Number.isFinite(Number(header.BITPIX)) && Number(header.BITPIX) !== 0;
      const naxis = Number(header.NAXIS || 0);
      if (hasGeometry && hasBitpix && naxis >= 2) {
        return {
          header,
          dataOffset: parsed.nextOffset,
          headerSource: 'hdu-geometry',
        };
      }

      const dataBytes = estimateHduDataBytes(header);
      const paddedDataBytes = Math.ceil(dataBytes / 2880) * 2880;
      const next = parsed.nextOffset + paddedDataBytes;

      if (next <= offset) {
        break;
      }

      offset = next;
    }

    if (!fallbackHeader) {
      throw new Error('Invalid FITS file structure');
    }

    return {
      ...fallbackHeader,
      headerSource: 'fallback-first-hdu',
    };
  }

  function inferImageGeometry(header, availableBytes) {
    const inferred = [];

    let bitpix = Number(header.BITPIX);
    if (!Number.isFinite(bitpix) || bitpix === 0) {
      bitpix = 16;
      inferred.push('BITPIX');
    }

    let pixelBytes = Math.abs(bitpix) / 8;
    if (!pixelBytes) {
      bitpix = 16;
      pixelBytes = 2;
      inferred.push('BITPIX');
    }

    let width = Math.floor(Number(header.NAXIS1));
    let height = Math.floor(Number(header.NAXIS2));

    if (width > 0 && height <= 0) {
      height = Math.max(1, Math.floor(availableBytes / (pixelBytes * width)));
      inferred.push('NAXIS2');
    } else if (height > 0 && width <= 0) {
      width = Math.max(1, Math.floor(availableBytes / (pixelBytes * height)));
      inferred.push('NAXIS1');
    } else if (width <= 0 && height <= 0) {
      const pixels = Math.max(1, Math.floor(availableBytes / pixelBytes));
      const side = Math.max(1, Math.floor(Math.sqrt(pixels)));
      width = side;
      height = Math.max(1, Math.floor(pixels / side));
      inferred.push('NAXIS1', 'NAXIS2');
    }

    const maxPixels = Math.floor(availableBytes / pixelBytes);
    if (width * height > maxPixels && width > 0) {
      height = Math.max(1, Math.floor(maxPixels / width));
      if (!inferred.includes('NAXIS2')) {
        inferred.push('NAXIS2');
      }
    }

    if (width <= 0 || height <= 0) {
      throw new Error('Unable to infer FITS image dimensions');
    }

    return {
      bitpix,
      width,
      height,
      inferred,
    };
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
    const parsedStrength = Number(strength);
    const safeStrength = Math.max(1e-3, Number.isFinite(parsedStrength) ? parsedStrength : 1);

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

  function computeAutoWhiteBalanceGains(channels, low, high) {
    if (!channels) {
      return { r: 1, g: 1, b: 1 };
    }

    const { rChannel, gChannel, bChannel } = channels;
    const total = rChannel.length;
    const sampleStep = Math.max(1, Math.floor(total / 50000));

    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let count = 0;

    for (let i = 0; i < total; i += sampleStep) {
      const r = rChannel[i];
      const g = gChannel[i];
      const b = bChannel[i];
      const avg = (r + g + b) / 3;

      if (!Number.isFinite(avg) || avg < low || avg > high) {
        continue;
      }

      sumR += r;
      sumG += g;
      sumB += b;
      count += 1;
    }

    if (!count) {
      return { r: 1, g: 1, b: 1 };
    }

    const meanR = sumR / count;
    const meanG = sumG / count;
    const meanB = sumB / count;
    const target = (meanR + meanG + meanB) / 3;

    const clampGain = (value) => Math.max(0.2, Math.min(5, value));

    const gainR = meanR > 0 ? clampGain(target / meanR) : 1;
    const gainG = meanG > 0 ? clampGain(target / meanG) : 1;
    const gainB = meanB > 0 ? clampGain(target / meanB) : 1;

    return {
      r: gainR,
      g: gainG,
      b: gainB,
    };
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
    const { header, dataOffset, headerSource } = selectImageHdu(arrayBuffer);
    const parseMs = performance.now() - parseStart;

    const bzero = Number(header.BZERO ?? 0);
    const bscale = Number(header.BSCALE ?? 1);

    const availableBytes = arrayBuffer.byteLength - dataOffset;

    const geometry = inferImageGeometry(header, Math.max(0, availableBytes));
    const bitpix = geometry.bitpix;
    const width = geometry.width;
    const height = geometry.height;
    const inferredHeaderFields = geometry.inferred;

    const pixelBytes = bitpixSize(bitpix);
    if (!pixelBytes) {
      throw new Error(`Unsupported FITS BITPIX: ${bitpix}`);
    }

    const pixelCount = width * height;
    const availablePixels = Math.max(0, Math.floor(Math.max(0, availableBytes) / pixelBytes));
    const decodablePixelCount = Math.max(0, Math.min(pixelCount, availablePixels));
    if (!decodablePixelCount) {
      throw new Error('FITS image data is not available');
    }

    const decodeStart = performance.now();
    const dataView = new DataView(arrayBuffer, dataOffset);
    const values = new Float32Array(pixelCount);
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    let sum = 0;
    let sumSq = 0;

    for (let i = 0; i < decodablePixelCount; i++) {
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

    // Fill missing tail with the observed minimum to avoid bright artifacts on partial files.
    const fillValue = Number.isFinite(min) ? min : 0;
    for (let i = decodablePixelCount; i < pixelCount; i++) {
      values[i] = fillValue;
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

    const mean = sum / Math.max(1, decodablePixelCount);
    const variance = Math.max(0, sumSq / Math.max(1, decodablePixelCount) - mean * mean);
    const std = Math.sqrt(variance);

    let demosaicMs = 0;
    let debayeredChannels = null;
    let whiteBalanceGains = { r: 1, g: 1, b: 1 };
    if (bayerPattern) {
      const demosaicStart = performance.now();
      debayeredChannels = buildDebayerChannels(values, width, height, bayerPattern);
      demosaicMs = performance.now() - demosaicStart;
      whiteBalanceGains = computeAutoWhiteBalanceGains(debayeredChannels, low, high);
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
      headerSource,
      inferredHeaderFields,
      decodablePixelCount,
      truncated: decodablePixelCount < pixelCount,
      monoValues: bayerPattern ? null : values,
      debayeredChannels,
      whiteBalanceGains,
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
      whiteBalanceGains,
    } = prepared;

    const stretchMode = options.stretchMode || 'asinh';
    const parsedStretchStrength = Number(options.stretchStrength);
    const stretchStrength = Number.isFinite(parsedStretchStrength) ? parsedStretchStrength : 1;
    const autoWhiteBalance = options.autoWhiteBalance !== false;
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
      const gainR = autoWhiteBalance ? whiteBalanceGains.r : 1;
      const gainG = autoWhiteBalance ? whiteBalanceGains.g : 1;
      const gainB = autoWhiteBalance ? whiteBalanceGains.b : 1;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcIndex = y * width + x;
          const dstIndex = ((height - 1 - y) * width + x) * 4;
          pixels[dstIndex] = clampToByte(mapValueToUnit(rChannel[srcIndex] * gainR) * 255);
          pixels[dstIndex + 1] = clampToByte(mapValueToUnit(gChannel[srcIndex] * gainG) * 255);
          pixels[dstIndex + 2] = clampToByte(mapValueToUnit(bChannel[srcIndex] * gainB) * 255);
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
        headerSource: prepared.headerSource,
        inferredHeaderFields: prepared.inferredHeaderFields,
        decodablePixelCount: prepared.decodablePixelCount,
        truncated: prepared.truncated,
        autoWhiteBalance,
        whiteBalanceGains: autoWhiteBalance
          ? whiteBalanceGains
          : {
              r: 1,
              g: 1,
              b: 1,
            },
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
      autoWhiteBalance: fitsAutoWhiteBalance.value,
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

  watch([fitsStretchMode, fitsStretchStrength, fitsAutoWhiteBalance], () => {
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
    fitsAutoWhiteBalance,
    fitsStats,
    fitsHeaderEntries,
    fitsPerf,
    closePreview,
    openFile,
    handlePreviewError,
    setFitsCanvasRef,
  };
}
