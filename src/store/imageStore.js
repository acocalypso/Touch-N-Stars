import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useSettingsStore } from './settingsStore';

export const useImagetStore = defineStore('imageStore', {
  state: () => ({
    imageData: null,
    isImageFetching: false,
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
      const store = apiStore();
      const cameraWidth = store.profileInfo?.FramingAssistantSettings?.CameraWidth;
      const cameraHeight = store.profileInfo?.FramingAssistantSettings?.CameraHeight;
      const maxDimension = Math.max(cameraWidth, cameraHeight);
      const scale = maxDimension > 2000 ? 2000 / maxDimension : 100;
      console.log(`Calculated scale: ${scale}% for camera size ${cameraWidth}x${cameraHeight}`);
      return scale;
    },

    async getImage() {
      const settingsStore = useSettingsStore();
      const quality = settingsStore.camera.imageQuality;
      const scale = this.calcScale();
      const resize = scale < 1;
      this.isImageFetching = true;

      try {
        console.log(`ImageStore.getImage: Fetching image with quality: ${quality}, resize: ${resize}, scale: ${scale}`);
        const imageResponse = await apiService.getImagePrepared(quality, resize, scale);

        if (imageResponse && imageResponse.data) {
          if (this.imageData) {
            URL.revokeObjectURL(this.imageData);
          }
          this.imageData = URL.createObjectURL(imageResponse.data);
        }
      } catch (error) {
        console.error('Error fetching information:', error);
      } finally {
        this.isImageFetching = false;
      }
    },

    async getImageByIndex(index) {
      console.log(`ImageStore.getImageByIndex: Getting image by index: ${index}`);
      const settingsStore = useSettingsStore();
      const quality = settingsStore.camera.imageQuality;
      const scale = this.calcScale();

      // Cache-Prüfung
      if (this.lastImage.image && index === this.lastImage.index) {
        console.log('lastImage from cache');
        const isValid = await this.validateImage(this.lastImage.image);
        if (!isValid) {
          console.warn('Cached image is corrupted, fetching new image');
          this.lastImage.image = null;
          return this.getImageByIndex(index);
        }
        return this.lastImage.image;
      }

      try {
          // Wait if another fetch is in progress
           if (this.isImageFetching) {
            console.log('Waiting for getImage() to complete...');
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
          console.error('Unknown error: Check NINA Logs for more information');
          return;
        }
        const blob = result.data;
        const imageUrl = URL.createObjectURL(blob);

        // Valid new image 
        const isValid = await this.validateImage(imageUrl);
        if (!isValid) {
          console.error('Fetched image is corrupted');
          return;
        }

        // Save to cache
        this.lastImage.scale = scale;
        this.lastImage.quality = quality;
        this.lastImage.index = index;
        this.lastImage.image = imageUrl;

        return imageUrl;
      } catch (error) {
        console.error(`An error happened while getting image with index ${index}`, error.message);
        return;
      }
    },

    async getThumbnailByIndex(index) {
      try {
        const blob = await apiService.getSequenceThumbnail(index);
        const imageUrl = URL.createObjectURL(blob);
        return imageUrl;
      } catch (error) {
        console.error(`An error happened while getting image with index ${index}`, error.message);
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
          console.log('Image is valid');
          resolve(true);
        };
        img.onerror = () => {
          console.error('Image is corrupted or invalid');
          resolve(false);
        };
        img.src = imageUrl;

        // Timeout nach 5 Sekunden für den Fall, dass das Bild nicht lädt
        setTimeout(() => {
          if (!img.complete) {
            console.error('Image loading timeout');
            resolve(false);
          }
        }, 5000);
      });
    },
  },
});
