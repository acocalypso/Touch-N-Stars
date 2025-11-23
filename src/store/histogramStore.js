import { defineStore } from 'pinia';
import {
  calculateHistogram,
  applyLevelsStretch,
  applyLevelsStretchCached,
  cacheOriginalImageData,
} from '@/utils/histogramUtils';

/**
 * Store für Histogram und Stretch-Funktionen
 * Verwaltet Histogram-Daten und Stretch-Einstellungen für beliebig viele Bilder
 */
export const useHistogramStore = defineStore('histogramStore', {
  state: () => ({
    // Map: imageUrl → { histogram, blackPoint, whitePoint, midPoint, stretchedImageData }
    imageSettings: new Map(),

    // Processing flags
    processingImages: new Set(), // Set of imageUrls currently being processed

    // Throttle timers
    stretchTimeouts: new Map(), // imageUrl → timeoutId
    pendingStretchValues: new Map(), // imageUrl → { blackPoint, whitePoint, midPoint }
  }),

  actions: {
    /**
     * Calculate and cache histogram for an image
     * @param {string} imageUrl - Image URL or blob URL
     * @returns {Promise<Array<number>>} Histogram data
     */
    async calculateHistogramForImage(imageUrl) {
      if (!imageUrl) {
        return null;
      }

      try {
        const histogram = await calculateHistogram(imageUrl);

        // Store in settings
        if (!this.imageSettings.has(imageUrl)) {
          this.imageSettings.set(imageUrl, {
            histogram: null,
            blackPoint: 0,
            whitePoint: 255,
            midPoint: 127,
            stretchedImageData: null,
          });
        }

        const settings = this.imageSettings.get(imageUrl);
        settings.histogram = histogram;

        // Also cache the original image data for fast stretch operations
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              cacheOriginalImageData(imageUrl, imageData);
            }
          };
          img.src = imageUrl;
        } catch (cacheErr) {
          // Silently ignore cache errors
        }

        return histogram;
      } catch (error) {
        console.error('[HistogramStore] Error calculating histogram:', error);
        return null;
      }
    },

    /**
     * Apply levels stretch to an image with throttling
     * @param {string} imageUrl - Image URL or blob URL
     * @param {number} blackPoint - Input black level (0-255)
     * @param {number} whitePoint - Input white level (0-255)
     * @param {number} midPoint - Midtone balance (0-255)
     * @returns {Promise<void>}
     */
    async applyStretch(imageUrl, blackPoint, whitePoint, midPoint = 127) {
      if (!imageUrl) {
        console.warn('[HistogramStore] No image URL provided');
        return;
      }

      // Initialize settings if not exists
      if (!this.imageSettings.has(imageUrl)) {
        this.imageSettings.set(imageUrl, {
          histogram: null,
          blackPoint: 0,
          whitePoint: 255,
          midPoint: 127,
          stretchedImageData: null,
        });
      }

      // Clamp incoming values to keep a valid range
      const clampedBlack = Math.max(0, Math.min(254, blackPoint));
      const clampedWhite = Math.max(clampedBlack + 1, Math.min(255, whitePoint));
      const clampedMid = Math.min(Math.max(midPoint ?? 127, clampedBlack + 1), clampedWhite - 1);

      const settings = this.imageSettings.get(imageUrl);

      // Update the displayed values immediately for UI responsiveness
      settings.blackPoint = clampedBlack;
      settings.whitePoint = clampedWhite;
      settings.midPoint = clampedMid;

      // Store pending values for later processing
      this.pendingStretchValues.set(imageUrl, {
        blackPoint: clampedBlack,
        whitePoint: clampedWhite,
        midPoint: clampedMid,
      });

      // If already processing, don't start another one - it will pick up pending values
      if (this.processingImages.has(imageUrl)) {
        return;
      }

      // If we have a pending timeout, clear it and schedule a new one
      if (this.stretchTimeouts.has(imageUrl)) {
        clearTimeout(this.stretchTimeouts.get(imageUrl));
      }

      // Throttle: only process after 300ms of no changes
      const timeoutId = setTimeout(async () => {
        this.stretchTimeouts.delete(imageUrl);

        // Get the latest pending values
        const pending = this.pendingStretchValues.get(imageUrl);
        if (!pending) return;

        const latestBlackPoint = pending.blackPoint;
        const latestWhitePoint = pending.whitePoint;
        const latestMidPoint = Math.min(
          Math.max(pending.midPoint ?? 127, pending.blackPoint + 1),
          pending.whitePoint - 1
        );

        try {
          this.processingImages.add(imageUrl);

          // Try to use cached version for speed, fallback to regular version
          let stretchedBlob;
          try {
            stretchedBlob = await applyLevelsStretchCached(
              latestBlackPoint,
              latestWhitePoint,
              latestMidPoint
            );
          } catch (cacheError) {
            // If cache not available, use regular method
            stretchedBlob = await applyLevelsStretch(
              imageUrl,
              latestBlackPoint,
              latestWhitePoint,
              latestMidPoint
            );
          }

          const settings = this.imageSettings.get(imageUrl);
          if (settings) {
            if (settings.stretchedImageData) {
              URL.revokeObjectURL(settings.stretchedImageData);
            }
            settings.stretchedImageData = URL.createObjectURL(stretchedBlob);
          }
        } catch (error) {
          console.error('[HistogramStore] Error applying stretch:', error);
          const settings = this.imageSettings.get(imageUrl);
          if (settings) {
            settings.stretchedImageData = null;
          }
        } finally {
          this.processingImages.delete(imageUrl);
        }
      }, 300);

      this.stretchTimeouts.set(imageUrl, timeoutId);
    },

    /**
     * Get histogram for a specific image
     * @param {string} imageUrl - Image URL
     * @returns {Array<number>|null}
     */
    getHistogram(imageUrl) {
      const settings = this.imageSettings.get(imageUrl);
      return settings?.histogram || null;
    },

    /**
     * Get stretch settings for a specific image
     * @param {string} imageUrl - Image URL
     * @returns {Object} { blackPoint, whitePoint, midPoint, stretchedImageData }
     */
    getStretchSettings(imageUrl) {
      if (!this.imageSettings.has(imageUrl)) {
        return {
          blackPoint: 0,
          whitePoint: 255,
          midPoint: 127,
          stretchedImageData: null,
        };
      }

      const settings = this.imageSettings.get(imageUrl);
      return {
        blackPoint: settings.blackPoint,
        whitePoint: settings.whitePoint,
        midPoint: settings.midPoint,
        stretchedImageData: settings.stretchedImageData,
      };
    },

    /**
     * Reset stretch settings for a specific image
     * @param {string} imageUrl - Image URL
     */
    resetStretch(imageUrl) {
      const settings = this.imageSettings.get(imageUrl);
      if (settings) {
        if (settings.stretchedImageData) {
          URL.revokeObjectURL(settings.stretchedImageData);
        }
        settings.blackPoint = 0;
        settings.whitePoint = 255;
        settings.midPoint = 127;
        settings.stretchedImageData = null;
      }
    },

    /**
     * Clear all cache and settings for a specific image
     * @param {string} imageUrl - Image URL
     */
    clearImageCache(imageUrl) {
      // Clear pending stretch if exists
      if (this.stretchTimeouts.has(imageUrl)) {
        clearTimeout(this.stretchTimeouts.get(imageUrl));
        this.stretchTimeouts.delete(imageUrl);
      }

      this.pendingStretchValues.delete(imageUrl);

      // Clear settings
      const settings = this.imageSettings.get(imageUrl);
      if (settings) {
        if (settings.stretchedImageData) {
          URL.revokeObjectURL(settings.stretchedImageData);
        }
      }

      this.imageSettings.delete(imageUrl);
      this.processingImages.delete(imageUrl);
    },

    /**
     * Clear all caches
     */
    clearAllCache() {
      // Clear all timeouts
      this.stretchTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });

      // Revoke all blob URLs
      this.imageSettings.forEach((settings) => {
        if (settings.stretchedImageData) {
          URL.revokeObjectURL(settings.stretchedImageData);
        }
      });

      // Clear all maps
      this.imageSettings.clear();
      this.processingImages.clear();
      this.stretchTimeouts.clear();
      this.pendingStretchValues.clear();

      console.log('[HistogramStore] Cleared all cache');
    },

    /**
     * Check if currently processing an image
     * @param {string} imageUrl - Image URL
     * @returns {boolean}
     */
    isProcessing(imageUrl) {
      return this.processingImages.has(imageUrl);
    },
  },
});
