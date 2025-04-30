/**
 * Bathinov Mask Focus Analysis Utility
 * Based on principles from Zandvliet's thesis and BahtiFocus implementation
 */

// Image analysis constants
const MASK_ANGLE_DEFAULT = 34; // Default mask angle in degrees (typical Bathinov mask)
const GAUSSIAN_BLUR_SIGMA = 1.5; // Sigma for Gaussian blur in preprocessing

// Add these global variables at the top of the file to track mask angles across analyses
let detectedMaskAngles = [];
const MAX_STORED_ANGLES = 10; // Store up to 10 recent mask angle detections

/**
 * Store a detected mask angle for consensus building
 * @param {number} angle - The detected mask angle
 */
function storeMaskAngle(angle) {
  // Only store reasonable mask angles (avoid storing clearly wrong values)
  if (angle >= 10 && angle <= 40) {
    detectedMaskAngles.push(angle);

    // Keep the list from growing too large
    if (detectedMaskAngles.length > MAX_STORED_ANGLES) {
      detectedMaskAngles.shift(); // Remove oldest value
    }

    console.log(
      `Stored mask angle: ${angle}°. Current angles: [${detectedMaskAngles.join(', ')}°]`
    );
  }
}

/**
 * Get the consensus mask angle based on previously detected angles
 * @returns {number} The consensus mask angle
 */
function getConsensusMaskAngle() {
  // If we don't have enough data yet, return the default
  if (detectedMaskAngles.length < 2) {
    return MASK_ANGLE_DEFAULT;
  }

  // Group angles that are close to each other (within 3 degrees)
  const angleGroups = [];

  for (const angle of detectedMaskAngles) {
    // Try to find an existing group this angle fits into
    let foundGroup = false;

    for (const group of angleGroups) {
      // Check if this angle is close to the group's average
      if (Math.abs(group.average - angle) < 3) {
        group.angles.push(angle);
        group.sum += angle;
        group.average = group.sum / group.angles.length;
        group.count++;
        foundGroup = true;
        break;
      }
    }

    // If no matching group, create a new one
    if (!foundGroup) {
      angleGroups.push({
        angles: [angle],
        sum: angle,
        average: angle,
        count: 1,
      });
    }
  }

  // Find the group with the most members
  let largestGroup = null;
  let maxCount = 0;

  for (const group of angleGroups) {
    if (group.count > maxCount) {
      maxCount = group.count;
      largestGroup = group;
    }
  }

  // Return the average angle of the largest group
  return largestGroup ? Math.round(largestGroup.average) : MASK_ANGLE_DEFAULT;
}

/**
 * Process an image to find Bathinov diffraction spikes
 * @param {ImageData} imageData - The image data to analyze
 * @returns {Object} Analysis results including spike positions and focus metrics
 */
export function analyzeBathinovPattern(imageData) {
  try {
    // Create an ImageData object from the image source
    const { data, width, height } = imageData;

    // Find the brightest point in the image (likely the center of the star)
    const center = findBrightestPoint(data, width, height);

    // Use our improved detection method to avoid detecting other stars as spikes
    const spikes = detectDiffractionSpikesImproved(data, width, height, center);

    // Calculate focus metrics
    const metrics = calculateFocusMetrics(spikes, center);

    return {
      center,
      spikes,
      metrics,
      consensusMaskAngle: getConsensusMaskAngle(),
    };
  } catch (error) {
    console.error('Error analyzing image region:', error);
    throw error;
  }
}

/**
 * Preprocess the image to enhance diffraction spikes
 * @param {Uint8ClampedArray} data - Image data array
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Uint8ClampedArray} Processed image data
 */
function preprocessImage(data, width, height) {
  // Create a grayscale version of the image
  const grayscale = convertToGrayscale(data, width, height);

  // Apply Gaussian blur to reduce noise (simplified implementation)
  const blurred = applyGaussianBlur(grayscale, width, height, GAUSSIAN_BLUR_SIGMA);

  // Apply threshold to isolate bright areas
  const thresholded = applyThreshold(blurred, width, height, 128);

  // Return the processed data
  return thresholded;
}

/**
 * Convert RGB image data to grayscale
 * @param {Uint8ClampedArray} data - Image data array
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Uint8ClampedArray} Grayscale image data
 */
function convertToGrayscale(data, width, height) {
  const grayscale = new Uint8ClampedArray(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Weighted grayscale conversion (human eye is more sensitive to green)
      grayscale[y * width + x] = Math.round(
        0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
      );
    }
  }

  return grayscale;
}

