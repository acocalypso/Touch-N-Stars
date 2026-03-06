/**
 * Narrowband Filter Transmission Calculator
 * JavaScript port of the Python filter calculation with numerical integration
 */

/**
 * Standard normal distribution PDF
 * @param {number} x - The value
 * @param {number} mean - Mean of the distribution
 * @param {number} stddev - Standard deviation
 * @returns {number} The PDF value
 */
export function normalPdf(x, mean, stddev) {
  if (stddev === 0) return x === mean ? Infinity : 0;
  const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stddev, 2));
  return Math.exp(exponent) / (stddev * Math.sqrt(2 * Math.PI));
}

/**
 * Numerical integration using Simpson's Rule
 * More accurate than trapezoid rule for smooth functions
 * @param {Function} fn - Function to integrate
 * @param {number} a - Lower bound
 * @param {number} b - Upper bound
 * @param {number} n - Number of intervals (should be even)
 * @returns {Object} {result, error}
 */
function simpsonsRule(fn, a, b, n = 1000) {
  if (n % 2 !== 0) n++; // Ensure n is even

  const h = (b - a) / n;
  let sum = fn(a) + fn(b);
  let sumOdd = 0;
  let sumEven = 0;

  for (let i = 1; i < n; i += 2) {
    sumOdd += fn(a + i * h);
  }

  for (let i = 2; i < n - 1; i += 2) {
    sumEven += fn(a + i * h);
  }

  const result = (h / 3) * (sum + 4 * sumOdd + 2 * sumEven);

  // Estimate error (rough)
  const error = Math.abs(result) * 1e-6;

  return { result, error };
}

/**
 * Linear interpolation function for transmittance curve
 * @param {Array<object>} curveData - Array of {wavelength, transmission} objects
 * @returns {Function} Interpolation function
 */
function createTransmittanceInterpolator(curveData) {
  // Sort by wavelength to ensure proper interpolation
  const sorted = [...curveData].sort((a, b) => a.wavelength - b.wavelength);

  return (wavelength) => {
    // Outside range returns 0
    if (wavelength < sorted[0].wavelength || wavelength > sorted[sorted.length - 1].wavelength) {
      return 0;
    }

    // Find the two surrounding points
    for (let i = 0; i < sorted.length - 1; i++) {
      if (wavelength >= sorted[i].wavelength && wavelength <= sorted[i + 1].wavelength) {
        const w1 = sorted[i].wavelength;
        const w2 = sorted[i + 1].wavelength;
        const t1 = sorted[i].transmission;
        const t2 = sorted[i + 1].transmission;

        // Linear interpolation
        const t = (wavelength - w1) / (w2 - w1);
        return t1 * (1 - t) + t2 * t;
      }
    }

    return 0;
  };
}

/**
 * Calculate the transmission of a narrowband filter
 * @param {Object} params - Calculation parameters
 * @returns {number} The final transmission value (0-1)
 */
