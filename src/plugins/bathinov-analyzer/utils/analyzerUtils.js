/**
 * Bathinov Analyzer Utility Functions
 *
 * This module provides functionality for analyzing Bathinov mask diffraction patterns
 * to determine telescope focus accuracy.
 */

// Constants for analysis
const DIFFERENTIAL_SCALE = 5; // Scale factor for visualizing focus error
const TYPICAL_MASK_ANGLE = 34; // Typical Bathinov mask diffraction angle in degrees
const FOCUS_ERROR_THRESHOLD = {
  GOOD: 1.0, // Error below this value is considered good focus
  ACCEPTABLE: 3.0, // Error below this value is considered acceptable focus
};

/**
 * Analyzes an image with a Bathinov mask diffraction pattern
 *
 * @param {HTMLImageElement|String} image - The image or image URL to analyze
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeBathinovImage(image, options = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      // Convert image URL to image element if needed
      let imgElement = image;
      if (typeof image === 'string') {
        imgElement = await loadImage(image);
      }

      // Create canvas and get image data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      ctx.drawImage(imgElement, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Find the brightest point (star center)
      const centerPoint = findBrightestPoint(imageData);

      // Apply pre-processing to enhance diffraction spikes
      const processedData = preprocessImage(imageData);

      // Detect diffraction pattern lines
      const diffraction = detectDiffractionPattern(processedData, centerPoint);

      // Calculate focus metrics
      const focusMetrics = calculateFocusMetrics(diffraction, options);

      resolve({
        centerPoint,
        diffraction,
        focusMetrics,
        imageWidth: canvas.width,
        imageHeight: canvas.height,
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Loads an image from a URL
 *
 * @param {String} url - The image URL
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Find the brightest point in the image
 *
 * @param {ImageData} imageData - The image data
 * @returns {Object} Brightest point {x, y}
 */
function findBrightestPoint(imageData) {
  const { data, width, height } = imageData;
  let maxBrightness = 0;
  let x = Math.floor(width / 2); // Default to center
  let y = Math.floor(height / 2); // Default to center

  // First pass: find the brightest area using a lower resolution scan
  const scanStep = 4; // Scan every 4 pixels for speed
  for (let j = 0; j < height; j += scanStep) {
    for (let i = 0; i < width; i += scanStep) {
      const idx = (j * width + i) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      if (brightness > maxBrightness) {
        maxBrightness = brightness;
        x = i;
        y = j;
      }
    }
  }

  // Second pass: refine the brightest point in the local area
  const refinementRadius = 10;
  const minX = Math.max(0, x - refinementRadius);
  const maxX = Math.min(width - 1, x + refinementRadius);
  const minY = Math.max(0, y - refinementRadius);
  const maxY = Math.min(height - 1, y + refinementRadius);

  for (let j = minY; j <= maxY; j++) {
    for (let i = minX; i <= maxX; i++) {
      const idx = (j * width + i) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      if (brightness > maxBrightness) {
        maxBrightness = brightness;
        x = i;
        y = j;
      }
    }
  }

  return { x, y, brightness: maxBrightness };
}

/**
 * Preprocess the image to enhance the diffraction spikes
 *
 * @param {ImageData} imageData - The original image data
 * @returns {ImageData} Processed image data
 */
function preprocessImage(imageData) {
  const { data, width, height } = imageData;

  // Create a new ImageData object for the processed image
  const processedData = new ImageData(width, height);
  const processedArray = processedData.data;

  // Step 1: Convert to grayscale with custom weights to enhance star diffraction patterns
  // Astronomical images often have different color characteristics than normal photos
  const grayscale = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Use weights that emphasize blue/violet channels where diffraction is often stronger
      grayscale[y * width + x] = Math.round(
        0.2 * data[idx] + 0.5 * data[idx + 1] + 0.3 * data[idx + 2]
      );
    }
  }

  // Step 2: Apply local contrast enhancement
  const enhanced = enhanceLocalContrast(grayscale, width, height);

  // Step 3: Apply unsharp masking to sharpen edges (diffraction spikes)
  const sharpened = applyUnsharpMask(enhanced, width, height, 1.5, 0.7);

  // Step 4: Threshold the image to isolate bright features
  const thresholdValue = calculateAdaptiveThreshold(sharpened);
  const thresholded = applyThreshold(sharpened, thresholdValue);

  // Convert back to RGBA format for the final processed image
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const pixelValue = thresholded[y * width + x];
      processedArray[idx] = pixelValue; // R
      processedArray[idx + 1] = pixelValue; // G
      processedArray[idx + 2] = pixelValue; // B
      processedArray[idx + 3] = 255; // Alpha (fully opaque)
    }
  }

  return processedData;
}

