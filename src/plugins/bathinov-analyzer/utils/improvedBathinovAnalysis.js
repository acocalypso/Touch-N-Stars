/**
 * Improved Bathinov Mask Focus Analysis Utility
 *
 * This module provides enhanced accuracy for analyzing Bathinov mask diffraction patterns
 * using advanced image processing techniques including Canny edge detection,
 * Hough Transform for line detection, and robust focus metric calculations.
 */

// Analysis constants
const DEFAULT_MASK_ANGLE = 34; // Most common mask angle
const GAUSSIAN_SIGMA = 1.0; // Gaussian blur sigma for preprocessing
const CANNY_LOW_THRESHOLD = 50; // Canny edge detection low threshold
const CANNY_HIGH_THRESHOLD = 150; // Canny edge detection high threshold

/**
 * Main analysis function for Bathinov diffraction patterns
 * @param {ImageData} imageData - The image data to analyze
 * @param {Object} options - Analysis options
 * @returns {Object} Analysis results
 */
export function analyzeBathinovPatternImproved(imageData, options = {}) {
  try {
    const { data, width, height } = imageData;

    // Configuration
    const config = {
      maskAngle: options.maskAngle || DEFAULT_MASK_ANGLE,
      pixelScale: options.pixelScale || 3.8, // microns per pixel
      gaussianSigma: options.gaussianSigma || GAUSSIAN_SIGMA,
      cannyLow: options.cannyLow || CANNY_LOW_THRESHOLD,
      cannyHigh: options.cannyHigh || CANNY_HIGH_THRESHOLD,
      ...options,
    };

    console.log('Starting improved Bathinov analysis with config:', config);

    // Step 1: Find the brightest point (star center)
    const center = findStarCenter(data, width, height);
    console.log('Star center found at:', center);

    // Step 2: Preprocess the image for edge detection
    const preprocessed = preprocessImageForEdgeDetection(data, width, height, config);

    // Step 3: Apply Canny edge detection
    const edges = applyCanny(preprocessed, width, height, config.cannyLow, config.cannyHigh);

    // Step 4: Detect lines using Hough Transform
    const lines = detectLinesHough(edges, width, height, center);

    // Step 5: Filter and classify lines as diffraction spikes
    const spikes = classifyBathinovSpikes(lines, center, config.maskAngle);

    // Step 6: Calculate focus metrics
    const metrics = calculateFocusMetricsImproved(spikes, center, config);

    return {
      center,
      spikes,
      metrics,
      config,
      debug: {
        linesDetected: lines.length,
        spikesClassified: spikes.length,
      },
    };
  } catch (error) {
    console.error('Error in improved Bathinov analysis:', error);
    throw error;
  }
}

/**
 * Find the center of the star using centroid calculation
 * @param {Uint8ClampedArray} data - Image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Object} Star center {x, y, brightness}
 */
function findStarCenter(data, width, height) {
  // First pass: find approximate brightest region
  let maxBrightness = 0;
  let approxX = Math.floor(width / 2);
  let approxY = Math.floor(height / 2);

  const scanStep = Math.max(1, Math.floor(Math.min(width, height) / 100));

  for (let y = 0; y < height; y += scanStep) {
    for (let x = 0; x < width; x += scanStep) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      if (brightness > maxBrightness) {
        maxBrightness = brightness;
        approxX = x;
        approxY = y;
      }
    }
  }

  // Second pass: calculate precise centroid in the bright region
  const radius = Math.min(50, Math.min(width, height) / 10);
  const minX = Math.max(0, approxX - radius);
  const maxX = Math.min(width - 1, approxX + radius);
  const minY = Math.max(0, approxY - radius);
  const maxY = Math.min(height - 1, approxY + radius);

  let totalBrightness = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      // Only consider pixels above a threshold
      if (brightness > maxBrightness * 0.3) {
        totalBrightness += brightness;
        weightedX += x * brightness;
        weightedY += y * brightness;
      }
    }
  }

  const centerX = totalBrightness > 0 ? weightedX / totalBrightness : approxX;
  const centerY = totalBrightness > 0 ? weightedY / totalBrightness : approxY;

  return {
    x: centerX,
    y: centerY,
    brightness: maxBrightness,
  };
}

/**
 * Preprocess image for edge detection
 * @param {Uint8ClampedArray} data - Image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} config - Configuration options
 * @returns {Uint8ClampedArray} Preprocessed grayscale image
 */
