import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

// Stored outside reactive state — functions cannot be serialised by Pinia/devtools
let _queueRunnerFn = null;

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
    // Summary of the most recently completed run/queue; null when nothing has finished yet.
    // { completed, total, success, lastADU, filterResults: [{filterName, completed, total, success, lastADU}] | null }
    lastRun: null,
    // ADU of the most recently captured image during the current filter run
    currentADU: null,
    // Multi-filter queue state
    filterQueue: [], // [{ id: number|null, name: string|null }]
    filterQueueIndex: -1, // index of running filter; -1 = single-filter / not in queue mode
    queueResults: [], // accumulates per-filter results as each filter finishes
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

        const status = await apiService.flatassistantAction('status');
        const next = status.Response;

        // A new filter run is starting — clear transient state (not queueResults)
        if (prevState !== 'Running' && next.State === 'Running') {
          this.lastRun = null;
          this.currentADU = null;
        }

        // Track live ADU from the flat status response
        if (next.CurrentADU !== null && next.CurrentADU !== undefined) {
          this.currentADU = Math.round(next.CurrentADU);
        }

        // A filter run just finished
        if (prevState === 'Running' && next.State === 'Finished') {
          const isQueueMode = this.filterQueueIndex >= 0;
          const filterName = isQueueMode
            ? (this.filterQueue[this.filterQueueIndex]?.name ?? null)
            : null;
          const result = {
            filterName,
            completed: prevCompleted,
            total: prevTotal,
            success: prevTotal > 0 && prevCompleted >= prevTotal,
            lastADU: this.currentADU,
          };

          const hasMore = isQueueMode && this.filterQueueIndex < this.filterQueue.length - 1;

          if (hasMore && _queueRunnerFn !== null) {
            // Advance to the next filter in the queue
            this.queueResults.push(result);
            this.filterQueueIndex++;
            this.currentADU = null;
            try {
              await _queueRunnerFn(this.filterQueue[this.filterQueueIndex].id);
            } catch (e) {
              console.error('Failed to start next filter in queue:', e);
              _queueRunnerFn = null;
              this._buildLastRun(null);
              this.filterQueueIndex = -1;
            }
          } else {
            // Queue finished (or single-filter / cancelled)
            if (isQueueMode) this.queueResults.push(result);
            this._buildLastRun(isQueueMode ? null : result);
            this.filterQueueIndex = -1;
            _queueRunnerFn = null;
          }
        }

        this.status = next;
      } catch (error) {
        console.error('Error fetching flats information:', error);
      }
    },

    _buildLastRun(singleResult) {
      if (this.queueResults.length > 0) {
        const totalCompleted = this.queueResults.reduce((s, r) => s + Math.max(0, r.completed), 0);
        const totalExpected = this.queueResults.reduce((s, r) => s + Math.max(0, r.total), 0);
        this.lastRun = {
          completed: totalCompleted,
          total: totalExpected,
          success: this.queueResults.every((r) => r.success),
          lastADU: this.currentADU,
          filterResults: [...this.queueResults],
        };
      } else if (singleResult) {
        this.lastRun = { ...singleResult, filterResults: null };
      }
    },

    // Start a queue of filter runs.
    // filters: [{ id: number|null, name: string|null }]
    // runnerFn: async (filterId: number|null) => void  — kicks off one API call
    async startFilterQueue(filters, runnerFn) {
      _queueRunnerFn = runnerFn;
      this.filterQueue = filters;
      // Only enter queue mode when there is more than one filter
      this.filterQueueIndex = filters.length > 1 ? 0 : -1;
      this.queueResults = [];
      this.lastRun = null;
      this.currentADU = null;
      try {
        await runnerFn(filters[0].id);
      } catch (error) {
        console.error('Failed to start flat run:', error);
      }
    },

    // Abort the remaining queue (e.g. user pressed Stop).
    // The current filter run is stopped via the API by the component; we just
    // prevent auto-advancing to the next filter.
    cancelFilterQueue() {
      _queueRunnerFn = null;
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
