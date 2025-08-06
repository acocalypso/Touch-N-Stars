/**
 * Improved Bathinov Mask Focus Analysis Utility
 * Simplified and more accurate spike detection algorithm
 */

// Image analysis constants
const MASK_ANGLE_DEFAULT = 34; // Default mask angle in degrees (typical Bathinov mask)

/**
 * Process an image to find Bathinov diffraction spikes with improved accuracy
 * @param {ImageData} imageData - The image data to analyze
 * @returns {Object} Analysis results including spike positions and focus metrics
 */
export function analyzeBathinovPattern(imageData) {
  try {
    // Create an ImageData object from the image source
    const { data, width, height } = imageData;

    console.log('Starting improved Bathinov analysis...');

    // Find the brightest point in the image (likely the center of the star)
    const center = findBrightestPoint(data, width, height);
    console.log('Star center found at:', center);

    // Use improved detection method
    const spikes = detectDiffractionSpikesImproved(data, width, height, center);
    console.log('Detected spikes:', spikes.length);

    // Calculate focus metrics
    const metrics = calculateFocusMetrics(spikes);

    return {
      center,
      spikes,
      metrics,
    };
  } catch (error) {
    console.error('Error analyzing image region:', error);
    throw error;
  }
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

      // Calculate brightness (weighted average for astronomical images)
      const brightness = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;

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
 * Detect diffraction spikes in the image using direct brightness analysis
 * @param {Uint8ClampedArray} data - Image data array
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} center - The brightest point {x, y}
 * @returns {Array} Array of three spikes, each with start and end points
 */
function detectDiffractionSpikesImproved(data, width, height, center) {
  console.log(`Analyzing center: x=${center.x}, y=${center.y}`);

  // Sample intensity along radial lines from center
  const intensityProfile = analyzeRadialIntensity(data, width, height, center);

  // Find the peaks in the intensity profile that represent spikes
  const spikeCandidates = findIntensityPeaks(intensityProfile);

  console.log(`Found ${spikeCandidates.length} spike candidates`);
  console.log(
    'Top candidates:',
    spikeCandidates.slice(0, 5).map((c) => `${c.angle}° (${c.strength.toFixed(1)})`)
  );

  // Select the best 3 spikes that form a Bathinov pattern
  const selectedSpikes = selectBestSpikes(spikeCandidates, center, width, height);
  console.log(
    'Selected spikes angles:',
    selectedSpikes.map((s) => `${s.angle}°`)
  );

  return selectedSpikes;
}

/**
 * Analyze radial intensity from the center point
 * @param {Uint8ClampedArray} data - Image data array
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} center - Star center
 * @returns {Array} Intensity values for each angle
 */
function analyzeRadialIntensity(data, width, height, center) {
  const numAngles = 360; // 1 degree steps
  const maxRadius = Math.min(width, height) * 0.4;
  const intensities = new Array(numAngles).fill(0);

  for (let angleDeg = 0; angleDeg < numAngles; angleDeg++) {
    const angleRad = (angleDeg * Math.PI) / 180;
    const cos_a = Math.cos(angleRad);
    const sin_a = Math.sin(angleRad);

    let totalIntensity = 0;
    let maxIntensity = 0;
    let sampleCount = 0;

    // Sample along this radial line
    for (let r = 15; r < maxRadius; r += 3) {
      const x = Math.round(center.x + r * cos_a);
      const y = Math.round(center.y + r * sin_a);

      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        const brightness = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;

        totalIntensity += brightness;
        maxIntensity = Math.max(maxIntensity, brightness);
        sampleCount++;
      }
    }

    // Use combination of average and max intensity
    if (sampleCount > 0) {
      const avgIntensity = totalIntensity / sampleCount;
      intensities[angleDeg] = avgIntensity * 0.3 + maxIntensity * 0.7;
    }
  }

  return intensities;
}