function preprocessImageForEdgeDetection(data, width, height, config) {
  // Convert to grayscale with enhanced contrast
  const grayscale = new Uint8ClampedArray(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Weighted conversion emphasizing blue channel for diffraction
      const gray = Math.round(0.2 * data[idx] + 0.3 * data[idx + 1] + 0.5 * data[idx + 2]);
      grayscale[y * width + x] = gray;
    }
  }

  // Apply Gaussian blur to reduce noise
  const blurred = applyGaussianBlur(grayscale, width, height, config.gaussianSigma);

  // Enhance contrast
  return enhanceContrast(blurred, width, height);
}

/**
 * Apply Gaussian blur filter
 * @param {Uint8ClampedArray} image - Grayscale image
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} sigma - Gaussian sigma
 * @returns {Uint8ClampedArray} Blurred image
 */
function applyGaussianBlur(image, width, height, sigma) {
  const kernelSize = Math.ceil(sigma * 3) * 2 + 1;
  const halfSize = Math.floor(kernelSize / 2);

  // Create Gaussian kernel
  const kernel = new Array(kernelSize);
  let sum = 0;

  for (let i = 0; i < kernelSize; i++) {
    const x = i - halfSize;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }

  // Normalize kernel
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= sum;
  }

  const result = new Uint8ClampedArray(width * height);

  // Apply separable convolution (horizontal then vertical)
  const temp = new Uint8ClampedArray(width * height);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0;
      for (let k = 0; k < kernelSize; k++) {
        const xOffset = Math.min(Math.max(0, x + k - halfSize), width - 1);
        value += image[y * width + xOffset] * kernel[k];
      }
      temp[y * width + x] = value;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0;
      for (let k = 0; k < kernelSize; k++) {
        const yOffset = Math.min(Math.max(0, y + k - halfSize), height - 1);
        value += temp[yOffset * width + x] * kernel[k];
      }
      result[y * width + x] = value;
    }
  }

  return result;
}

/**
 * Enhance image contrast
 * @param {Uint8ClampedArray} image - Input image
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Uint8ClampedArray} Enhanced image
 */
function enhanceContrast(image, width, height) {
  // Calculate histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < image.length; i++) {
    histogram[Math.floor(image[i])]++;
  }

  // Find meaningful range (exclude extreme outliers)
  let minVal = 0,
    maxVal = 255;
  const totalPixels = width * height;
  const excludePercent = 0.02; // Exclude top/bottom 2%

  let cumulativeCount = 0;
  for (let i = 0; i < 256; i++) {
    cumulativeCount += histogram[i];
    if (cumulativeCount > totalPixels * excludePercent) {
      minVal = i;
      break;
    }
  }

  cumulativeCount = 0;
  for (let i = 255; i >= 0; i--) {
    cumulativeCount += histogram[i];
    if (cumulativeCount > totalPixels * excludePercent) {
      maxVal = i;
      break;
    }
  }

  // Apply contrast stretching
  const range = maxVal - minVal;
  const result = new Uint8ClampedArray(width * height);

  if (range > 0) {
    for (let i = 0; i < image.length; i++) {
      const normalized = Math.max(0, Math.min(1, (image[i] - minVal) / range));
      result[i] = Math.round(normalized * 255);
    }
  } else {
    result.set(image);
  }

  return result;
}

/**
 * Apply Canny edge detection
 * @param {Uint8ClampedArray} image - Preprocessed grayscale image
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} lowThreshold - Low threshold for hysteresis
 * @param {number} highThreshold - High threshold for hysteresis
 * @returns {Uint8ClampedArray} Binary edge image
 */
