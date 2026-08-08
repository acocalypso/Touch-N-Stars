// Arcseconds per pixel for a given sensor and optic.
// 206265 = arcseconds per radian; pixel size arrives in µm, focal length in mm,
// which is where the factor 1000 goes.
const ARCSEC_PER_RADIAN_SCALED = 206.265;

/**
 * @param {number} pixelSizeUm  Sensor pixel size in µm (unbinned).
 * @param {number} focalLengthMm Focal length in mm.
 * @param {number} [binning=1]  Binning factor - binned pixels cover binning times as much sky.
 * @returns {number|null} arcsec/px, or null when an input is missing or non-positive.
 */
export function arcsecPerPixel(pixelSizeUm, focalLengthMm, binning = 1) {
  const pixelSize = Number(pixelSizeUm);
  const focalLength = Number(focalLengthMm);
  const bin = Number(binning) || 1;

  if (!(pixelSize > 0) || !(focalLength > 0)) return null;

  return (ARCSEC_PER_RADIAN_SCALED * pixelSize * bin) / focalLength;
}