/**
 * Find peaks in the intensity profile that represent diffraction spikes
 * @param {Array} intensities - Intensity values for each angle
 * @returns {Array} Spike candidates with angle and strength
 */
function findIntensityPeaks(intensities) {
  const peaks = [];
  const maxIntensity = Math.max(...intensities);
  const avgIntensity = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;

  // More dynamic threshold - higher for out-of-focus images with strong spikes
  const dynamicThreshold = Math.max(maxIntensity * 0.3, avgIntensity * 2);

  console.log(
    `Intensity stats - Max: ${maxIntensity.toFixed(1)}, Avg: ${avgIntensity.toFixed(1)}, Threshold: ${dynamicThreshold.toFixed(1)}`
  );

  // Smooth the data first
  const smoothed = smoothIntensityProfile(intensities);

  // Find local maxima with stricter requirements
  for (let i = 10; i < smoothed.length - 10; i++) {
    const current = smoothed[i];

    if (current < dynamicThreshold) continue;

    // Check if this is a prominent local maximum
    let isPeak = true;
    let prominenceScore = 0;

    // Check larger neighborhood for more robust peak detection
    for (let j = -10; j <= 10; j++) {
      if (j === 0) continue;
      const neighborIdx = (i + j + smoothed.length) % smoothed.length;
      if (smoothed[neighborIdx] > current) {
        isPeak = false;
        break;
      }
      // Calculate prominence
      prominenceScore += Math.max(0, current - smoothed[neighborIdx]);
    }

    // Require minimum prominence to avoid noise
    const minProminence = maxIntensity * 0.1;

    if (isPeak && prominenceScore > minProminence) {
      peaks.push({
        angle: i,
        strength: current,
        prominence: prominenceScore,
        normalizedAngle: i % 180, // Normalize to 0-179 since spikes are bidirectional
      });
    }
  }

  console.log(`Found ${peaks.length} raw peaks before grouping`);

  // Group similar angles and keep strongest
  const groupedPeaks = groupSimilarAngles(peaks);

  console.log(`After grouping: ${groupedPeaks.length} peaks`);

  return groupedPeaks.sort((a, b) => b.strength - a.strength);
}

/**
 * Smooth the intensity profile to reduce noise
 * @param {Array} intensities - Raw intensity values
 * @returns {Array} Smoothed intensities
 */
function smoothIntensityProfile(intensities) {
  const smoothed = new Array(intensities.length);
  const windowSize = 7;
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < intensities.length; i++) {
    let sum = 0;
    let count = 0;

    for (let j = -halfWindow; j <= halfWindow; j++) {
      const idx = (i + j + intensities.length) % intensities.length;
      sum += intensities[idx];
      count++;
    }

    smoothed[i] = sum / count;
  }

  return smoothed;
}

/**
 * Group similar angles and keep the strongest peak in each group
 * @param {Array} peaks - Raw peaks
 * @returns {Array} Grouped peaks
 */
function groupSimilarAngles(peaks) {
  const grouped = [];
  const angleThreshold = 10; // degrees

  for (const peak of peaks) {
    let addedToGroup = false;

    for (const group of grouped) {
      let angleDiff = Math.abs(peak.normalizedAngle - group.normalizedAngle);
      angleDiff = Math.min(angleDiff, 180 - angleDiff); // Handle wraparound

      if (angleDiff < angleThreshold) {
        // Add to existing group, keep strongest
        if (peak.strength > group.strength) {
          group.angle = peak.angle;
          group.strength = peak.strength;
          group.normalizedAngle = peak.normalizedAngle;
        }
        addedToGroup = true;
        break;
      }
    }

    if (!addedToGroup) {
      grouped.push({ ...peak });
    }
  }

  return grouped;
}

/**
 * Select the best 3 spikes that form a Bathinov pattern
 * @param {Array} candidates - Spike candidates
 * @param {Object} center - Star center
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Array} Three selected spikes
 */