function applyCanny(image, width, height, lowThreshold, highThreshold) {
  // Step 1: Calculate gradients using Sobel operators
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ];

  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ];

  const gradientMagnitude = new Float32Array(width * height);
  const gradientDirection = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0,
        gy = 0;

      // Apply Sobel kernels
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelValue = image[(y + ky) * width + (x + kx)];
          gx += pixelValue * sobelX[ky + 1][kx + 1];
          gy += pixelValue * sobelY[ky + 1][kx + 1];
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const direction = Math.atan2(gy, gx);

      gradientMagnitude[y * width + x] = magnitude;
      gradientDirection[y * width + x] = direction;
    }
  }

  // Step 2: Non-maximum suppression
  const suppressed = new Uint8ClampedArray(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const magnitude = gradientMagnitude[y * width + x];
      const direction = gradientDirection[y * width + x];

      // Quantize direction to 0, 45, 90, 135 degrees
      let angle = ((direction * 180) / Math.PI + 180) % 180;

      let neighbor1, neighbor2;

      if ((angle >= 0 && angle < 22.5) || (angle >= 157.5 && angle <= 180)) {
        // 0 degrees - horizontal
        neighbor1 = gradientMagnitude[y * width + x - 1];
        neighbor2 = gradientMagnitude[y * width + x + 1];
      } else if (angle >= 22.5 && angle < 67.5) {
        // 45 degrees - diagonal
        neighbor1 = gradientMagnitude[(y - 1) * width + x + 1];
        neighbor2 = gradientMagnitude[(y + 1) * width + x - 1];
      } else if (angle >= 67.5 && angle < 112.5) {
        // 90 degrees - vertical
        neighbor1 = gradientMagnitude[(y - 1) * width + x];
        neighbor2 = gradientMagnitude[(y + 1) * width + x];
      } else {
        // 135 degrees - diagonal
        neighbor1 = gradientMagnitude[(y - 1) * width + x - 1];
        neighbor2 = gradientMagnitude[(y + 1) * width + x + 1];
      }

      if (magnitude >= neighbor1 && magnitude >= neighbor2) {
        suppressed[y * width + x] = Math.min(255, magnitude);
      }
    }
  }

  // Step 3: Double threshold and hysteresis
  const edges = new Uint8ClampedArray(width * height);
  const strongPixels = [];

  // Apply thresholds
  for (let i = 0; i < suppressed.length; i++) {
    if (suppressed[i] >= highThreshold) {
      edges[i] = 255; // Strong edge
      strongPixels.push(i);
    } else if (suppressed[i] >= lowThreshold) {
      edges[i] = 128; // Weak edge
    }
  }

  // Hysteresis - connect weak edges to strong edges
  const visited = new Set();

  for (const strongPixel of strongPixels) {
    if (visited.has(strongPixel)) continue;

    const stack = [strongPixel];
    visited.add(strongPixel);

    while (stack.length > 0) {
      const current = stack.pop();
      const y = Math.floor(current / width);
      const x = current % width;

      // Check 8-connected neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const ny = y + dy;
          const nx = x + dx;

          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const neighborIdx = ny * width + nx;

            if (!visited.has(neighborIdx) && edges[neighborIdx] === 128) {
              edges[neighborIdx] = 255; // Promote weak edge to strong
              stack.push(neighborIdx);
              visited.add(neighborIdx);
            }
          }
        }
      }
    }
  }

  // Clean up - remove remaining weak edges
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] === 128) {
      edges[i] = 0;
    }
  }

  return edges;
}

/**
 * Detect lines using Hough Transform
 * @param {Uint8ClampedArray} edges - Binary edge image
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} center - Star center point
 * @returns {Array} Detected lines
 */
function detectLinesHough(edges, width, height, center) {
  const maxRho = Math.sqrt(width * width + height * height);
  const rhoResolution = 1;
  const thetaResolution = Math.PI / 180; // 1 degree resolution

  const rhoSteps = Math.round((2 * maxRho) / rhoResolution);
  const thetaSteps = Math.round(Math.PI / thetaResolution);

  // Hough accumulator
  const accumulator = Array(rhoSteps)
    .fill(null)
    .map(() => Array(thetaSteps).fill(0));

  // Transform edge pixels to Hough space
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] > 0) {
        // Only consider edges within a reasonable distance from center
        const distFromCenter = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
        if (distFromCenter < Math.min(width, height) * 0.4) {
          for (let thetaIdx = 0; thetaIdx < thetaSteps; thetaIdx++) {
            const theta = thetaIdx * thetaResolution;
            const rho = x * Math.cos(theta) + y * Math.sin(theta);
            const rhoIdx = Math.round((rho + maxRho) / rhoResolution);

            if (rhoIdx >= 0 && rhoIdx < rhoSteps) {
              accumulator[rhoIdx][thetaIdx]++;
            }
          }
        }
      }
    }
  }

  // Find peaks in accumulator
  const lines = [];
  const threshold = Math.max(20, Math.min(width, height) * 0.1);

  for (let rhoIdx = 0; rhoIdx < rhoSteps; rhoIdx++) {
    for (let thetaIdx = 0; thetaIdx < thetaSteps; thetaIdx++) {
      if (accumulator[rhoIdx][thetaIdx] >= threshold) {
        // Check if this is a local maximum
        let isMaximum = true;
        const radius = 5; // Search radius for local maximum

        for (let dr = -radius; dr <= radius && isMaximum; dr++) {
          for (let dt = -radius; dt <= radius && isMaximum; dt++) {
            const nr = rhoIdx + dr;
            const nt = (thetaIdx + dt + thetaSteps) % thetaSteps;

            if (nr >= 0 && nr < rhoSteps && (dr !== 0 || dt !== 0)) {
              if (accumulator[nr][nt] > accumulator[rhoIdx][thetaIdx]) {
                isMaximum = false;
              }
            }
          }
        }

        if (isMaximum) {
          const rho = rhoIdx * rhoResolution - maxRho;
          const theta = thetaIdx * thetaResolution;
          const strength = accumulator[rhoIdx][thetaIdx];

          lines.push({
            rho,
            theta,
            strength,
            angle: ((theta * 180) / Math.PI) % 180,
          });
        }
      }
    }
  }

  // Sort by strength and return top lines
  lines.sort((a, b) => b.strength - a.strength);
  return lines.slice(0, 20); // Return top 20 lines
}

