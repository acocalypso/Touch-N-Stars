/**
 * Utility functions for image histogram calculation
 */

// Cache for original image data to avoid re-loading during stretch operations
let cachedOriginalImageData = null;
let cachedImageUrl = null;

/**
 * Store original image data for efficient stretch operations
 * Called when image is first loaded
 * @param {string} imageUrl - The image URL
 * @param {ImageData} imageData - The ImageData object
 */
export function cacheOriginalImageData(imageUrl, imageData) {
  cachedImageUrl = imageUrl;
  // Clone the image data to preserve it
  cachedOriginalImageData = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}

/**
 * Apply levels stretch using cached image data (super fast on repeated calls)
 * @param {number} blackPoint - Input black level (0-255)
 * @param {number} whitePoint - Input white level (0-255)
 * @returns {Promise<Blob>} Stretched image as blob
 */
export async function applyLevelsStretchCached(blackPoint = 0, whitePoint = 255) {
  return new Promise((resolve, reject) => {
    if (!cachedOriginalImageData || blackPoint >= whitePoint) {
      reject(new Error('No cached image data or invalid parameters'));
      return;
    }

    try {
      // Clone cached data so we don't modify it
      const imageData = new ImageData(
        new Uint8ClampedArray(cachedOriginalImageData.data),
        cachedOriginalImageData.width,
        cachedOriginalImageData.height
      );

      const data = imageData.data;
      const range = whitePoint - blackPoint;

      // Apply levels stretch formula to each pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Apply levels stretch: (value - black) / (white - black) * 255
        data[i] = Math.max(0, Math.min(255, Math.round(((r - blackPoint) / range) * 255)));
        data[i + 1] = Math.max(0, Math.min(255, Math.round(((g - blackPoint) / range) * 255)));
        data[i + 2] = Math.max(0, Math.min(255, Math.round(((b - blackPoint) / range) * 255)));
      }

      // Create canvas and put modified data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = imageData.width;
      canvas.height = imageData.height;
      ctx.putImageData(imageData, 0, 0);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        'image/png'
      );
    } catch (error) {
      reject(new Error(`Error processing cached image data: ${error.message}`));
    }
  });
}

/**
 * Calculate brightness histogram from image URL
 * Converts image to grayscale using luma formula and creates histogram buckets
 * @param {string} imageUrl - URL or blob URL of the image
 * @param {number} bucketCount - Number of histogram buckets (default 256)
 * @returns {Promise<Array<number>>} Array of pixel counts for each brightness level
 */
export async function calculateHistogram(imageUrl, bucketCount = 256) {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      reject(new Error('Invalid image URL'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Initialize histogram buckets
        const histogram = new Array(bucketCount).fill(0);

        // Calculate histogram using luma formula for brightness
        // Luma = 0.299*R + 0.587*G + 0.114*B
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip fully transparent pixels
          if (a === 0) {
            continue;
          }

          // Calculate brightness (luma)
          const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

          // Map to bucket (0-255 range)
          const bucketIndex = Math.min(
            Math.floor((brightness / 255) * (bucketCount - 1)),
            bucketCount - 1
          );
          histogram[bucketIndex]++;
        }

        // Normalize histogram to percentage for easier visualization
        const totalPixels = canvas.width * canvas.height;
        const normalizedHistogram = histogram.map((count) => (count / totalPixels) * 100);

        resolve(normalizedHistogram);
      } catch (error) {
        reject(new Error(`Error processing image data: ${error.message}`));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Image loading timeout'));
    }, 10000);
  });
}

/**
 * Get statistics from histogram
 * @param {Array<number>} histogram - Histogram data array
 * @returns {Object} Statistics object with min, max, mean, median
 */
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

  // Calculate median
  const sorted = [...indices].sort((a, b) => a - b);
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  return { min, max, mean, median };
}

/**
 * Apply levels stretch to an image (Schwarzpunkt & Weißpunkt adjustment)
 * @param {string} imageUrl - URL or blob URL of the image
 * @param {number} blackPoint - Input black level (0-255)
 * @param {number} whitePoint - Input white level (0-255)
 * @returns {Promise<Blob>} Stretched image as blob
 */
export async function applyLevelsStretch(imageUrl, blackPoint = 0, whitePoint = 255) {
  return new Promise((resolve, reject) => {
    if (!imageUrl || blackPoint >= whitePoint) {
      reject(new Error('Invalid parameters for levels stretch'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply levels stretch to each pixel
        const range = whitePoint - blackPoint;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Alpha channel (i + 3) unchanged

          // Apply levels stretch formula: (value - black) / (white - black) * 255
          data[i] = Math.max(0, Math.min(255, Math.round(((r - blackPoint) / range) * 255)));
          data[i + 1] = Math.max(0, Math.min(255, Math.round(((g - blackPoint) / range) * 255)));
          data[i + 2] = Math.max(0, Math.min(255, Math.round(((b - blackPoint) / range) * 255)));
        }

        // Put modified image data back on canvas
        ctx.putImageData(imageData, 0, 0);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/png');
      } catch (error) {
        reject(new Error(`Error processing image data: ${error.message}`));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Image loading timeout'));
    }, 10000);
  });
}