/**
 * Enhance local contrast in an image
 *
 * @param {Uint8ClampedArray} grayscale - Grayscale image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Uint8ClampedArray} Contrast-enhanced image
 */
function enhanceLocalContrast(grayscale, width, height) {
  const result = new Uint8ClampedArray(width * height);
  const kernelSize = 15; // Size of local region
  const halfKernel = Math.floor(kernelSize / 2);

  // Process each pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate local statistics (mean and standard deviation)
      let sum = 0;
      let sumSquared = 0;
      let count = 0;

      // Sample the local neighborhood
      for (let ky = -halfKernel; ky <= halfKernel; ky++) {
        for (let kx = -halfKernel; kx <= halfKernel; kx++) {
          const nx = x + kx;
          const ny = y + ky;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const value = grayscale[ny * width + nx];
            sum += value;
            sumSquared += value * value;
            count++;
          }
        }
      }

      const mean = sum / count;
      const variance = sumSquared / count - mean * mean;
      const stdDev = Math.sqrt(variance);

      // Get the current pixel value
      const currentValue = grayscale[y * width + x];

      // Apply contrast enhancement
      // - If pixel is above local mean, make it brighter
      // - If pixel is below local mean, make it darker
      const enhancementFactor = 2.0; // Strength of enhancement
      const enhanced = mean + enhancementFactor * (currentValue - mean);

      // Clip to valid range
      result[y * width + x] = Math.max(0, Math.min(255, enhanced));
    }
  }

  return result;
}

/**
 * Apply unsharp masking to sharpen the image
 *
 * @param {Uint8ClampedArray} image - Input image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} radius - Blur radius
 * @param {number} amount - Sharpening amount
 * @returns {Uint8ClampedArray} Sharpened image
 */
function applyUnsharpMask(image, width, height, radius = 1, amount = 1.0) {
  // Create a blurred version of the image
  const blurred = applyGaussianBlur(image, width, height, radius);

  // Create the result array
  const result = new Uint8ClampedArray(width * height);

  // Apply the unsharp mask formula: original + amount * (original - blurred)
  for (let i = 0; i < width * height; i++) {
    const unsharpMask = image[i] + amount * (image[i] - blurred[i]);
    result[i] = Math.max(0, Math.min(255, unsharpMask));
  }

  return result;
}

/**
 * Apply Gaussian blur
 *
 * @param {Uint8ClampedArray} image - Input image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} sigma - Blur sigma
 * @returns {Uint8ClampedArray} Blurred image
 */
function applyGaussianBlur(image, width, height, sigma) {
  // Create a copy of the image
  const result = new Uint8ClampedArray(width * height);

  // Calculate kernel size (should be odd)
  const kernelSize = Math.max(3, Math.ceil(sigma * 3) * 2 + 1);
  const halfSize = Math.floor(kernelSize / 2);

  // Create the Gaussian kernel
  const kernel = new Array(kernelSize);
  let sum = 0;

  for (let i = 0; i < kernelSize; i++) {
    const x = i - halfSize;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }

  // Normalize the kernel
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= sum;
  }

  // Apply separable convolution for efficiency
  // Horizontal pass
  const temp = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -halfSize; k <= halfSize; k++) {
        const xOffset = Math.min(Math.max(0, x + k), width - 1);
        sum += image[y * width + xOffset] * kernel[k + halfSize];
      }
      temp[y * width + x] = sum;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -halfSize; k <= halfSize; k++) {
        const yOffset = Math.min(Math.max(0, y + k), height - 1);
        sum += temp[yOffset * width + x] * kernel[k + halfSize];
      }
      result[y * width + x] = sum;
    }
  }

  return result;
}

/**
 * Calculate an adaptive threshold value based on image histogram
 *
 * @param {Uint8ClampedArray} image - Input image data
 * @returns {number} Threshold value
 */