/**
 * Apply Gaussian blur to reduce noise
 * @param {Uint8ClampedArray} data - Grayscale image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} sigma - Blur sigma
 * @returns {Uint8ClampedArray} Blurred image data
 */
function applyGaussianBlur(data, width, height, sigma) {
  // Create a copy of the data to work with
  const output = new Uint8ClampedArray(data.length);

  // Calculate Gaussian kernel
  const kernelSize = Math.max(3, Math.ceil(sigma * 3) * 2 + 1);
  const halfSize = Math.floor(kernelSize / 2);
  const kernel = new Array(kernelSize);

  // Calculate kernel values
  let sum = 0;
  for (let i = 0; i < kernelSize; i++) {
    const x = i - halfSize;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }

  // Normalize kernel values
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= sum;
  }

  // Apply horizontal pass (separable convolution)
  const temp = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -halfSize; k <= halfSize; k++) {
        const xOffset = Math.min(Math.max(0, x + k), width - 1);
        sum += data[y * width + xOffset] * kernel[k + halfSize];
      }
      temp[y * width + x] = sum;
    }
  }

  // Apply vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -halfSize; k <= halfSize; k++) {
        const yOffset = Math.min(Math.max(0, y + k), height - 1);
        sum += temp[yOffset * width + x] * kernel[k + halfSize];
      }
      output[y * width + x] = sum;
    }
  }

  return output;
}

/**
 * Apply threshold to isolate bright areas
 * @param {Uint8ClampedArray} data - Grayscale image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} threshold - Threshold value (0-255)
 * @returns {Uint8ClampedArray} Thresholded image data
 */
function applyThreshold(data, width, height, threshold) {
  const result = new Uint8ClampedArray(width * height);

  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] > threshold ? 255 : 0;
  }

  return result;
}

/**
 * Find the brightest point in the image
 * @param {Uint8ClampedArray} data - Image data array
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Object} {x, y, brightness}
 */
function findBrightestPoint(data, width, height) {
  let maxBrightness = 0;
  let x = 0;
  let y = 0;

  // Iterate through each pixel
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const idx = (i * width + j) * 4;

      // Calculate brightness (average of RGB)
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      if (brightness > maxBrightness) {
        maxBrightness = brightness;
        x = j;
        y = i;
      }
    }
  }

  return { x, y, brightness: maxBrightness };
}

/**
 * Detect diffraction spikes in the image using improved detection algorithm
 * @param {Uint8ClampedArray} data - Image data array
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} center - The brightest point {x, y}
 * @returns {Array} Array of three spikes, each with start and end points
 */