function selectBestSpikes(candidates, center, width, height) {
  if (candidates.length < 3) {
    console.log('Not enough candidates, creating fallback pattern');
    return createFallbackPattern(center, width, height);
  }

  // Filter candidates by minimum strength to avoid weak detections
  const strongCandidates = candidates.filter((c) => c.strength > 50);

  if (strongCandidates.length < 3) {
    console.log('Not enough strong candidates, using all available');
    // Still try to work with what we have, but mark them as weak
    const result = convertToSpikeLines(candidates.slice(0, 3), center, width, height);
    // Mark these as low-strength detections
    result.forEach((spike) => {
      spike.strength = Math.min(spike.strength, 30);
    });
    return result;
  }

  // Try to find a good triplet from strong candidates
  let bestTriplet = null;
  let bestScore = -1;

  // Look at top strong candidates
  const topCandidates = strongCandidates.slice(0, Math.min(8, strongCandidates.length));

  for (let i = 0; i < topCandidates.length; i++) {
    for (let j = i + 1; j < topCandidates.length; j++) {
      for (let k = j + 1; k < topCandidates.length; k++) {
        const triplet = [topCandidates[i], topCandidates[j], topCandidates[k]];
        const score = scoreTriplet(triplet);

        if (score > bestScore) {
          bestScore = score;
          bestTriplet = triplet;
        }
      }
    }
  }

  if (bestTriplet && bestScore > 0.3) {
    console.log(`Selected strong triplet with score: ${bestScore}`);
    return convertToSpikeLines(bestTriplet, center, width, height);
  }

  // Use top 3 strong candidates if no good triplet found
  console.log('Using top 3 strong candidates');
  return convertToSpikeLines(strongCandidates.slice(0, 3), center, width, height);
}

/**
 * Score a triplet of spikes for Bathinov pattern quality
 * @param {Array} triplet - Three spike candidates
 * @returns {number} Quality score (0-1)
 */
function scoreTriplet(triplet) {
  const angles = triplet.map((s) => s.normalizedAngle).sort((a, b) => a - b);
  const strengths = triplet.map((s) => s.strength);

  // Calculate angle separations
  const sep1 = Math.abs(angles[1] - angles[0]);
  const sep2 = Math.abs(angles[2] - angles[1]);
  const totalSep = Math.abs(angles[2] - angles[0]);

  // For Bathinov mask, expect roughly 30-40 degree separations
  const idealSep = 35;
  const idealTotal = 70;

  let angleScore = 0;
  angleScore += Math.max(0, 1 - Math.abs(sep1 - idealSep) / 20);
  angleScore += Math.max(0, 1 - Math.abs(sep2 - idealSep) / 20);
  angleScore += Math.max(0, 1 - Math.abs(totalSep - idealTotal) / 30);
  angleScore /= 3;

  // Strength score
  const avgStrength = strengths.reduce((sum, s) => sum + s, 0) / 3;
  const maxStrength = Math.max(...strengths);
  const strengthScore = Math.min(1, avgStrength / maxStrength);

  return angleScore * 0.7 + strengthScore * 0.3;
}

/**
 * Convert spike candidates to line format
 * @param {Array} spikes - Spike candidates
 * @param {Object} center - Star center
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Array} Spike lines
 */
function convertToSpikeLines(spikes, center, width, height) {
  const maxDim = Math.max(width, height);
  const halfLength = maxDim * 0.6;

  return spikes.map((spike, index) => {
    const angleRad = (spike.angle * Math.PI) / 180;
    const cos_a = Math.cos(angleRad);
    const sin_a = Math.sin(angleRad);

    return {
      start: {
        x: center.x - halfLength * cos_a,
        y: center.y - halfLength * sin_a,
      },
      end: {
        x: center.x + halfLength * cos_a,
        y: center.y + halfLength * sin_a,
      },
      angle: spike.angle,
      strength: spike.strength || 1000 - index * 100,
    };
  });
}

/**
 * Create a fallback pattern when detection fails
 * @param {Object} center - Star center
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Array} Fallback spike pattern
 */
