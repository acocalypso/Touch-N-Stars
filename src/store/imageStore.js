import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useSettingsStore } from './settingsStore';

export const useImagetStore = defineStore('imageStore', {
  state: () => ({
    imageData: null,
    isImageFetching: false,
    isSequenceImageFetching: false,
    lastImage: {
      index: 0,
      quality: 0,
      resize: false,
      scale: 0,
      image: null,
    },
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
      console.log(`[ImageStore] Calculated scale: ${scale}% for camera size ${cameraWidth}x${cameraHeight}`);
      return scale;
    },

    async getImage() {
      const settingsStore = useSettingsStore();
      const quality = settingsStore.camera.imageQuality;
      const scale = this.calcScale();
      const resize = scale < 1;
      this.isImageFetching = true;

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

        console.log(`[ImageStore] ImageStore.getImage: Fetching image with quality: ${quality}, resize: ${resize}, scale: ${scale}`);
        const imageResponse = await apiService.getImagePrepared(quality, resize, scale);

        if (imageResponse && imageResponse.data) {
          if (this.imageData) {
            URL.revokeObjectURL(this.imageData);
          }
          this.imageData = URL.createObjectURL(imageResponse.data);
        }
      } catch (error) {
        console.error('[ImageStore] Error fetching information:', error);
      } finally {
        this.isImageFetching = false;
      }
    },

    async getImageByIndex(index) {
      console.log(`[ImageStore] ImageStore.getImageByIndex: Getting image by index: ${index}`);
      const settingsStore = useSettingsStore();
      const quality = settingsStore.camera.imageQuality;
      const scale = this.calcScale();

      // Cache-Prüfung
      if (this.lastImage.image && index === this.lastImage.index) {
        console.log('[ImageStore] lastImage from cache');
        const isValid = await this.validateImage(this.lastImage.image);
        if (!isValid) {
          console.warn('[ImageStore] Cached image is corrupted, fetching new image');
          // Gebe alte URL frei
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
                if (!this.isImageFetching ) {
                  clearInterval(interval);
                  resolve();
                }
              }, 100);
              setTimeout(() => clearInterval(interval), 5000);
            });
        }

        // Load image from API
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
          console.error('[ImageStore] Fetched image is corrupted');
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

        return imageUrl;
      } catch (error) {
        console.error(`[ImageStore] An error happened while getting image with index ${index}`, error.message);
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
        console.error(`[ImageStore] An error happened while getting image with index ${index}`, error.message);
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
  },
});