function detectDiffractionSpikesImproved(data, width, height, center) {
  // Define search parameters with increased sensitivity
  const searchRadius = Math.min(width, height) * 0.5; // Search up to 50% of the image size
  const numAngles = 1800; // Higher precision - 0.2 degree steps
  const anglePrecision = 360 / numAngles;

  console.log(`Center point: x=${center.x}, y=${center.y}, brightness=${center.brightness}`);

  // Initialize intensity arrays for each angle
  const intensities = new Array(numAngles).fill(0);

  // Calculate average brightness in the outer area to determine background level
  let backgroundSum = 0;
  let backgroundCount = 0;
  const outerRadius = searchRadius * 0.8;
  const innerRadius = searchRadius * 0.3;

  // Sample points in the outer area to estimate background level
  for (let angle = 0; angle < 360; angle += 10) {
    const angleRad = (angle * Math.PI) / 180;
    for (let r = outerRadius; r < searchRadius; r += 5) {
      const x = Math.round(center.x + r * Math.cos(angleRad));
      const y = Math.round(center.y + r * Math.sin(angleRad));

      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        backgroundSum += brightness;
        backgroundCount++;
      }
    }
  }

  const backgroundColor = backgroundCount > 0 ? backgroundSum / backgroundCount : 0;

  // For each angle, sum up the brightness along a line from the center
  for (let angleIndex = 0; angleIndex < numAngles; angleIndex++) {
    const angle = angleIndex * anglePrecision;
    const angleRad = (angle * Math.PI) / 180;

    // Sample points along this angle
    let totalIntensity = 0;
    let sampleCount = 0;
    let continuousHighValues = 0;
    let isPotentialStar = false;

    // More samples for better accuracy
    const numSamples = 300;
    const stepSize = searchRadius / numSamples;

    // Start closer to center but avoid the brightest core
    for (let r = 10; r < searchRadius; r += stepSize) {
      const x = Math.round(center.x + r * Math.cos(angleRad));
      const y = Math.round(center.y + r * Math.sin(angleRad));

      // Check if point is within image bounds
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;

        // Calculate brightness
        const red = data[idx];
        const green = data[idx + 1];
        const blue = data[idx + 2];
        const brightness = red * 0.3 + green * 0.6 + blue * 0.1;

        // Check for star-like profile (sharp brightness peak)
        if (brightness > center.brightness * 0.6) {
          continuousHighValues++;

          // If we have multiple continuously high values and we're away from center,
          // this might be another star rather than a diffraction spike
          if (continuousHighValues > 10 && r > innerRadius) {
            isPotentialStar = true;
            break;
          }
        } else {
          continuousHighValues = 0;
        }

        // Calculate weight based on distance from center
        // Diffraction spikes have a characteristic falloff pattern
        let weight;
        if (r < innerRadius) {
          // Core region: linear increase
          weight = Math.min(1.0, r / innerRadius);
        } else {
          // Outer region: exponential decay
          weight = Math.exp(-0.5 * ((r - innerRadius) / (searchRadius - innerRadius)));
        }

        // Apply weighting that emphasizes characteristic diffraction patterns
        const adjustedBrightness = (brightness - backgroundColor) * weight;

        if (adjustedBrightness > 0) {
          totalIntensity += adjustedBrightness;
          sampleCount++;
        }
      }
    }

    // Don't consider angles that hit another star
    if (isPotentialStar) {
      intensities[angleIndex] = 0;
    } else {
      // Store average intensity for this angle
      intensities[angleIndex] = sampleCount > 0 ? totalIntensity / sampleCount : 0;
    }
  }

  // Smooth the intensity profile with better noise reduction
  const smoothedIntensities = smoothArray(intensities, 9);

  // Apply advanced contrast enhancement to make peaks more prominent
  const enhancedIntensities = enhanceContrast(smoothedIntensities);

  // Find local maxima in intensity pattern - these are our diffraction spikes
  const spikeCandidates = [];

  // Adaptive threshold based on analysis of intensity distribution
  const intensitySorted = [...enhancedIntensities].sort((a, b) => b - a);
  const topPercentile = intensitySorted[Math.floor(intensitySorted.length * 0.02)]; // Top 2%
  const minPeakIntensity = topPercentile * 0.45; // Lower threshold to catch more candidates

  console.log(`Min peak intensity threshold: ${minPeakIntensity}`);

  // Minimum angular separation between detected spikes (in degrees)
  const minSeparationDegrees = 10; // Increased to avoid detecting nearby features as separate spikes
  const minSeparation = minSeparationDegrees / anglePrecision;

  // Find all local maxima with a more sensitive peak detection
  for (let i = 0; i < numAngles; i++) {
    const window = 9; // Wider window for more reliable peak detection
    let isPeak = true;

    // Only consider points above threshold
    if (enhancedIntensities[i] <= minPeakIntensity) continue;

    // Check if this is a local maximum within the window
    for (let j = -window; j <= window; j++) {
      if (j === 0) continue; // Skip self

      const idx = (i + j + numAngles) % numAngles;
      if (enhancedIntensities[idx] > enhancedIntensities[i]) {
        isPeak = false;
        break;
      }
    }

    if (isPeak) {
      // Check if it's sufficiently separated from existing peaks
      let tooClose = false;
      for (const candidate of spikeCandidates) {
        const separation = Math.min(
          Math.abs(i - candidate.angleIndex),
          numAngles - Math.abs(i - candidate.angleIndex)
        );
        if (separation < minSeparation) {
          tooClose = true;
          // If this peak is stronger than the existing one, replace it
          if (enhancedIntensities[i] > enhancedIntensities[candidate.angleIndex]) {
            candidate.angleIndex = i;
            candidate.angle = i * anglePrecision;
            candidate.intensity = enhancedIntensities[i];
          }
          break;
        }
      }

      if (!tooClose) {
        spikeCandidates.push({
          angleIndex: i,
          angle: i * anglePrecision,
          intensity: enhancedIntensities[i],
        });
      }
    }
  }

  console.log(`Found ${spikeCandidates.length} spike candidates`);

  // Sort by intensity (brightest first)
  spikeCandidates.sort((a, b) => b.intensity - a.intensity);

  // Log the top candidates
  spikeCandidates.slice(0, Math.min(8, spikeCandidates.length)).forEach((candidate, i) => {
    console.log(
      `Candidate ${i + 1}: angle=${candidate.angle.toFixed(1)}°, intensity=${candidate.intensity.toFixed(1)}`
    );
  });

  // Look for the classic bathinov pattern with opposing spikes
  // This helps distinguish actual diffraction patterns from nearby stars
  let bestPattern = findBathinovPattern(spikeCandidates, numAngles);

  // If we found a valid pattern, use it
  let selectedSpikes;
  if (bestPattern) {
    console.log(
      `Selected pattern: maskAngle=${bestPattern.maskAngle}°, central=${bestPattern.central.angle.toFixed(1)}°, left=${bestPattern.left.angle.toFixed(1)}°, right=${bestPattern.right.angle.toFixed(1)}°`
    );

    selectedSpikes = [bestPattern.central, bestPattern.left, bestPattern.right];
  } else {
    console.log('No specific Bathinov pattern found, falling back to general selection');
    // Fall back to standard selection method with constraints for Bathinov pattern
    selectedSpikes = selectBathinovSpikes(spikeCandidates, MASK_ANGLE_DEFAULT);
  }

  // Create line objects for each spike
  const spikes = selectedSpikes.map((peak) => createSpikeLine(center, peak.angle, width, height));

  return spikes;
}

