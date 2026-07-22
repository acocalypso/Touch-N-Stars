export const ATLAS_POSITION_ANGLE_CONVENTION = 'clockwise-from-celestial-north';

export const POSITION_ANGLE_SOURCE = Object.freeze({
  NINA_PLATE_SOLVE: 'nina-plate-solve-position-angle',
  NINA_FITS_WCS_ROTATION: 'nina-fits-wcs-rotation',
});

export function normalizePositionAngleDegrees(value) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') {
    return null;
  }
  const angle = Number(value);
  if (!Number.isFinite(angle)) return null;
  return ((angle % 360) + 360) % 360;
}

export function toAtlasPositionAngle(value, source) {
  const normalized = normalizePositionAngleDegrees(value);
  if (normalized === null) return null;

  switch (source) {
    case POSITION_ANGLE_SOURCE.NINA_PLATE_SOLVE:
      return normalized;
    case POSITION_ANGLE_SOURCE.NINA_FITS_WCS_ROTATION:
      // NINA.Astrometry.WorldCoordinateSystem defines PositionAngle as
      // EuclidianModulus(360 - Rotation, 360).
      return normalizePositionAngleDegrees(360 - normalized);
    default:
      return null;
  }
}

export function positionAngleFromNinaPlateSolve(value) {
  return toAtlasPositionAngle(value, POSITION_ANGLE_SOURCE.NINA_PLATE_SOLVE);
}

export function positionAngleFromFitsAnalysis(result) {
  if (!result || typeof result !== 'object') return null;
  return toAtlasPositionAngle(
    result.rotation,
    result.solvedFromWcs
      ? POSITION_ANGLE_SOURCE.NINA_FITS_WCS_ROTATION
      : POSITION_ANGLE_SOURCE.NINA_PLATE_SOLVE
  );
}
