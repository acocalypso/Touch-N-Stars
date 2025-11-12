import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

export const useMountStore = defineStore('mountStore', {
  state: () => ({
    lastDirection: '',
    rate: 1,
    wsIsConnected: false,
    showMountInfo: false,
  }),
  actions: {
    async setTrackingMode() {
      const store = apiStore();
      if (!store.mountInfo.TrackingEnabled) {
        try {
          const response = await apiService.setTrackingMode(0);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (!response.Success) return;
        } catch (error) {
          console.log('Error setting tracking mode');
        }
      }
    },

    async syncCoordinates(raAngle, decAngle) {
      //await this.setTrackingMode();
      try {
        const response = await apiService.mountAction(`sync?ra=${raAngle}&dec=${decAngle}`);
        console.log(response);
        return { success: true, response };
      } catch (error) {
        console.log('Error when syncing the coordinates');
        return { success: false, error };
      }
    },
  },
});