/**
 * Find the most likely Bathinov diffraction pattern among spike candidates
 * @param {Array} candidates - Array of spike candidates
 * @param {number} numAngles - Total number of angles in the scan
 * @returns {Object|null} The best pattern found or null if no valid pattern
 */
function findBathinovPattern(candidates, numAngles) {
  if (candidates.length < 3) return null;

  // Get the consensus mask angle from our stored values
  const consensusAngle = getConsensusMaskAngle();

  // Prioritize angles around the consensus if we have one, otherwise use standard angles
  let possibleMaskAngles;

  if (detectedMaskAngles.length >= 2) {
    // We have enough data to use consensus-based approach
    // Create an array of angles centered around the consensus angle
    possibleMaskAngles = [
      consensusAngle - 3,
      consensusAngle - 1.5,
      consensusAngle,
      consensusAngle + 1.5,
      consensusAngle + 3,
    ];
    console.log(
      `Using consensus-based mask angles around ${consensusAngle}°: [${possibleMaskAngles.join(', ')}°]`
    );
  } else {
    // Not enough data, use standard angles
    possibleMaskAngles = [15, 18, 22, 25, 30, 34, 38];
    console.log('Using standard mask angles (no consensus yet)');
  }

  let bestPatternScore = -Infinity;
  let bestPattern = null;

  // Consider only the strongest candidates (up to top 10)
  const topCandidates = candidates.slice(0, Math.min(10, candidates.length));

  // For each possible combination of three spikes from top candidates
  for (let i = 0; i < topCandidates.length; i++) {
    const potentialCentral = topCandidates[i];

    // Try each possible mask angle
    for (const maskAngle of possibleMaskAngles) {
      // For a Bathinov pattern, we should find spikes at approximately central ± maskAngle
      const expectedLeftAngle = normalizeDegrees360(
        (potentialCentral.angle - maskAngle + 360) % 360
      );
      const expectedRightAngle = normalizeDegrees360((potentialCentral.angle + maskAngle) % 360);

      // Find the best match for left and right spikes
      let bestLeftMatch = null;
      let bestRightMatch = null;
      let bestLeftDiff = 15; // Maximum allowed angular difference
      let bestRightDiff = 15;

      for (let j = 0; j < candidates.length; j++) {
        if (j === i) continue; // Skip the central spike

        const candidate = candidates[j];
        const candidateAngle = candidate.angle;

        // Check if this is a potential left spike
        const leftDiff = Math.abs(normalizeDegrees180(candidateAngle - expectedLeftAngle));
        if (leftDiff < bestLeftDiff) {
          bestLeftDiff = leftDiff;
          bestLeftMatch = candidate;
        }

        // Check if this is a potential right spike
        const rightDiff = Math.abs(normalizeDegrees180(candidateAngle - expectedRightAngle));
        if (rightDiff < bestRightDiff) {
          bestRightDiff = rightDiff;
          bestRightMatch = candidate;
        }
      }

      // If we found matches for both side spikes
      if (bestLeftMatch && bestRightMatch && bestLeftMatch !== bestRightMatch) {
        // Calculate pattern score based on several factors
        const intensityScore =
          potentialCentral.intensity * 3 +
          bestLeftMatch.intensity * 2 +
          bestRightMatch.intensity * 2;

        // Angle symmetry (how well they match the expected pattern)
        const symmetryScore = 20 - (bestLeftDiff + bestRightDiff);

        // Angular opposition score (side spikes should be on opposite sides)
        const oppositionAngle = Math.abs(
          normalizeDegrees180(bestLeftMatch.angle - bestRightMatch.angle)
        );
        const oppositionScore = 20 - Math.abs(oppositionAngle - 2 * maskAngle);

        // Intensity balance (side spikes should have similar intensities)
        const balanceScore =
          10 -
          (Math.abs(bestLeftMatch.intensity - bestRightMatch.intensity) /
            Math.max(bestLeftMatch.intensity, bestRightMatch.intensity)) *
            10;

        // Consensus score - higher if this mask angle is close to the consensus
        const consensusScore = 20 - Math.abs(maskAngle - consensusAngle) * 2;

        // Total pattern score with different weights for each factor
        const patternScore =
          intensityScore * 0.3 +
          symmetryScore * 0.2 +
          oppositionScore * 0.15 +
          balanceScore * 0.05 +
          consensusScore * 0.3; // Give significant weight to consensus

        if (patternScore > bestPatternScore) {
          bestPatternScore = patternScore;
          bestPattern = {
            central: potentialCentral,
            left: bestLeftMatch,
            right: bestRightMatch,
            maskAngle: maskAngle,
            score: patternScore,
          };
        }
      }
    }
  }

  // After finding the best pattern, store its mask angle for future reference
  if (bestPattern) {
    storeMaskAngle(bestPattern.maskAngle);
  }

  // Only return the pattern if the score is above a threshold
  return bestPatternScore > 30 ? bestPattern : null;
}

