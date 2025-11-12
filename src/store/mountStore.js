import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { useToastStore } from './toastStore';

export const useMountStore = defineStore('mountStore', {
  state: () => ({
    lastDirection: '',
    rate: 1,
    wsIsConnected: false,
    showMountInfo: false,
    isSyncCoordinates: false,
    lastSyncTime: null,
  }),
  actions: {
    async syncCoordinates(raAngle, decAngle) {
      const toastStore = useToastStore();
      this.isSyncCoordinates = true;
      try {
        const response = await apiService.mountAction(`sync?ra=${raAngle}&dec=${decAngle}`);

        // Speichere lastSyncTime bei erfolgreichem Sync
        this.lastSyncTime = new Date().toISOString();
        console.log('[mountSotre] Coordinates synced successfully', this.lastSyncTime);

        toastStore.showToast({
          type: 'success',
          title: 'Mount',
          message: 'Coordinates synced successfully',
        });

        return { success: true, response };
      } catch (error) {
        console.log('[mountSotre] Error when syncing the coordinates');

        toastStore.showToast({
          type: 'error',
          title: 'Mount',
          message: 'Error when syncing the coordinates',
        });

        return { success: false, error };
      } finally {
        this.isSyncCoordinates = false;
      }
    },
  },
});
