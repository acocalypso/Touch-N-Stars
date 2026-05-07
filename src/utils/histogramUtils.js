export function getHistogramStats(histogram) {
  if (!histogram || histogram.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0 };
  }

  const nonZeroValues = histogram
    .map((value, index) => ({ value, index }))
    .filter((item) => item.value > 0);

  if (nonZeroValues.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0 };
  }

  const indices = nonZeroValues.map((item) => item.index);

  const min = Math.min(...indices);
  const max = Math.max(...indices);
  const mean = indices.reduce((a, b) => a + b) / indices.length;

  const sorted = [...indices].sort((a, b) => a - b);
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  return { min, max, mean, median };
}