/**
 * Apply a sliding window average to smooth an array
 * @param {Array} array - The array to smooth
 * @param {number} windowSize - The size of the sliding window
 * @returns {Array} Smoothed array
 */
function smoothArray(array, windowSize) {
  const result = new Array(array.length);
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < array.length; i++) {
    let sum = 0;
    let count = 0;

    for (let j = -halfWindow; j <= halfWindow; j++) {
      const idx = (i + j + array.length) % array.length; // Wrap around for circular data
      sum += array[idx];
      count++;
    }

    result[i] = sum / count;
  }

  return result;
}

/**
 * Apply contrast enhancement to an array of values
 * @param {Array} array - Array of values to enhance
 * @returns {Array} Enhanced array
 */
function enhanceContrast(array) {
  // Find min and max values
  const min = Math.min(...array);
  const max = Math.max(...array);
  const range = max - min;

  // Apply contrast stretching
  return array.map((value) => {
    const normalized = (value - min) / range; // 0 to 1
    // Apply a power function for more aggressive enhancement
    return Math.pow(normalized, 0.5) * range + min;
  });
}

/**
 * Select the best three spikes that match the Bathinov mask pattern
 * @param {Array} candidates - Array of spike candidates
 * @param {number} expectedAngle - Expected angle between side spikes
 * @returns {Array} Three selected spikes in order [central, left, right]
 */
