import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from './store';

export const useSequenceNewStore = defineStore('sequenceNewStore', {
  state: () => ({
    data: [],
    loaded: false,
    intervalId: null,
    runningItemInfo: null,
  }),
  getters: {
    globalTriggers: (s) => s.data[0]?.GlobalTriggers ?? [],
    containers: (s) => s.data.slice(1),
  },
  actions: {
    async loadCurrent() {
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

    async fetchStatusUpdate() {
      const store = apiStore();
      if (!store.isBackendReachable) return;
      try {
        const res = await apiService.sequenceAction('json');
        const jsonItems = res?.Response;
        if (Array.isArray(jsonItems)) {
          this.applyStatusUpdates(this.data, jsonItems);
          const runningId = this.findFirstRunningId(this.data);
          if (runningId) {
            const info = await apiService.fetchSequenceInfo(runningId);
            this.runningItemInfo = info ?? null;
          } else {
            this.runningItemInfo = null;
          }
        }
      } catch (e) {
        console.error('fetchStatusUpdate:', e);
      }
    },

    applyStatusUpdates(currentItems, jsonItems) {
      if (!Array.isArray(currentItems) || !Array.isArray(jsonItems)) return;
      jsonItems.forEach((jsonItem, i) => {
        if (!currentItems[i]) return;
        if (jsonItem.Status !== undefined) currentItems[i].Status = jsonItem.Status;
        if (jsonItem.Items && currentItems[i].Items) {
          this.applyStatusUpdates(currentItems[i].Items, jsonItem.Items);
        }
      });
    },

    findFirstRunningId(items) {
      if (!Array.isArray(items)) return null;
      for (const item of items) {
        if (item.Status === 'RUNNING' && item.Id) return item.Id;
        if (item.Items) {
          const found = this.findFirstRunningId(item.Items);
          if (found) return found;
        }
      }
      return null;
    },

    async startPolling() {
      this.stopPolling();
      await this.loadCurrent();
      this.fetchStatusUpdate();
      this.intervalId = setInterval(this.fetchStatusUpdate, 5000);
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
      await this.loadCurrent();
      await this.fetchStatusUpdate();
    },

    async remove(id) {
      try {
        await apiService.sequenceRemove(id);
      } catch (e) {
        console.error('sequenceRemove:', e);
      }
      await this.loadCurrent();
      await this.fetchStatusUpdate();
    },

    async duplicate(id) {
      try {
        await apiService.sequenceDuplicate(id);
      } catch (e) {
        console.error('sequenceDuplicate:', e);
      }
      await this.loadCurrent();
      await this.fetchStatusUpdate();
    },

    async setProperty(id, propertyName, value) {
      try {
        await apiService.sequenceSetProperty(id, propertyName, value);
      } catch (e) {
        console.error('sequenceSetProperty:', e);
      }
      await this.loadCurrent();
      await this.fetchStatusUpdate();
    },

    async enable(id, enabled) {
      try {
        await apiService.sequenceEnable(id, enabled);
      } catch (e) {
        console.error('sequenceEnable:', e);
      }
      await this.loadCurrent();
      await this.fetchStatusUpdate();
    },

    async resetStatus(id) {
      try {
        await apiService.sequenceResetStatus(id);
      } catch (e) {
        console.error('sequenceResetStatus:', e);
      }
      await this.loadCurrent();
      await this.fetchStatusUpdate();
    },
  },
});
