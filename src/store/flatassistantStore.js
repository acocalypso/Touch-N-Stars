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
    // Summary of the most recently completed run; null when no run has finished yet.
    // { completed: number, total: number, success: boolean, lastADU: number|null }
    lastRun: null,
    // ADU (Mean) of the most recently captured image during the current run
    currentADU: null,
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

        const prevState = this.status.State;
        const prevCompleted = this.status.CompletedIterations;
        const prevTotal = this.status.TotalIterations;

        // Check both TNS (multimode) and ninaAPI status in parallel.
        // TNS takes precedence when its task is running.
        const [tnsResult, ninaResult] = await Promise.allSettled([
          apiService.flatMultiStatus(),
          apiService.flatassistantAction('status'),
        ]);

        const tnsNext = tnsResult.status === 'fulfilled' ? tnsResult.value?.Response : null;
        const ninaNext = ninaResult.status === 'fulfilled' ? ninaResult.value?.Response : null;
        const next = tnsNext?.State === 'Running' ? tnsNext : (ninaNext ?? tnsNext ?? this.status);

        // A new run is starting — clear the previous result
        if (prevState !== 'Running' && next.State === 'Running') {
          this.lastRun = null;
          this.currentADU = null;
        }

        // ADU comes directly from the flat status response (both Running and Finished states)
        if (next.CurrentADU !== null && next.CurrentADU !== undefined) {
          this.currentADU = Math.round(next.CurrentADU);
        }

        // A run just finished — save a summary so the UI can show the outcome
        if (prevState === 'Running' && next.State === 'Finished') {
          this.lastRun = {
            completed: prevCompleted,
            total: prevTotal,
            success: prevTotal > 0 && prevCompleted >= prevTotal,
            lastADU: this.currentADU,
          };
        }

        this.status = next;
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