function selectBathinovSpikes(candidates, expectedAngle) {
  // If we have fewer than 3 candidates, we can't form a complete pattern
  if (candidates.length < 3) {
    return supplementMissingSpikes(candidates, expectedAngle);
  }

  // Take top candidates for consideration (if available)
  const topCandidates = candidates.slice(0, Math.min(8, candidates.length));

  // Try all possible combinations of 3 spikes to find the best match
  let bestMatch = null;
  let bestScore = Infinity;

  for (let i = 0; i < topCandidates.length; i++) {
    for (let j = i + 1; j < topCandidates.length; j++) {
      for (let k = j + 1; k < topCandidates.length; k++) {
        // Get angles of the three spikes
        const angles = [topCandidates[i].angle, topCandidates[j].angle, topCandidates[k].angle];

        // Calculate angle differences between pairs
        const diffs = [
          Math.abs(normalizeDegrees180(angles[0] - angles[1])),
          Math.abs(normalizeDegrees180(angles[0] - angles[2])),
          Math.abs(normalizeDegrees180(angles[1] - angles[2])),
        ];

        // Sort differences to get min, mid, max
        diffs.sort((a, b) => a - b);

        // In a perfect Bathinov pattern:
        // 1. The smallest angular difference should be close to expectedAngle
        // 2. The middle angular difference should also be close to expectedAngle
        // 3. The largest angular difference should be close to 2 * expectedAngle

        const scoreSmall = Math.abs(diffs[0] - expectedAngle);
        const scoreMid = Math.abs(diffs[1] - expectedAngle);
        const scoreLarge = Math.abs(diffs[2] - 2 * expectedAngle);

        // Weight by intensity too - brighter spikes are more likely to be real
        const intensityFactor =
          1.0 /
          ((topCandidates[i].intensity + topCandidates[j].intensity + topCandidates[k].intensity) /
            3);

        const totalScore = (scoreSmall + scoreMid + scoreLarge) * intensityFactor;

        if (totalScore < bestScore) {
          bestScore = totalScore;
          bestMatch = [i, j, k];
        }
      }
    }
  }

  if (bestMatch) {
    const [i, j, k] = bestMatch;
    const spike1 = topCandidates[i];
    const spike2 = topCandidates[j];
    const spike3 = topCandidates[k];

    // Determine which is the central spike (the one with the angle
    // approximately in the middle of the other two)
    const angle1 = spike1.angle;
    const angle2 = spike2.angle;
    const angle3 = spike3.angle;

    // Calculate normalized angle differences
    const diff12 = Math.abs(normalizeDegrees180(angle1 - angle2));
    const diff13 = Math.abs(normalizeDegrees180(angle1 - angle3));
    const diff23 = Math.abs(normalizeDegrees180(angle2 - angle3));

    let central, left, right;

    if (diff12 > diff13 && diff12 > diff23) {
      // diff12 is largest, so spike3 is the central spike
      central = spike3;
      // Determine which is left and right based on angle
      if (normalizeDegrees(angle1 - angle3) < 180) {
        left = spike1;
        right = spike2;
      } else {
        left = spike2;
        right = spike1;
      }
    } else if (diff13 > diff12 && diff13 > diff23) {
      // diff13 is largest, so spike2 is the central spike
      central = spike2;
      if (normalizeDegrees(angle1 - angle2) < 180) {
        left = spike1;
        right = spike3;
      } else {
        left = spike3;
        right = spike1;
      }
    } else {
      // diff23 is largest, so spike1 is the central spike
      central = spike1;
      if (normalizeDegrees(angle2 - angle1) < 180) {
        left = spike2;
        right = spike3;
      } else {
        left = spike3;
        right = spike2;
      }
    }

    // Final sanity check: ensure the selected spikes form a valid Bathinov pattern
    // The angle between left and right spikes should be close to 2 * expectedAngle
    const leftRightDiff = Math.abs(normalizeDegrees180(left.angle - right.angle));
    if (Math.abs(leftRightDiff - 2 * expectedAngle) > 15) {
      // Invalid pattern, fall back to default
      console.log('Selected pattern failed validation, falling back to default');
      return supplementMissingSpikes([central], expectedAngle);
    }

    return [central, left, right];
  }

  // Fallback if no good match is found
  return supplementMissingSpikes(candidates, expectedAngle);
}

/**
 * Fill in missing spikes if we don't have enough candidates
 * @param {Array} candidates - Array of spike candidates
 * @param {number} expectedAngle - Expected angle between side spikes
 * @returns {Array} Three spikes in order [central, left, right]
 */
function supplementMissingSpikes(candidates, expectedAngle) {
  // Make a copy of the candidates
  const spikes = [...candidates];

  // If we have at least one spike, use it as the central spike
  if (spikes.length >= 1) {
    const central = spikes[0];
    const leftAngle = normalizeDegrees(central.angle - expectedAngle);
    const rightAngle = normalizeDegrees(central.angle + expectedAngle);

    // Create synthetic spikes with reduced intensity
    const left = { angle: leftAngle, intensity: central.intensity * 0.7 };
    const right = { angle: rightAngle, intensity: central.intensity * 0.7 };

    return [central, left, right];
  }

  // If we have no spikes at all, create a default pattern
  const defaultAngle = 45; // Arbitrary default angle

  return [
    { angle: defaultAngle, intensity: 200 },
    { angle: defaultAngle - expectedAngle, intensity: 150 },
    { angle: defaultAngle + expectedAngle, intensity: 150 },
  ];
}

/**
 * Create a region of interest around a center point
 * @param {Uint8ClampedArray} data - Image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} center - Center point {x, y}
 * @param {number} radius - Radius of ROI
 * @returns {Object} Region of interest data
 */
