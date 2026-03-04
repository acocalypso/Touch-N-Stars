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
        // New response format: { Success, Error, Data: { Items: [...], Preview: {...} } }
        // Fallback: raw array (old format)
        const items = res?.Data?.Items ?? (Array.isArray(res) ? res : null);
        if (Array.isArray(items)) {
          this.data = items;
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

    async move(id, targetId, insertAfter) {
      try {
        await apiService.sequenceMove(id, targetId, insertAfter);
      } catch (e) {
        console.error('sequenceMove:', e);
      }
      await this.fetch();
    },

    async remove(id) {
      try {
        await apiService.sequenceRemove(id);
      } catch (e) {
        console.error('sequenceRemove:', e);
      }
      await this.fetch();
    },

    async duplicate(id) {
      try {
        await apiService.sequenceDuplicate(id);
      } catch (e) {
        console.error('sequenceDuplicate:', e);
      }
      await this.fetch();
    },

    async setProperty(id, propertyName, value) {
      try {
        await apiService.sequenceSetProperty(id, propertyName, value);
      } catch (e) {
        console.error('sequenceSetProperty:', e);
      }
      await this.fetch();
    },

    async enable(id, enabled) {
      try {
        await apiService.sequenceEnable(id, enabled);
      } catch (e) {
        console.error('sequenceEnable:', e);
      }
      await this.fetch();
    },

    async resetStatus(id) {
      try {
        await apiService.sequenceResetStatus(id);
      } catch (e) {
        console.error('sequenceResetStatus:', e);
      }
      await this.fetch();
    },
  },
});