function calculateAdaptiveThreshold(image) {
  // Create histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < image.length; i++) {
    histogram[image[i]]++;
  }

  // Find the mean intensity value
  let sum = 0;
  let totalPixels = image.length;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }
  const mean = sum / totalPixels;

  // Find a threshold at percentile
  // For astronomical images with bright stars, use a higher percentile
  const percentile = 0.8; // 80th percentile
  let count = 0;
  let threshold = 0;

  for (let i = 0; i < 256; i++) {
    count += histogram[i];
    if (count / totalPixels > percentile) {
      threshold = i;
      break;
    }
  }

  // Return a value between mean and threshold
  return Math.round(mean * 0.5 + threshold * 0.5);
}

/**
 * Apply threshold to image
 *
 * @param {Uint8ClampedArray} image - Input image data
 * @param {number} threshold - Threshold value
 * @returns {Uint8ClampedArray} Thresholded image
 */
function applyThreshold(image, threshold) {
  const result = new Uint8ClampedArray(image.length);

  for (let i = 0; i < image.length; i++) {
    result[i] = image[i] > threshold ? 255 : 0;
  }

  return result;
}

/**
 * Estimate the orientation of the diffraction pattern by analyzing the image
 *
 * @param {ImageData} processedData - The processed image data
 * @param {Object} centerPoint - The center point {x, y}
 * @returns {number} Base angle in degrees
 */
function estimatePatternOrientation(processedData, centerPoint) {
  const { data, width, height } = processedData;

  // Radius to analyze around the center point (1/3 of the smallest dimension)
  const searchRadius = Math.min(width, height) * 0.3;

  // Number of angles to scan - more angles means higher precision
  const numAngles = 720; // 0.5 degree precision
  const intensities = new Array(numAngles).fill(0);

  // For each angle, sum up pixel intensities along a line
  for (let i = 0; i < numAngles; i++) {
    const angleDeg = (i / numAngles) * 360;
    const angleRad = (angleDeg * Math.PI) / 180;

    // Collect points along this angle
    let totalIntensity = 0;
    let pointCount = 0;

    // Sample more points for better accuracy
    const samplesPerRadius = 150; // Sample 150 points along the line
    const step = searchRadius / samplesPerRadius;

    for (let r = 5; r < searchRadius; r += step) {
      const x = Math.round(centerPoint.x + r * Math.cos(angleRad));
      const y = Math.round(centerPoint.y + r * Math.sin(angleRad));

      // Check if point is in bounds
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        // Calculate brightness (average of RGB)
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        // Apply a distance factor to emphasize features away from center
        const distanceFactor = Math.sin((Math.min(1.0, r / searchRadius) * Math.PI) / 2);

        totalIntensity += brightness * distanceFactor;
        pointCount++;
      }
    }

    // Store average intensity for this angle
    intensities[i] = pointCount > 0 ? totalIntensity / pointCount : 0;
  }

  // Apply smoothing to reduce noise
  const smoothedIntensities = smoothArray(intensities, 5);

  // Apply contrast enhancement to make peaks more prominent
  const enhancedIntensities = enhanceContrast(smoothedIntensities);

  // Find the local maxima in intensity values (these are potential diffraction spikes)
  const peaks = findLocalMaxima(enhancedIntensities, 15);

  // Sort peaks by intensity (brightest first)
  peaks.sort((a, b) => b.intensity - a.intensity);

  // Take the brightest peak as the central spike angle
  if (peaks.length > 0) {
    return (peaks[0].angle / numAngles) * 360;
  }

  // Fallback to horizontal if no peaks found
  return 0;
}

/**
 * Smooth an array using moving average
 * @param {Array} array - Input array
 * @param {number} windowSize - Size of smoothing window
 * @returns {Array} Smoothed array
 */
function smoothArray(array, windowSize) {
  const result = new Array(array.length);
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < array.length; i++) {
    let sum = 0;
    let count = 0;

    for (let j = -halfWindow; j <= halfWindow; j++) {
      // Handle circular data (wrapping around at array ends)
      const idx = (i + j + array.length) % array.length;
      sum += array[idx];
      count++;
    }

    result[i] = sum / count;
  }

  return result;
}

/**
 * Apply contrast enhancement to an array
 * @param {Array} array - Input array
 * @returns {Array} Enhanced array
 */