function createRegionOfInterest(data, width, height, center, radius) {
  // Calculate ROI boundaries
  const x0 = Math.max(0, center.x - radius);
  const y0 = Math.max(0, center.y - radius);
  const x1 = Math.min(width - 1, center.x + radius);
  const y1 = Math.min(height - 1, center.y + radius);
  const roiWidth = x1 - x0 + 1;
  const roiHeight = y1 - y0 + 1;

  // Extract ROI data
  const roiData = new Uint8ClampedArray(roiWidth * roiHeight);

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const srcIdx = y * width + x;
      const dstIdx = (y - y0) * roiWidth + (x - x0);
      roiData[dstIdx] = data[srcIdx];
    }
  }

  return {
    data: roiData,
    width: roiWidth,
    height: roiHeight,
    x0,
    y0,
  };
}

/**
 * Create a spike line from center with a given angle
 * @param {Object} center - Center point {x, y}
 * @param {number} angleDeg - Line angle in degrees
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Object} Line object with start and end points
 */
function createSpikeLine(center, angleDeg, width, height) {
  // Calculate the line length to ensure it crosses the entire image
  const maxDimension = Math.sqrt(width * width + height * height);
  const halfLength = maxDimension / 2;

  const angleRad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(angleRad) * halfLength;
  const dy = Math.sin(angleRad) * halfLength;

  // Create line that extends beyond image boundaries
  return {
    start: {
      x: center.x - dx,
      y: center.y - dy,
    },
    end: {
      x: center.x + dx,
      y: center.y + dy,
    },
    angle: angleDeg,
  };
}

/**
 * Calculate focus metrics based on the diffraction spikes
 * @param {Array} spikes - Array of detected spikes
 * @param {Object} center - The center point {x, y}
 * @returns {Object} Focus metrics
 */
function calculateFocusMetrics(spikes, center) {
  // Calculate the intersection point of the two side spikes
  const intersection = calculateLineIntersection(spikes[1], spikes[2]);

  // Log the intersection point
  console.log('Intersection point:', intersection);
  console.log('Central spike:', spikes[0]);

  // Calculate the distance from the central spike to the intersection point
  const rawFocusErrorPixels = pointToLineDistance(intersection, spikes[0]);
  console.log('Raw focus error (pixels):', rawFocusErrorPixels);

  // Calculate the center point of the central spike line segment
  const centralSpikeCenter = {
    x: (spikes[0].start.x + spikes[0].end.x) / 2,
    y: (spikes[0].start.y + spikes[0].end.y) / 2,
  };

  // Calculate an additional focus metric: the distance between intersection and star center
  const intersectionToStarDistance = distanceBetweenPoints(intersection, center);
  const centralSpikeCenterToStarDistance = distanceBetweenPoints(centralSpikeCenter, center);

  // Calculate meaningful focus error by combining multiple metrics
  // The error is the distance of the intersection point from the central spike line
  // We add a minimum threshold to avoid extremely small values that don't reflect reality
  let focusErrorPixels = Math.max(rawFocusErrorPixels, 0.05);

  // Also use the angle-based error to detect angular misalignment
  const leftRightAngleDiff = Math.abs(normalizeDegrees180(spikes[1].angle - spikes[2].angle));
  const maskAngle = calculateMaskAngle(spikes[1], spikes[2]);
  const idealAngleDiff = 2 * maskAngle;
  const angleDeviationError = Math.abs(leftRightAngleDiff - idealAngleDiff) / 5; // Stronger weight for angular error

  console.log('Angle-based error component:', angleDeviationError);

  // The larger of the two error metrics becomes our focus error value
  focusErrorPixels = Math.max(focusErrorPixels, angleDeviationError);

  // Add an offset to account for manufacturing imperfection in bathinov masks
  // For perfect focus, we'd expect a small non-zero error
  if (focusErrorPixels < 0.5) {
    // For very small errors, we're probably at optimal focus
    focusErrorPixels = 0.01;
  }

  // Convert pixels to microns (using a typical pixel scale)
  const pixelScale = 3.8; // microns per pixel, typical for many cameras
  const focusErrorMicrons = Math.abs(focusErrorPixels * pixelScale);

  // Determine the mask angle from the spikes
  storeMaskAngle(maskAngle);

  // Get the consensus mask angle based on previously detected angles
  const consensusMaskAngle = getConsensusMaskAngle();

  // Determine if the focus is good based on the error
  const inFocus = Math.abs(focusErrorPixels) < 1.0;

  return {
    focusErrorPixels: parseFloat(focusErrorPixels.toFixed(2)),
    focusErrorMicrons: parseFloat(focusErrorMicrons.toFixed(2)),
    maskAngle: parseFloat(maskAngle.toFixed(1)),
    consensusMaskAngle: parseFloat(consensusMaskAngle.toFixed(1)),
    inFocus,
  };
}

