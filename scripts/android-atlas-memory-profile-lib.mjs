function numberFor(text, pattern) {
  const match = text.match(pattern);
  return match ? Number(match[1]) : null;
}

export function parseAndroidMeminfo(text) {
  if (typeof text !== 'string' || !text.includes('MEMINFO')) {
    throw new TypeError('Android meminfo output is missing');
  }

  const totalRow = text.match(/^\s*TOTAL\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)(?:\s|$)/m);

  return {
    pid: numberFor(text, /\*\* MEMINFO in pid (\d+)/),
    totalPssKb: numberFor(text, /TOTAL PSS:\s*(\d+)/),
    totalRssKb: numberFor(text, /TOTAL RSS:\s*(\d+)/),
    totalSwapPssKb: numberFor(text, /TOTAL SWAP PSS:\s*(\d+)/),
    totalPrivateDirtyKb: totalRow ? Number(totalRow[2]) : null,
    totalPrivateCleanKb: totalRow ? Number(totalRow[3]) : null,
    javaHeapKb: numberFor(text, /^\s*Java Heap:\s*(\d+)/m),
    nativeHeapKb: numberFor(text, /^\s*Native Heap:\s*(\d+)/m),
    codeKb: numberFor(text, /^\s*Code:\s*(\d+)/m),
    stackKb: numberFor(text, /^\s*Stack:\s*(\d+)/m),
    graphicsKb: numberFor(text, /^\s*Graphics:\s*(\d+)/m),
    privateOtherKb: numberFor(text, /^\s*Private Other:\s*(\d+)/m),
    systemKb: numberFor(text, /^\s*System:\s*(\d+)/m),
    views: numberFor(text, /Views:\s*(\d+)/),
    activities: numberFor(text, /Activities:\s*(\d+)/),
    webViews: numberFor(text, /WebViews:\s*(\d+)/),
  };
}

export function parsePackageWebViewProcessPids(text, packageName) {
  if (typeof text !== 'string' || !packageName) return [];
  const escapedPackage = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text
    .split(/(?=^\s*\*APP\* UID)/m)
    .filter(
      (block) =>
        /ProcessRecord\{[^\r\n]*:com\.google\.android\.webview:sandboxed_process/i.test(block) &&
        new RegExp(`packageList=\\{${escapedPackage}\\}`).test(block)
    )
    .map((block) => Number(block.match(/ProcessRecord\{[^\r\n]*?\s(\d+):/)?.[1] || 0))
    .filter((pid) => pid > 0)
    .toSorted((a, b) => a - b);
}

const aggregateKeys = [
  'totalPssKb',
  'totalRssKb',
  'totalSwapPssKb',
  'totalPrivateDirtyKb',
  'totalPrivateCleanKb',
  'javaHeapKb',
  'nativeHeapKb',
  'codeKb',
  'stackKb',
  'graphicsKb',
  'privateOtherKb',
  'systemKb',
];

export function aggregateAndroidMeminfo(processes) {
  const valid = processes.filter((process) => process && Number.isFinite(process.pid));
  const aggregate = {};
  for (const key of aggregateKeys) {
    const values = valid.map((process) => process[key]).filter(Number.isFinite);
    aggregate[key] = values.length ? values.reduce((sum, value) => sum + value, 0) : null;
  }
  return aggregate;
}

function median(values) {
  const sorted = values.filter(Number.isFinite).toSorted((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function slopePerMinute(samples, key) {
  const points = samples
    .filter((sample) => Number.isFinite(sample.elapsedSeconds) && Number.isFinite(sample[key]))
    .map((sample) => ({ x: sample.elapsedSeconds / 60, y: sample[key] }));
  if (points.length < 2) return null;

  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const denominator = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  if (!denominator) return 0;
  return (
    points.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0) / denominator
  );
}

function summarizeMetric(samples, key) {
  const values = samples.map((sample) => sample[key]).filter(Number.isFinite);
  if (!values.length) return null;
  const windowSize = Math.min(3, Math.max(1, Math.floor(values.length / 2)));
  const firstMedianKb = median(values.slice(0, windowSize));
  const lastMedianKb = median(values.slice(-windowSize));
  return {
    firstMedianKb,
    lastMedianKb,
    settledGrowthKb: lastMedianKb - firstMedianKb,
    minKb: Math.min(...values),
    maxKb: Math.max(...values),
    slopeKbPerMinute: slopePerMinute(samples, key),
  };
}

export function summarizeAndroidMemorySamples(samples, { warmupSamples = 3 } = {}) {
  const valid = samples.filter((sample) => sample && !sample.error && Number.isFinite(sample.pid));
  const settled = valid.slice(Math.min(warmupSamples, Math.max(0, valid.length - 2)));
  let processRestarts = 0;
  for (let index = 1; index < valid.length; index += 1) {
    const previous = JSON.stringify(valid[index - 1].processPids || [valid[index - 1].pid]);
    const current = JSON.stringify(valid[index].processPids || [valid[index].pid]);
    if (current !== previous) processRestarts += 1;
  }

  return {
    requestedSamples: samples.length,
    validSamples: valid.length,
    failedSamples: samples.length - valid.length,
    warmupSamplesExcluded: valid.length - settled.length,
    processRestarts,
    samplesWithoutWebViewProcess: valid.filter(
      (sample) => !Array.isArray(sample.webViewProcesses) || !sample.webViewProcesses.length
    ).length,
    totalPss: summarizeMetric(settled, 'totalPssKb'),
    totalRss: summarizeMetric(settled, 'totalRssKb'),
    privateDirty: summarizeMetric(settled, 'totalPrivateDirtyKb'),
    nativeHeap: summarizeMetric(settled, 'nativeHeapKb'),
    javaHeap: summarizeMetric(settled, 'javaHeapKb'),
    graphics: summarizeMetric(settled, 'graphicsKb'),
    privateOther: summarizeMetric(settled, 'privateOtherKb'),
    system: summarizeMetric(settled, 'systemKb'),
    code: summarizeMetric(settled, 'codeKb'),
  };
}
