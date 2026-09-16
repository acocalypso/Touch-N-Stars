/**
 * Human-readable decimal size ("79 MB", "1.4 GB") for the Atlas survey UI, where sizes are
 * rough estimates and one decimal is plenty.
 */
export function formatSurveyBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value >= 1e9) return `${(value / 1e9).toFixed(value >= 1e10 ? 0 : 1)} GB`;
  if (value >= 1e6) return `${Math.round(value / 1e6)} MB`;
  if (value >= 1e3) return `${Math.round(value / 1e3)} kB`;
  return `${Math.round(value)} B`;
}