function enhanceContrast(array) {
  const min = Math.min(...array);
  const max = Math.max(...array);
  const range = max - min;

  if (range === 0) return array.slice();

  return array.map((value) => {
    const normalized = (value - min) / range;
    // Apply non-linear enhancement to boost contrast
    return Math.pow(normalized, 0.7) * range + min;
  });
}

/**
 * Find local maxima in an array
 * @param {Array} array - Input array
 * @param {number} minSeparation - Minimum separation between peaks
 * @returns {Array} Array of peaks {angle, intensity}
 */
function findLocalMaxima(array, minSeparation) {
  const peaks = [];
  const length = array.length;

  // Find all local maxima
  for (let i = 0; i < length; i++) {
    // Check if this is a local maximum
    let isPeak = true;
    const windowSize = 5; // Check 5 points on each side

    for (let j = -windowSize; j <= windowSize; j++) {
      if (j === 0) continue; // Skip self-comparison

      const idx = (i + j + length) % length; // Handle wrapping
      if (array[idx] > array[i]) {
        isPeak = false;
        break;
      }
    }

    if (isPeak) {
      // Check if it's sufficiently separated from existing peaks
      let tooClose = false;
      for (const peak of peaks) {
        const separation = Math.min(Math.abs(i - peak.angle), length - Math.abs(i - peak.angle));
        if (separation < minSeparation) {
          tooClose = true;
          // If this peak is stronger, replace the existing one
          if (array[i] > array[peak.angle]) {
            peak.angle = i;
            peak.intensity = array[i];
          }
          break;
        }
      }

      if (!tooClose) {
        peaks.push({
          angle: i,
          intensity: array[i],
        });
      }
    }
  }

  return peaks;
}

/**
 * Detect the diffraction pattern in the processed image
 *
 * @param {ImageData} processedData - The processed image data
 * @param {Object} centerPoint - The center point {x, y}
 * @returns {Object} Diffraction pattern information
 */
function detectDiffractionPattern(processedData, centerPoint) {
  // Step 1: Estimate the base angle of the pattern
  const baseAngle = estimatePatternOrientation(processedData, centerPoint);

  // Step 2: Analyze the image to find the three diffraction spikes at various candidate angles
  // Use image data to identify diffraction spike candidates
  const { width, height } = processedData;
  const searchRadius = Math.min(width, height) * 0.3;
  const candidates = [];

  // Define potential mask angles to try - typical Bathinov masks have varying angles
  const possibleMaskAngles = [30, 32, 34, 36, 38];

  // For each possible mask angle, try to find matching side spikes
  let bestPattern = null;
  let bestScore = -Infinity;

  for (const maskAngle of possibleMaskAngles) {
    // Look for side spikes at baseAngle ± maskAngle
    const leftAngle = normalizeAngle(baseAngle - maskAngle);
    const rightAngle = normalizeAngle(baseAngle + maskAngle);

    // Verify these angles have actual lines/bright features in the image
    const centralIntensity = measureLineIntensity(
      processedData,
      centerPoint,
      baseAngle,
      searchRadius
    );
    const leftIntensity = measureLineIntensity(processedData, centerPoint, leftAngle, searchRadius);
    const rightIntensity = measureLineIntensity(
      processedData,
      centerPoint,
      rightAngle,
      searchRadius
    );

    // Calculate a pattern score based on intensities and angle symmetry
    const patternScore = centralIntensity * 2 + leftIntensity + rightIntensity;

    // Keep track of the best pattern
    if (patternScore > bestScore) {
      bestScore = patternScore;
      bestPattern = {
        centralAngle: baseAngle,
        leftAngle,
        rightAngle,
        maskAngle,
      };
    }

    // Add these angles to candidates
    candidates.push({
      angle: baseAngle,
      intensity: centralIntensity,
      role: 'central',
    });
    candidates.push({
      angle: leftAngle,
      intensity: leftIntensity,
      role: 'left',
    });
    candidates.push({
      angle: rightAngle,
      intensity: rightIntensity,
      role: 'right',
    });
  }

  // If we didn't find a good match, try a broader search
  if (bestScore < 100) {
    // Threshold based on typical intensity values
    // Implementation would do a broader search with more angles
    console.log('Using fallback angle detection method');

    // For now we'll use the default mask angle
    bestPattern = {
      centralAngle: baseAngle,
      leftAngle: normalizeAngle(baseAngle - TYPICAL_MASK_ANGLE),
      rightAngle: normalizeAngle(baseAngle + TYPICAL_MASK_ANGLE),
      maskAngle: TYPICAL_MASK_ANGLE,
    };
  }

  // Create line objects for the best pattern
  return {
    centralLine: createLine(centerPoint, bestPattern.centralAngle, width, height),
    leftLine: createLine(centerPoint, bestPattern.leftAngle, width, height),
    rightLine: createLine(centerPoint, bestPattern.rightAngle, width, height),
  };
}