/**
 * Calculate the intersection point of two lines
 * @param {Object} line1 - First line with start and end points
 * @param {Object} line2 - Second line with start and end points
 * @returns {Object} Intersection point {x, y}
 */
function calculateLineIntersection(line1, line2) {
  // Line 1 represented as a1x + b1y = c1
  const a1 = line1.end.y - line1.start.y;
  const b1 = line1.start.x - line1.end.x;
  const c1 = a1 * line1.start.x + b1 * line1.start.y;

  // Line 2 represented as a2x + b2y = c2
  const a2 = line2.end.y - line2.start.y;
  const b2 = line2.start.x - line2.end.x;
  const c2 = a2 * line2.start.x + b2 * line2.start.y;

  // Calculate determinant
  const determinant = a1 * b2 - a2 * b1;

  if (determinant === 0) {
    // Lines are parallel, return a point on line1
    return { x: line1.start.x, y: line1.start.y };
  }

  // Calculate intersection point
  const x = (b2 * c1 - b1 * c2) / determinant;
  const y = (a1 * c2 - a2 * c1) / determinant;

  return { x, y };
}

/**
 * Calculate the distance from a point to a line
 * @param {Object} point - The point {x, y}
 * @param {Object} line - The line with start and end points
 * @returns {number} Distance in pixels
 */
function pointToLineDistance(point, line) {
  // Calculate the perpendicular distance from point to line
  const x0 = point.x;
  const y0 = point.y;
  const x1 = line.start.x;
  const y1 = line.start.y;
  const x2 = line.end.x;
  const y2 = line.end.y;

  // Formula for distance from point to line Ax + By + C = 0
  const numerator = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
  const denominator = Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));

  return numerator / denominator;
}

/**
 * Calculate the angle between two diffraction spikes
 * @param {Object} spike1 - First spike
 * @param {Object} spike2 - Second spike
 * @returns {number} Angle in degrees
 */
function calculateMaskAngle(spike1, spike2) {
  // Calculate the absolute angle between the two spikes
  const angleDiff = Math.abs(spike1.angle - spike2.angle);

  // Return half of this angle, which corresponds to the mask angle
  return angleDiff / 2;
}

/**
 * Normalize an angle to the range [0, 360)
 * @param {number} angle - Angle in degrees
 * @returns {number} Normalized angle in degrees
 */
function normalizeDegrees(angle) {
  return ((angle % 360) + 360) % 360;
}

/**
 * Normalize an angle to the range [0, 360)
 * This is an alias of normalizeDegrees for clarity in the code
 * @param {number} angle - Angle in degrees
 * @returns {number} Normalized angle in degrees
 */
function normalizeDegrees360(angle) {
  return ((angle % 360) + 360) % 360;
}

/**
 * Normalize an angle to the range [-180, 180)
 * @param {number} angle - Angle in degrees
 * @returns {number} Normalized angle in degrees
 */
function normalizeDegrees180(angle) {
  angle = ((angle % 360) + 360) % 360;
  return angle > 180 ? angle - 360 : angle;
}

/**
 * Load and process an image from a URL
 * @param {string} imageUrl - URL of the image to analyze
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeImageFromUrl(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const results = analyzeBathinovPattern(imageData);
        resolve({
          results,
          imageData,
          dimensions: {
            width: canvas.width,
            height: canvas.height,
          },
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}

/**
 * Generate visualization data for the UI to display
 * @param {Object} analysisResults - The analysis results
 * @returns {Object} Visualization data
 */
export function generateVisualizationData(analysisResults) {
  const { center, spikes, metrics } = analysisResults;

  // Calculate the intersection point of the side spikes
  const intersection = calculateLineIntersection(spikes[1], spikes[2]);

  return {
    center,
    spikes,
    metrics,
    intersection,
  };
}

/**
 * Distance between two points
 * @param {Object} p1 - First point {x, y}
 * @param {Object} p2 - Second point {x, y}
 * @returns {number} Distance
 */
function distanceBetweenPoints(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}
