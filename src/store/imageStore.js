import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useSettingsStore } from './settingsStore';
import { calculateHistogram, applyLevelsStretch } from '@/utils/histogramUtils';

export const useImagetStore = defineStore('imageStore', {
  state: () => ({
    imageData: null,
    imageHistogram: null,
    isImageFetching: false,
    isSequenceImageFetching: false,
    isStretchProcessing: false,
    stretchedImageData: null,
    blackPoint: 0,
    whitePoint: 255,
    lastImage: {
      index: 0,
      quality: 0,
      resize: false,
      scale: 0,
      image: null,
      histogram: null,
    },
    _lastApplyStretchTime: 0,
    _pendingStretchValues: null,
    _stretchTimeoutId: null,
  }),
  actions: {
    calcScale() {
      const settingsStore = useSettingsStore();
      const store = apiStore();
      const cameraWidth = store.profileInfo?.FramingAssistantSettings?.CameraWidth;
      const cameraHeight = store.profileInfo?.FramingAssistantSettings?.CameraHeight;
      const maxDimension = Math.max(cameraWidth, cameraHeight);
      const maxDimensionSetting = settingsStore.camera.maxDimension;
      const scale = maxDimension > maxDimensionSetting ? maxDimensionSetting / maxDimension : 100;
      console.log(
        `[ImageStore] Calculated scale: ${scale}% for camera size ${cameraWidth}x${cameraHeight}`
      );
      return scale;
    },

    async calculateImageHistogram(imageUrl) {
      if (!imageUrl) {
        this.imageHistogram = null;
        return;
      }

      try {
        console.log('[ImageStore] Calculating histogram for image...');
        const histogram = await calculateHistogram(imageUrl);
        this.imageHistogram = histogram;
        console.log('[ImageStore] Histogram calculated successfully');
      } catch (error) {
        console.error('[ImageStore] Error calculating histogram:', error);
        this.imageHistogram = null;
      }
    },

    async getImage() {
      const settingsStore = useSettingsStore();
      const quality = settingsStore.camera.imageQuality;
      const scale = this.calcScale();
      const resize = scale < 1;
      this.isImageFetching = true;
      const fetchStartTime = Date.now();

      try {
        // Wait if another fetch is in progress
        if (this.isSequenceImageFetching) {
          console.log('[ImageStore] Waiting for getImageByIndex() to complete...');
          await new Promise((resolve) => {
            const interval = setInterval(() => {
              if (!this.isSequenceImageFetching) {
                clearInterval(interval);
                resolve();
              }
            }, 100);
            setTimeout(() => clearInterval(interval), 5000);
          });
        }

        console.log(
          `[ImageStore] ImageStore.getImage: Fetching image with quality: ${quality}, resize: ${resize}, scale: ${scale}`
        );
        const imageResponse = await apiService.getImagePrepared(quality, resize, scale);

        if (imageResponse && imageResponse.data) {
          if (this.imageData) {
            URL.revokeObjectURL(this.imageData);
          }
          // Reset stretched image when loading a new image
          this.resetStretch();
          this.imageData = URL.createObjectURL(imageResponse.data);
          // Calculate histogram for the new image
          await this.calculateImageHistogram(this.imageData);
        }
      } catch (error) {
        console.error('[ImageStore] Error fetching information:', error);
      } finally {
        // Ensure isImageFetching is true for at least 1 second
        const elapsedTime = Date.now() - fetchStartTime;
        const minDuration = 1000; // 1 second in milliseconds
        if (elapsedTime < minDuration) {
          await new Promise((resolve) => setTimeout(resolve, minDuration - elapsedTime));
        }
        this.isImageFetching = false;
      }
    },

    async getImageByIndex(index) {
      console.log(`[ImageStore] ImageStore.getImageByIndex: Getting image by index: ${index}`);
      const settingsStore = useSettingsStore();
      const quality = settingsStore.camera.imageQuality;
      const scale = this.calcScale();

      // check cache
      if (this.lastImage.image && index === this.lastImage.index) {
        console.log('[ImageStore] lastImage from cache');
        const isValid = await this.validateImage(this.lastImage.image);
        if (!isValid) {
          console.warn('[ImageStore] Cached image is corrupted, fetching new image');
          if (this.lastImage.image) {
            URL.revokeObjectURL(this.lastImage.image);
          }
          this.lastImage.image = null;
          return this.getImageByIndex(index);
        }
        return this.lastImage.image;
      }

      this.isSequenceImageFetching = true;
      try {
        // Wait if another fetch is in progress
        if (this.isImageFetching) {
          console.log('[ImageStore] Waiting for getImage() to complete...');
          await new Promise((resolve) => {
            const interval = setInterval(() => {
              if (!this.isImageFetching) {
                clearInterval(interval);
                resolve();
              }
            }, 100);
            setTimeout(() => clearInterval(interval), 5000);
          });
        }

        // Load image from API
        console.log('[ImageStore] Loding sequneceimage from API...');
        const result = await apiService.getSequenceImage(index, quality, true, scale);
        if (result.status !== 200) {
          console.error('[ImageStore] Unknown error: Check NINA Logs for more information');
          return;
        }
        const blob = result.data;
        const imageUrl = URL.createObjectURL(blob);

        // Valid new image
        const isValid = await this.validateImage(imageUrl);
        if (!isValid) {
          console.error('[ImageStore] Fetched sequneceimage is corrupted');
          // Gebe neue URL frei wenn ungültig
          URL.revokeObjectURL(imageUrl);
          return this.getImageByIndex(index);
        }

        // Gebe alte cached URL frei bevor neue gespeichert wird
        if (this.lastImage.image && this.lastImage.image !== imageUrl) {
          URL.revokeObjectURL(this.lastImage.image);
        }

        // Save to cache
        this.lastImage.scale = scale;
        this.lastImage.quality = quality;
        this.lastImage.index = index;
        this.lastImage.image = imageUrl;

        // Reset stretched image when loading a new image
        this.resetStretch();

        // Calculate histogram for the sequence image
        await this.calculateImageHistogram(imageUrl);
        this.lastImage.histogram = this.imageHistogram;

        return imageUrl;
      } catch (error) {
        console.error(
          `[ImageStore] An error happened while getting image with index ${index}`,
          error.message
        );
        return;
      } finally {
        this.isSequenceImageFetching = false;
      }
    },

    async getThumbnailByIndex(index) {
      try {
        const blob = await apiService.getSequenceThumbnail(index);
        const imageUrl = URL.createObjectURL(blob);
        return imageUrl;
      } catch (error) {
        console.error(
          `[ImageStore] An error happened while getting image with index ${index}`,
          error.message
        );
        return null;
      }
    },

    async validateImage(imageUrl) {
      return new Promise((resolve) => {
        if (!imageUrl) {
          resolve(false);
          return;
        }

        const img = new Image();
        img.onload = () => {
          console.log('[ImageStore] Image is valid');
          resolve(true);
        };
        img.onerror = () => {
          console.error('[ImageStore] Image is corrupted or invalid');
          resolve(false);
        };
        img.src = imageUrl;

        // Timeout nach 5 Sekunden für den Fall, dass das Bild nicht lädt
        setTimeout(() => {
          if (!img.complete) {
            console.error('[ImageStore] Image loading timeout');
            resolve(false);
          }
        }, 5000);
      });
    },

    clearImageCache() {
      this.imageData = null;
      this.isImageFetching = false;
      this.isSequenceImageFetching = false;
      this.lastImage.index = 0;
      this.lastImage.image = null;
      console.log('[ImageStore] Clearing image cache');
    },

    async applyStretch(blackPoint, whitePoint) {
      if (!this.imageData) {
        console.warn('[ImageStore] No image data to apply stretch');
        return;
      }

      // Always update the displayed values immediately for UI responsiveness
      this.blackPoint = blackPoint;
      this.whitePoint = whitePoint;

      // Store pending values for later processing
      this._pendingStretchValues = { blackPoint, whitePoint };

      // If already processing, don't start another one - it will pick up pending values
      if (this.isStretchProcessing) {
        return;
      }

      // If we have a pending timeout, clear it and schedule a new one
      if (this._stretchTimeoutId !== null) {
        clearTimeout(this._stretchTimeoutId);
      }

      // Throttle: only process after 300ms of no changes
      this._stretchTimeoutId = setTimeout(async () => {
        this._stretchTimeoutId = null;

        // Get the latest pending values
        const latestBlackPoint = this._pendingStretchValues.blackPoint;
        const latestWhitePoint = this._pendingStretchValues.whitePoint;

        try {
          // Show loading spinner while processing
          this.isStretchProcessing = true;

          console.log(
            `[ImageStore] Applying stretch: blackPoint=${latestBlackPoint}, whitePoint=${latestWhitePoint}`
          );

          const stretchedBlob = await applyLevelsStretch(
            this.imageData,
            latestBlackPoint,
            latestWhitePoint
          );
          if (this.stretchedImageData) {
            URL.revokeObjectURL(this.stretchedImageData);
          }
          this.stretchedImageData = URL.createObjectURL(stretchedBlob);
          this._lastApplyStretchTime = Date.now();

          console.log('[ImageStore] Stretch applied successfully');
        } catch (error) {
          console.error('[ImageStore] Error applying stretch:', error);
          this.stretchedImageData = null;
        } finally {
          // Hide loading spinner after processing is complete
          this.isStretchProcessing = false;
        }
      }, 300); // Wait 300ms before processing
    },

    resetStretch() {
      if (this.stretchedImageData) {
        URL.revokeObjectURL(this.stretchedImageData);
        this.stretchedImageData = null;
      }
      this.blackPoint = 0;
      this.whitePoint = 255;

      // Reset histogram to original image
      if (this.imageData) {
        this.calculateImageHistogram(this.imageData);
      }
      console.log('[ImageStore] Stretch reset');
    },
  },
});