export function calculateTransmissionContinuous(params) {
  const {
    aperture,
    bandpassCenter,
    fwhm,
    flatTop,
    effectiveRefractiveIndex,
    peakTransmittance,
    focalLength,
    targetWavelength,
    obstructionDiameter = 0, // Central obstruction diameter in mm
    loadedCurveData = null, // Array of {wavelength, transmission} objects
  } = params;

  // Convert obstruction diameter to ratio
  const obstructionRatio = aperture > 0 ? obstructionDiameter / aperture : 0;

  // Clamp obstruction ratio to valid range
  const clampedObstructionRatio = Math.max(0, Math.min(obstructionRatio, 0.99));

  // Create transmittance interpolator if curve data is provided
  let transmittanceInterp = null;
  let useCurveMethod = false;

  if (loadedCurveData && loadedCurveData.length > 0) {
    transmittanceInterp = createTransmittanceInterpolator(loadedCurveData);
    useCurveMethod = true;
  }

  // Calculate standard deviation from FWHM (only used for parametric method)
  const stddev = (fwhm - flatTop) / 2.355;

  // Max value of normal distribution at bandpass center (only used for parametric method)
  const normalDistributionMax = normalPdf(bandpassCenter, bandpassCenter, stddev);

  // Define the integrand function
  function integrand(r) {
    // Calculate incident angle
    const theta_i = Math.atan(r / focalLength);

    // Calculate shifted bandpass center due to angle of incidence
    const sinTheta = Math.sin(theta_i);
    const nSquared = effectiveRefractiveIndex * effectiveRefractiveIndex;
    const shiftedBandpassCenter = bandpassCenter * Math.sqrt(1 - (sinTheta * sinTheta) / nSquared);

    // Calculate filter transmission based on target wavelength
    let filterTransmission;

    if (useCurveMethod && transmittanceInterp) {
      // Curve-based method: use actual transmittance curve
      // Wavelength relative to the shifted bandpass center
      const wavelengthRelativeToCenter = targetWavelength - shiftedBandpassCenter;

      // Look up this relative position on the original curve
      // by shifting the curve: instead of looking at wavelength w,
      // we look at (bandpass_center + relative_position)
      const effectiveWavelength = bandpassCenter + wavelengthRelativeToCenter;

      // Get transmittance at this effective position
      filterTransmission = transmittanceInterp(effectiveWavelength);
    } else {
      // Parametric method: use flat_top and FWHM to create a model
      if (targetWavelength < shiftedBandpassCenter - flatTop / 2) {
        const mean = shiftedBandpassCenter - flatTop / 2;
        filterTransmission =
          (normalPdf(targetWavelength, mean, stddev) / normalDistributionMax) * peakTransmittance;
      } else if (targetWavelength > shiftedBandpassCenter + flatTop / 2) {
        const mean = shiftedBandpassCenter + flatTop / 2;
        filterTransmission =
          (normalPdf(targetWavelength, mean, stddev) / normalDistributionMax) * peakTransmittance;
      } else {
        filterTransmission = peakTransmittance;
      }
    }

    // Area of infinitesimal ring
    const dA = 2 * Math.PI * r;

    // Weighted contribution to transmission
    return dA * filterTransmission;
  }

  // Calculate aperture radii
  const rOuter = aperture / 2;
  const rInner = rOuter * clampedObstructionRatio; // Central obstruction radius

  // Integration limits: r from rInner to rOuter (annular aperture)
  const { result: weightedAreaTotal, error: integrationError } = simpsonsRule(
    integrand,
    rInner,
    rOuter
  );

  console.log(`Integration error estimate: ${integrationError}`);

  // Total aperture area (accounting for central obstruction)
  const totalArea = Math.PI * (rOuter * rOuter - rInner * rInner);

  // Final transmission
  const finalTransmission = totalArea > 0 ? weightedAreaTotal / totalArea : 0;

  return finalTransmission;
}

/**
 * Validate calculation parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} {valid: boolean, errors: string[]}
 */
export function validateParameters(params) {
  const errors = [];

  if (params.aperture <= 0) errors.push('Aperture must be positive');
  if (params.bandpassCenter <= 0) errors.push('Bandpass center must be positive');
  if (params.fwhm <= 0) errors.push('FWHM must be positive');
  if (params.flatTop <= 0) errors.push('Flat top must be positive');
  if (params.flatTop > params.fwhm) errors.push('Flat top cannot exceed FWHM');
  if (params.effectiveRefractiveIndex <= 1) errors.push('Refractive index must be > 1');
  if (params.peakTransmittance < 0 || params.peakTransmittance > 1) {
    errors.push('Peak transmittance must be between 0 and 1');
  }
  if (params.focalLength <= 0) errors.push('Focal length must be positive');
  if (params.targetWavelength <= 0) errors.push('Target wavelength must be positive');
  if (params.obstructionDiameter < 0 || params.obstructionDiameter >= params.aperture) {
    errors.push('Obstruction diameter must be between 0 and aperture diameter');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