/**
 * Classify detected lines as Bathinov diffraction spikes
 * @param {Array} lines - Detected lines from Hough transform
 * @param {Object} center - Star center point
 * @param {number} expectedMaskAngle - Expected mask angle
 * @returns {Array} Classified spikes
 */
function classifyBathinovSpikes(lines, center, expectedMaskAngle) {
  if (lines.length < 3) {
    console.warn('Not enough lines detected for Bathinov pattern');
    return createFallbackSpikes(center, expectedMaskAngle);
  }

  // Group lines by similar angles (within 10 degrees)
  const angleGroups = [];
  const angleThreshold = 10;

  for (const line of lines) {
    let foundGroup = false;

    for (const group of angleGroups) {
      const avgAngle = group.reduce((sum, l) => sum + l.angle, 0) / group.length;
      const angleDiff = Math.min(
        Math.abs(line.angle - avgAngle),
        Math.abs(line.angle - avgAngle + 180),
        Math.abs(line.angle - avgAngle - 180)
      );

      if (angleDiff < angleThreshold) {
        group.push(line);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      angleGroups.push([line]);
    }
  }

  // Sort groups by total strength
  angleGroups.sort((a, b) => {
    const strengthA = a.reduce((sum, l) => sum + l.strength, 0);
    const strengthB = b.reduce((sum, l) => sum + l.strength, 0);
    return strengthB - strengthA;
  });

  // Select the best three groups for Bathinov pattern
  if (angleGroups.length >= 3) {
    const topGroups = angleGroups.slice(0, 3);

    // Get representative line from each group (strongest)
    const spikes = topGroups.map((group) => {
      const bestLine = group.reduce((best, line) => (line.strength > best.strength ? line : best));

      return convertLineToSpike(bestLine);
    });

    // Try to identify the central spike and side spikes
    return orderSpikesByBathinovPattern(spikes, expectedMaskAngle);
  }

  console.warn('Could not identify proper Bathinov pattern');
  return createFallbackSpikes(center, expectedMaskAngle);
}

/**
 * Convert Hough line to spike format
 * @param {Object} line - Hough line
 * @returns {Object} Spike object
 */
function convertLineToSpike(line) {
  const { rho, theta } = line;

  // Calculate line endpoints
  const cos_t = Math.cos(theta);
  const sin_t = Math.sin(theta);

  // Find intersection points with image boundaries
  const length = 1000; // Extend line well beyond image

  const x0 = cos_t * rho;
  const y0 = sin_t * rho;

  return {
    start: {
      x: x0 - length * sin_t,
      y: y0 + length * cos_t,
    },
    end: {
      x: x0 + length * sin_t,
      y: y0 - length * cos_t,
    },
    angle: ((theta * 180) / Math.PI) % 180,
    strength: line.strength,
    rho,
    theta,
  };
}

/**
 * Order spikes according to Bathinov pattern
 * @param {Array} spikes - Detected spikes
 * @param {number} expectedMaskAngle - Expected mask angle
 * @returns {Array} Ordered spikes [central, left, right]
 */
function orderSpikesByBathinovPattern(spikes, expectedMaskAngle) {
  if (spikes.length < 3) {
    return createFallbackSpikes({ x: 0, y: 0 }, expectedMaskAngle);
  }

  // Find the best triplet that matches Bathinov pattern
  let bestScore = -Infinity;
  let bestTriplet = null;

  for (let i = 0; i < spikes.length; i++) {
    for (let j = i + 1; j < spikes.length; j++) {
      for (let k = j + 1; k < spikes.length; k++) {
        const triplet = [spikes[i], spikes[j], spikes[k]];
        const score = scoreBathinovTriplet(triplet, expectedMaskAngle);

        if (score > bestScore) {
          bestScore = score;
          bestTriplet = triplet;
        }
      }
    }
  }

  if (bestTriplet) {
    return orderTripletSpikes(bestTriplet);
  }

  // Fallback to first three spikes
  return spikes.slice(0, 3);
}

/**
 * Score a triplet of spikes for Bathinov pattern matching
 * @param {Array} triplet - Three spikes
 * @param {number} expectedMaskAngle - Expected mask angle
 * @returns {number} Pattern matching score
 */
function scoreBathinovTriplet(triplet, expectedMaskAngle) {
  const angles = triplet.map((spike) => spike.angle);

  // Calculate angle differences
  const diffs = [];
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      const diff = Math.abs(angles[i] - angles[j]);
      diffs.push(Math.min(diff, 180 - diff));
    }
  }

  diffs.sort((a, b) => a - b);

  // For Bathinov pattern, we expect:
  // - Two spikes separated by ~2*maskAngle
  // - One spike roughly in the middle
  const idealSeparation = 2 * expectedMaskAngle;
  const idealHalfSeparation = expectedMaskAngle;

  let score = 0;

  // Check if we have the expected angular relationships
  const largeDiff = diffs[2]; // Largest difference
  const mediumDiff = diffs[1]; // Medium difference
  const smallDiff = diffs[0]; // Smallest difference

  // Score based on how close the large difference is to ideal separation
  score += Math.max(0, 100 - Math.abs(largeDiff - idealSeparation) * 2);

  // Score based on how close medium/small differences are to half separation
  score += Math.max(0, 50 - Math.abs(mediumDiff - idealHalfSeparation) * 2);
  score += Math.max(0, 50 - Math.abs(smallDiff - idealHalfSeparation) * 2);

  // Bonus for strength
  const totalStrength = triplet.reduce((sum, spike) => sum + spike.strength, 0);
  score += totalStrength * 0.1;

  return score;
}

