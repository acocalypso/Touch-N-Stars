export const ATLAS_MAGNITUDE_LIMIT_MIN = -2;
export const ATLAS_MAGNITUDE_LIMIT_MAX = 30;

export function normalizeAtlasMagnitudeLimit(value, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.max(ATLAS_MAGNITUDE_LIMIT_MIN, Math.min(ATLAS_MAGNITUDE_LIMIT_MAX, numericValue));
}
