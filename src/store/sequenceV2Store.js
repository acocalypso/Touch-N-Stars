import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from './store';
import { useToastStore } from './toastStore';

export const useSequenceV2Store = defineStore('sequenceV2Store', {
  state: () => ({
    data: [],
    loaded: false,
    intervalId: null,
    availableItems: [],
    availableTriggers: [],
    availableConditions: [],
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
          const changed = this.applyStatusUpdates(this.data, jsonItems);
          if (changed) await this.loadCurrent();
          const runningIds = this.collectAllRunningIds(this.data);
          await Promise.all(
            runningIds.map(async (id) => {
              const info = await apiService.fetchSequenceInfo(id);
              if (info) this.updateItemById(this.data, id, info);
            })
          );
        }
      } catch (e) {
        console.error('fetchStatusUpdate:', e);
      }
    },

    applyStatusUpdates(currentItems, jsonItems) {
      let changed = false;
      if (!Array.isArray(currentItems) || !Array.isArray(jsonItems)) return changed;
      if (currentItems.length !== jsonItems.length) return true;
      jsonItems.forEach((jsonItem, i) => {
        if (!currentItems[i]) return;
        if (jsonItem.Status !== undefined && currentItems[i].Status !== jsonItem.Status) {
          currentItems[i].Status = jsonItem.Status;
          changed = true;
        }
        if (jsonItem.Items && currentItems[i].Items) {
          if (this.applyStatusUpdates(currentItems[i].Items, jsonItem.Items)) changed = true;
        }
      });
      return changed;
    },

    collectAllRunningIds(items, result = []) {
      if (!Array.isArray(items)) return result;
      for (const item of items) {
        if (item.Status === 'RUNNING' && item.Id) result.push(item.Id);
        if (item.Items) this.collectAllRunningIds(item.Items, result);
      }
      return result;
    },

    updateItemById(items, id, newData) {
      if (!Array.isArray(items)) return false;
      for (const item of items) {
        if (item.Id === id) {
          Object.assign(item, newData);
          return true;
        }
        if (item.Items && this.updateItemById(item.Items, id, newData)) return true;
      }
      return false;
    },

    async startPolling() {
      this.stopPolling();
      await this.loadCurrent();
      this.fetchStatusUpdate();
      this.intervalId = setInterval(this.fetchStatusUpdate, 2000);
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

    async fetchAvailableItems() {
      if (this.availableItems.length) return;
      try {
        const res = await apiService.sequenceFetchItemTypes();
        this.availableItems = Array.isArray(res) ? res : (res?.Items ?? res?.Response ?? []);
      } catch (e) {
        console.error('sequenceFetchItemTypes:', e);
      }
    },

    async fetchAvailableTriggers() {
      if (this.availableTriggers.length) return;
      try {
        const res = await apiService.sequenceFetchTriggerTypes();
        this.availableTriggers = Array.isArray(res) ? res : (res?.Items ?? res?.Response ?? []);
      } catch (e) {
        console.error('sequenceFetchTriggerTypes:', e);
      }
    },

    async fetchAvailableConditions() {
      if (this.availableConditions.length) return;
      try {
        const res = await apiService.sequenceFetchConditionTypes();
        this.availableConditions = Array.isArray(res) ? res : (res?.Items ?? res?.Response ?? []);
      } catch (e) {
        console.error('sequenceFetchConditionTypes:', e);
      }
    },

    _showError(message) {
      useToastStore().showToast({ type: 'error', title: 'Fehler', message, autoClose: true });
    },

    async addItem(targetId, itemType, insertAfter = true) {
      try {
        const res = await apiService.sequenceAddItem(targetId, itemType, insertAfter);
        if (res?.Success === false) {
          this._showError(res.Error);
          return;
        }
      } catch (e) {
        console.error('sequenceAddItem:', e);
      }
      await this.loadCurrent();
      await this.fetchStatusUpdate();
    },

    async addTrigger(itemId, triggerType, insertAfter = true) {
      try {
        const res = await apiService.sequenceAddTrigger(itemId, triggerType, insertAfter);
        if (res?.Success === false) {
          this._showError(res.Error);
          return;
        }
      } catch (e) {
        console.error('sequenceAddTrigger:', e);
      }
      await this.loadCurrent();
      await this.fetchStatusUpdate();
    },

    async addCondition(itemId, conditionType, insertAfter = true) {
      try {
        const res = await apiService.sequenceAddCondition(itemId, conditionType, insertAfter);
        if (res?.Success === false) {
          this._showError(res.Error);
          return;
        }
      } catch (e) {
        console.error('sequenceAddCondition:', e);
      }
      await this.loadCurrent();
      await this.fetchStatusUpdate();
    },

    async setDsoTarget(id, name, raDeg, decDeg, rotation) {
      const dsoContainers = [];
      const collectDso = (items) => {
        for (const item of items ?? []) {
          if (item.FullTypeName === 'NINA.Sequencer.Container.DeepSkyObjectContainer') {
            dsoContainers.push(item);
          } else {
            collectDso(item.Items);
          }
        }
      };
      collectDso(this.data);
      const index = Math.max(
        0,
        dsoContainers.findIndex((c) => c.Id === id)
      );
      try {
        await apiService.sequnceTargetSet(name ?? '', raDeg, decDeg, rotation ?? 0, index);
      } catch (e) {
        console.error('setDsoTarget:', e);
      }
      await this.loadCurrent();
      await this.fetchStatusUpdate();
    },
  },
});
