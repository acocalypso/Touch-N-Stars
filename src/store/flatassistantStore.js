import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

export const useFlatassistantStore = defineStore('flatassistantStore', {
  state: () => ({
    count: 20,
    ExposureTime: 2,
    minExposureTime: 0.01,
    maxExposureTime: 20,
    brightness: 100,
    minBrightness: 0,
    maxBrightness: 32000,
    histogramMean: 50,
    meanTolerance: 10,
    binning: '1x1',
    gain: 100,
    offset: 0,
    status: {
      State: '',
      TotalIterations: 0,
      CompletedIterations: -1,
    },
    intervalId: null,
  }),
  actions: {
    async fetchFlatsInfos() {
      try {
        const store = apiStore();

        if (!store.isBackendReachable) {
          console.warn('Backend is not reachable flats');
          return;
        }
        const status = await apiService.flatassistantAction('status');
        this.status = status.Response;
        //console.log('Flats Status:', this.status);
      } catch (error) {
        console.error('Error fetching information:', error);
      }
    },

    startFetchingFlats() {
      if (!this.intervalId) {
        console.log('startFetchingFlats ');
        this.intervalId = setInterval(this.fetchFlatsInfos, 1000);
      }
    },

    stopFetchingFlats() {
      if (this.intervalId) {
        console.log('stopFetchingFlats ');
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },
  },
});