function createFallbackPattern(center, width, height) {
  const maxDim = Math.max(width, height);
  const halfLength = maxDim * 0.6;

  // Create typical Bathinov pattern: vertical + two diagonals
  const patterns = [
    { angle: 90, strength: 1000 }, // Vertical
    { angle: 135, strength: 900 }, // Diagonal 1
    { angle: 45, strength: 900 }, // Diagonal 2
  ];

  return patterns.map((pattern) => {
    const angleRad = (pattern.angle * Math.PI) / 180;
    const cos_a = Math.cos(angleRad);
    const sin_a = Math.sin(angleRad);

    return {
      start: {
        x: center.x - halfLength * cos_a,
        y: center.y - halfLength * sin_a,
      },
      end: {
        x: center.x + halfLength * cos_a,
        y: center.y + halfLength * sin_a,
      },
      angle: pattern.angle,
      strength: pattern.strength,
    };
  });
}

/**
 * Calculate focus metrics based on the diffraction spikes
 * @param {Array} spikes - Array of detected spikes
 * @returns {Object} Focus metrics
 */
function calculateFocusMetrics(spikes) {
  if (spikes.length < 3) {
    return {
      focusErrorPixels: 999,
      focusErrorMicrons: 999 * 3.8,
      maskAngle: MASK_ANGLE_DEFAULT,
      inFocus: false,
    };
  }

  // Check if these are the fallback spikes (indicates detection failure)
  const isFallbackPattern = spikes.every((spike, index) => {
    const expectedAngles = [90, 135, 45];
    return Math.abs(spike.angle - expectedAngles[index]) < 5;
  });

  if (isFallbackPattern) {
    console.log('Fallback pattern detected - marking as out of focus');
    return {
      focusErrorPixels: 999,
      focusErrorMicrons: 999 * 3.8,
      maskAngle: MASK_ANGLE_DEFAULT,
      inFocus: false,
    };
  }

  // Calculate the intersection point of the two side spikes
  const intersection = calculateLineIntersection(spikes[1], spikes[2]);

  console.log('Intersection point:', intersection);
  console.log('Central spike:', spikes[0]);

  // Calculate the distance from the central spike to the intersection point
  const focusErrorPixels = pointToLineDistance(intersection, spikes[0]);
  console.log('Focus error (pixels):', focusErrorPixels);

  // Calculate the mask angle from the spikes
  const maskAngle = calculateMaskAngle(spikes[1], spikes[2]);

  // Convert pixels to microns (using a typical pixel scale)
  const pixelScale = 3.8; // microns per pixel
  const focusErrorMicrons = Math.abs(focusErrorPixels * pixelScale);

  // More stringent focus determination - in focus only if error is very small
  // Also check if spikes have sufficient strength to be real detections
  const avgSpikeStrength = spikes.reduce((sum, spike) => sum + (spike.strength || 0), 0) / 3;
  const hasGoodDetection = avgSpikeStrength > 50; // Minimum strength threshold
  const inFocus = hasGoodDetection && Math.abs(focusErrorPixels) < 0.5; // Much stricter threshold

  console.log('Average spike strength:', avgSpikeStrength);
  console.log('Has good detection:', hasGoodDetection);
  console.log('Focus error pixels:', focusErrorPixels);
  console.log('In focus:', inFocus);

  return {
    focusErrorPixels: Math.max(0.01, parseFloat(focusErrorPixels.toFixed(2))),
    focusErrorMicrons: Math.max(0.01, parseFloat(focusErrorMicrons.toFixed(2))),
    maskAngle: parseFloat(maskAngle.toFixed(1)),
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
 * Load and process an image from a URL with improved analysis
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
 * Analyze a selected region of an image with improved algorithm
 * @param {string} imageUrl - Image URL
 * @param {Object} region - Selected region {x, y, width, height}
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeImageRegion(imageUrl, region) {
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
        const analysisResults = analyzeBathinovPattern(imageData);

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
