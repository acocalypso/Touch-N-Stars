import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from './store';

export const useSequenceNewStore = defineStore('sequenceNewStore', {
  state: () => ({
    data: [],
    loaded: false,
    intervalId: null,
  }),
  getters: {
    globalTriggers: (s) => s.data[0]?.GlobalTriggers ?? [],
    containers: (s) => s.data.slice(1),
  },
  actions: {
    async fetch() {
      const store = apiStore();
      if (!store.isBackendReachable) return;
      try {
        const res = await apiService.fetchSequenceCurrent();
        if (Array.isArray(res)) {
          this.data = res;
          this.loaded = true;
        }
      } catch (e) {
        console.error('fetchSequenceCurrent:', e);
      }
    },
    startPolling() {
      this.stopPolling();
      this.fetch();
      this.intervalId = setInterval(this.fetch, 5000);
    },
    stopPolling() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },
  },
});