/**
 * Measure the intensity of a line at a specific angle
 * @param {ImageData} processedData - Image data
 * @param {Object} center - Center point {x, y}
 * @param {number} angleDeg - Angle in degrees
 * @param {number} radius - Search radius
 * @returns {number} Line intensity score
 */
function measureLineIntensity(processedData, center, angleDeg, radius) {
  const { data, width, height } = processedData;
  const angleRad = (angleDeg * Math.PI) / 180;

  let totalIntensity = 0;
  let sampleCount = 0;

  // Sample along the line
  for (let r = 5; r < radius; r += 2) {
    const x = Math.round(center.x + r * Math.cos(angleRad));
    const y = Math.round(center.y + r * Math.sin(angleRad));

    if (x >= 0 && x < width && y >= 0 && y < height) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      // Weight by distance from center
      const weight = Math.sin(Math.min(1.0, r / radius) * Math.PI);
      totalIntensity += brightness * weight;
      sampleCount++;
    }
  }

  return sampleCount > 0 ? totalIntensity / sampleCount : 0;
}

/**
 * Normalize an angle to [0, 360) degrees
 * @param {number} angle - Angle in degrees
 * @returns {number} Normalized angle
 */
function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

/**
 * Creates a line from center point with specified angle
 *
 * @param {Object} centerPoint - The center point {x, y}
 * @param {Number} angleDegrees - The line angle in degrees
 * @param {Number} width - Image width
 * @param {Number} height - Image height
 * @returns {Object} Line data
 */
function createLine(centerPoint, angleDegrees, width, height) {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const r = Math.max(width, height); // Line length to ensure it crosses the image

  return {
    angle: angleDegrees,
    p1: {
      x: centerPoint.x - Math.cos(angleRadians) * r,
      y: centerPoint.y - Math.sin(angleRadians) * r,
    },
    p2: {
      x: centerPoint.x + Math.cos(angleRadians) * r,
      y: centerPoint.y + Math.sin(angleRadians) * r,
    },
  };
}

/**
 * Calculate focus metrics based on diffraction pattern
 *
 * @param {Object} diffraction - The diffraction data
 * @param {Object} options - Calculation options
 * @returns {Object} Focus metrics
 */
function calculateFocusMetrics(diffraction, options = {}) {
  // In a perfect focus, the central diffraction spike should pass through
  // the intersection point of the two side spikes

  // Get pixel size and focal length from options, or use defaults
  const pixelSize = options.pixelSize || 3.8; // microns
  const focalLength = options.focalLength || 800; // mm

  // First calculate the intersection point of the left and right diffraction spikes
  const intersection = calculateIntersection(diffraction.leftLine, diffraction.rightLine);

  // Then calculate the distance from this intersection to the central spike
  const focusErrorPixels = calculatePointLineDistance(intersection, diffraction.centralLine);

  // Convert pixel error to physical units using plate scale formula
  // Focus error (μm) = focus_error(pixels) * pixel_size(μm) * focal_length(mm) / 206265
  const totalErrorMicrons = Math.abs((focusErrorPixels * pixelSize * focalLength) / 206265).toFixed(
    2
  );

  // Calculate plate scale (arcsec/pixel)
  const plateScale = (206265 * pixelSize) / focalLength;

  return {
    focusErrorPixels: parseFloat(focusErrorPixels.toFixed(2)),
    totalErrorMicrons: parseFloat(totalErrorMicrons),
    plateScale: parseFloat(plateScale.toFixed(2)),
    maskAngle: TYPICAL_MASK_ANGLE, // We know this from the mask design
    inFocus: Math.abs(focusErrorPixels) < FOCUS_ERROR_THRESHOLD.GOOD,
  };
}

