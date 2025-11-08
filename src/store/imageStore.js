import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useSettingsStore } from './settingsStore';

export const useImagetStore = defineStore('imageStore', {
  state: () => ({
    imageData: null,
    isImageFetching: false,
  }),
  actions: {
    calcScale() {
      const store = apiStore();
      const cameraWidth = store.profileInfo?.FramingAssistantSettings?.CameraWidth;
      const cameraHeight = store.profileInfo?.FramingAssistantSettings?.CameraHeight;
      const maxDimension = Math.max(cameraWidth, cameraHeight);
      const scale = maxDimension > 2000 ? (2000 / maxDimension) : 100;
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
        console.log(`Fetching image with quality: ${quality}, resize: ${resize}, scale: ${scale}`);
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
  },
});