/**
 * Order triplet spikes into central, left, right
 * @param {Array} triplet - Three spikes
 * @returns {Array} Ordered spikes [central, left, right]
 */
function orderTripletSpikes(triplet) {
  // Sort by angle
  const sorted = [...triplet].sort((a, b) => a.angle - b.angle);

  // The central spike is typically the one with an angle roughly
  // in the middle of the other two, or the strongest one
  const angles = sorted.map((s) => s.angle);

  // Check angle differences to identify the central spike
  const diff1 = Math.abs(angles[1] - angles[0]);
  const diff2 = Math.abs(angles[2] - angles[1]);

  let central, left, right;

  if (Math.abs(diff1 - diff2) < 5) {
    // Roughly equal spacing - middle one is central
    central = sorted[1];
    left = sorted[0];
    right = sorted[2];
  } else {
    // Unequal spacing - use strength to determine central
    const strongest = triplet.reduce((best, spike) =>
      spike.strength > best.strength ? spike : best
    );

    central = strongest;
    const others = triplet.filter((s) => s !== strongest);

    // Order others by angle relative to central
    if (others[0].angle < central.angle) {
      left = others[0];
      right = others[1];
    } else {
      left = others[1];
      right = others[0];
    }
  }

  return [central, left, right];
}

/**
 * Create fallback spikes when detection fails
 * @param {Object} center - Star center
 * @param {number} maskAngle - Mask angle
 * @returns {Array} Fallback spikes
 */
function createFallbackSpikes(center, maskAngle) {
  const centralAngle = 90; // Vertical
  const leftAngle = centralAngle - maskAngle;
  const rightAngle = centralAngle + maskAngle;

  return [
    createSpikeFromAngle(center, centralAngle, 1000),
    createSpikeFromAngle(center, leftAngle, 800),
    createSpikeFromAngle(center, rightAngle, 800),
  ];
}

/**
 * Create a spike from center point and angle
 * @param {Object} center - Star center
 * @param {number} angleDeg - Angle in degrees
 * @param {number} strength - Spike strength
 * @returns {Object} Spike object
 */
function createSpikeFromAngle(center, angleDeg, strength = 1000) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const length = 1000;

  const dx = Math.cos(angleRad) * length;
  const dy = Math.sin(angleRad) * length;

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
    strength,
  };
}