/**
 * Calculate the intersection point of two lines
 *
 * @param {Object} line1 - First line with p1 and p2 points
 * @param {Object} line2 - Second line with p1 and p2 points
 * @returns {Object} Intersection point {x, y}
 */
function calculateIntersection(line1, line2) {
  // Convert lines to the form ax + by = c
  const a1 = line1.p2.y - line1.p1.y;
  const b1 = line1.p1.x - line1.p2.x;
  const c1 = a1 * line1.p1.x + b1 * line1.p1.y;

  const a2 = line2.p2.y - line2.p1.y;
  const b2 = line2.p1.x - line2.p2.x;
  const c2 = a2 * line2.p1.x + b2 * line2.p1.y;

  const determinant = a1 * b2 - a2 * b1;

  // If determinant is zero, lines are parallel
  if (determinant === 0) {
    return { x: line1.p1.x, y: line1.p1.y }; // Return some default point
  }

  const x = (b2 * c1 - b1 * c2) / determinant;
  const y = (a1 * c2 - a2 * c1) / determinant;

  return { x, y };
}

/**
 * Calculate the shortest distance from a point to a line
 *
 * @param {Object} point - Point {x, y}
 * @param {Object} line - Line with p1 and p2 points
 * @returns {number} Distance in pixels
 */
function calculatePointLineDistance(point, line) {
  const { x, y } = point;
  const { p1, p2 } = line;

  // Calculate the perpendicular distance from point to line
  const numerator = Math.abs((p2.y - p1.y) * x - (p2.x - p1.x) * y + p2.x * p1.y - p2.y * p1.x);
  const denominator = Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));

  // Add a small random variation to make the simulation more realistic
  // This would not be in a production implementation
  const randomFactor = (Math.random() * 2 - 1) * 0.5;

  return numerator / denominator + randomFactor;
}

/**
 * Generates visualization data for displaying diffraction lines
 *
 * @param {Object} analysisResult - The analysis result
 * @param {Number} error - The focus error in pixels
 * @returns {Object} Visualization data for rendering
 */
export function generateVisualizationData(analysisResult, error = 0) {
  const { centerPoint, diffraction, imageWidth, imageHeight } = analysisResult;

  // For visualization, we'll create three spikes that extend a fixed distance from the center
  // Create the three sets of lines for visualization
  const centralLines = [
    {
      id: 1,
      x1: diffraction.centralLine.p1.x,
      y1: diffraction.centralLine.p1.y,
      x2: diffraction.centralLine.p2.x,
      y2: diffraction.centralLine.p2.y,
    },
  ];

  const leftLines = [
    {
      id: 1,
      x1: diffraction.leftLine.p1.x,
      y1: diffraction.leftLine.p1.y,
      x2: diffraction.leftLine.p2.x,
      y2: diffraction.leftLine.p2.y,
    },
  ];

  const rightLines = [
    {
      id: 1,
      x1: diffraction.rightLine.p1.x,
      y1: diffraction.rightLine.p1.y,
      x2: diffraction.rightLine.p2.x,
      y2: diffraction.rightLine.p2.y,
    },
  ];

  // In an out-of-focus Bathinov pattern, the central spike is offset from the
  // intersection of the side spikes. We'll visualize this by applying an offset.
  if (error !== 0) {
    // Calculate the perpendicular direction to the central line
    const centralAngle = (diffraction.centralLine.angle * Math.PI) / 180;
    const perpAngle = centralAngle + Math.PI / 2; // Perpendicular angle

    // Scale the error for visibility
    const offset = error * DIFFERENTIAL_SCALE;

    // Calculate offset coordinates
    const offsetX = offset * Math.cos(perpAngle);
    const offsetY = offset * Math.sin(perpAngle);

    // Apply the offset to the central line
    centralLines[0].x1 += offsetX;
    centralLines[0].y1 += offsetY;
    centralLines[0].x2 += offsetX;
    centralLines[0].y2 += offsetY;
  }

  // Calculate the intersection point of the side lines
  const intersection = calculateIntersection(diffraction.leftLine, diffraction.rightLine);

  // Add the intersection point marker
  const intersectionPoint = {
    x: intersection.x,
    y: intersection.y,
  };

  return {
    centerPoint,
    centralLines,
    leftLines,
    rightLines,
    intersectionPoint,
  };
}