/**
 * Calculate improved focus metrics
 * @param {Array} spikes - Detected spikes [central, left, right]
 * @param {Object} center - Star center
 * @param {Object} config - Configuration
 * @returns {Object} Focus metrics
 */
function calculateFocusMetricsImproved(spikes, center, config) {
  if (spikes.length < 3) {
    return {
      focusErrorPixels: 999,
      focusErrorMicrons: 999 * config.pixelScale,
      maskAngle: config.maskAngle,
      inFocus: false,
      confidence: 0,
    };
  }

  const [central, left, right] = spikes;

  // Calculate intersection of side spikes
  const intersection = calculateLineIntersection(left, right);

  // Calculate perpendicular distance from intersection to central spike
  const focusErrorPixels = pointToLineDistance(intersection, central);

  // Calculate mask angle from side spikes
  const measuredMaskAngle = Math.abs(left.angle - right.angle) / 2;

  // Calculate confidence based on spike strength and pattern quality
  const avgStrength = spikes.reduce((sum, s) => sum + (s.strength || 1000), 0) / 3;
  const strengthConfidence = Math.min(1, avgStrength / 100);

  const angleDeviation = Math.abs(measuredMaskAngle - config.maskAngle);
  const angleConfidence = Math.max(0, 1 - angleDeviation / 10);

  const confidence = (strengthConfidence + angleConfidence) / 2;

  return {
    focusErrorPixels: Math.max(0.01, focusErrorPixels),
    focusErrorMicrons: Math.max(0.01, focusErrorPixels * config.pixelScale),
    maskAngle: measuredMaskAngle,
    inFocus: focusErrorPixels < 1.5,
    confidence: Math.round(confidence * 100),
    intersection,
  };
}

/**
 * Calculate intersection of two lines
 * @param {Object} line1 - First line
 * @param {Object} line2 - Second line
 * @returns {Object} Intersection point
 */
function calculateLineIntersection(line1, line2) {
  const x1 = line1.start.x,
    y1 = line1.start.y;
  const x2 = line1.end.x,
    y2 = line1.end.y;
  const x3 = line2.start.x,
    y3 = line2.start.y;
  const x4 = line2.end.x,
    y4 = line2.end.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (Math.abs(denom) < 1e-6) {
    // Lines are parallel, return midpoint of first line
    return {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
    };
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;

  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1),
  };
}

/**
 * Calculate distance from point to line
 * @param {Object} point - Point {x, y}
 * @param {Object} line - Line with start and end points
 * @returns {number} Distance in pixels
 */
function pointToLineDistance(point, line) {
  const x0 = point.x,
    y0 = point.y;
  const x1 = line.start.x,
    y1 = line.start.y;
  const x2 = line.end.x,
    y2 = line.end.y;

  const A = y2 - y1;
  const B = x1 - x2;
  const C = x2 * y1 - x1 * y2;

  const distance = Math.abs(A * x0 + B * y0 + C) / Math.sqrt(A * A + B * B);
  return distance;
}

/**
 * Analyze image region with improved algorithm
 * @param {string} imageUrl - Image URL
 * @param {Object} region - Selected region
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeImageRegionImproved(imageUrl, region) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = region.width;
        canvas.height = region.height;

        // Draw the selected region
        ctx.drawImage(
          img,
          region.x,
          region.y,
          region.width,
          region.height,
          0,
          0,
          region.width,
          region.height
        );

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Run improved analysis
        const analysisResults = analyzeBathinovPatternImproved(imageData, {
          maskAngle: DEFAULT_MASK_ANGLE,
          pixelScale: 3.8,
        });

        // Adjust coordinates to full image space
        if (analysisResults.center) {
          analysisResults.center.x += region.x;
          analysisResults.center.y += region.y;
        }

        if (analysisResults.spikes) {
          analysisResults.spikes = analysisResults.spikes.map((spike) => ({
            start: {
              x: spike.start.x + region.x,
              y: spike.start.y + region.y,
            },
            end: {
              x: spike.end.x + region.x,
              y: spike.end.y + region.y,
            },
            angle: spike.angle,
            strength: spike.strength,
          }));
        }

        if (analysisResults.metrics && analysisResults.metrics.intersection) {
          analysisResults.metrics.intersection.x += region.x;
          analysisResults.metrics.intersection.y += region.y;
        }

        resolve({
          results: analysisResults,
          dimensions: {
            width: img.width,
            height: img.height,
          },
          region,
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
