import { defineStore } from 'pinia';
import apiService from '@/services/apiService';

const IMPORTED_LISTS_KEY = 'telescopius_imported_lists';

export const useTelescopisStore = defineStore('telescopius', {
  state: () => ({
    apiKey: '',
    isLoaded: false,
    targetLists: [],
    importedLists: [],
    isLoadingLists: false,
    listsError: null,
    cacheTimestamp: null,
  }),

  getters: {
    hasApiKey: (state) => state.apiKey && state.apiKey.length > 0,
    hasTargetLists: (state) => state.targetLists.length > 0,
    hasImportedLists: (state) => state.importedLists.length > 0,
  },

  actions: {
    async loadApiKey() {
      try {
        const response = await apiService.getSetting('telescopius_api_key');
        console.log('Loaded telescopius API key:', response);
        if (response && response.Response && response.Response.Value) {
          this.apiKey = response.Response.Value;
          console.log('Telescopius API key loaded successfully');
        }
        this.isLoaded = true;
      } catch (error) {
        // 404 is expected when no API key has been saved yet
        if (error.response?.status === 404 || error.status === 404) {
          console.log('No telescopius API key found in settings (404 - expected for first time)');
        } else {
          console.log('Error loading telescopius API key:', error);
        }
        this.isLoaded = true;
      }
    },

    async saveApiKey(apiKey) {
      try {
        await apiService.createSetting({
          Key: 'telescopius_api_key',
          Value: apiKey,
        });
        this.apiKey = apiKey;
      } catch (error) {
        if (error.response && error.response.status === 409) {
          await apiService.updateSetting('telescopius_api_key', apiKey);
          this.apiKey = apiKey;
        } else {
          throw error;
        }
      }
    },

    async deleteApiKey() {
      try {
        await apiService.deleteSetting('telescopius_api_key');
        this.apiKey = '';
      } catch (error) {
        console.error('Error deleting telescopius API key:', error);
        throw error;
      }
    },

    clearApiKey() {
      this.apiKey = '';
    },

    setLoadingLists(isLoading) {
      this.isLoadingLists = isLoading;
    },

    setTargetLists(lists) {
      this.targetLists = lists || [];
    },

    setListsError(error) {
      this.listsError = error;
    },

    clearTargetLists() {
      this.targetLists = [];
      this.listsError = null;
      this.cacheTimestamp = null;
    },

    async loadTargetListsFromCache() {
      try {
        const response = await apiService.getSetting('telescopius_target_lists_cache');
        if (response && response.Response && response.Response.Value) {
          const cacheData = JSON.parse(response.Response.Value);
          console.log('[TelescopiusStore] Loaded target lists from cache:', cacheData);

          // Load cached data regardless of age
          this.targetLists = cacheData.lists || [];
          this.cacheTimestamp = cacheData.timestamp;
          return true; // Cache loaded successfully
        }
      } catch (error) {
        console.log('[TelescopiusStore] No cached target lists found or error loading cache');
      }
      return false; // No cache found
    },

    async saveTargetListsToCache() {
      const cacheData = {
        timestamp: Date.now(),
        lists: this.targetLists,
      };

      console.log('[TelescopiusStore] Saving target lists to cache:', cacheData);

      try {
        await apiService.createSetting({
          Key: 'telescopius_target_lists_cache',
          Value: JSON.stringify(cacheData),
        });
        this.cacheTimestamp = cacheData.timestamp;
      } catch (error) {
        if (error.response && error.response.status === 409) {
          // Setting exists, update it
          await apiService.updateSetting(
            'telescopius_target_lists_cache',
            JSON.stringify(cacheData)
          );
          this.cacheTimestamp = cacheData.timestamp;
        } else {
          console.error('[TelescopiusStore] Error saving target lists cache:', error);
        }
      }
    },

    async clearTargetListsCache() {
      try {
        await apiService.deleteSetting('telescopius_target_lists_cache');
        console.log('[TelescopiusStore] Target lists cache cleared');
      } catch (error) {
        console.error('[TelescopiusStore] Error clearing target lists cache:', error);
      }
    },

    // CSV imported lists are kept under their own settings key so that a refresh from the
    // Telescopius API (which overwrites telescopius_target_lists_cache) never loses them.
    async loadImportedLists() {
      try {
        const response = await apiService.getSetting(IMPORTED_LISTS_KEY);
        if (response && response.Response && response.Response.Value) {
          const data = JSON.parse(response.Response.Value);
          this.importedLists = Array.isArray(data.lists) ? data.lists : [];
          console.log('[TelescopiusStore] Loaded', this.importedLists.length, 'imported lists');
          return true;
        }
      } catch (error) {
        // 404 is expected when nothing has been imported yet - and it is authoritative, so
        // drop stale entries (e.g. deleted from another device). Other errors keep what we have.
        if (error.response?.status === 404 || error.status === 404) {
          this.importedLists = [];
        } else {
          console.error('[TelescopiusStore] Error loading imported lists:', error);
        }
      }
      return false;
    },

    async saveImportedLists() {
      const value = JSON.stringify({ lists: this.importedLists });

      try {
        await apiService.createSetting({ Key: IMPORTED_LISTS_KEY, Value: value });
      } catch (error) {
        if (error.response && error.response.status === 409) {
          await apiService.updateSetting(IMPORTED_LISTS_KEY, value);
        } else {
          console.error('[TelescopiusStore] Error saving imported lists:', error);
          throw error;
        }
      }
    },

    async addImportedList(list) {
      const previous = this.importedLists;
      this.importedLists = [...previous, list];
      try {
        await this.saveImportedLists();
      } catch (error) {
        // Do not keep a list in memory that could not be persisted.
        this.importedLists = previous;
        throw error;
      }
    },

    async removeImportedList(listId) {
      this.importedLists = this.importedLists.filter((list) => list.id !== listId);

      if (this.importedLists.length === 0) {
        try {
          await apiService.deleteSetting(IMPORTED_LISTS_KEY);
          return;
        } catch (error) {
          console.error('[TelescopiusStore] Error deleting imported lists setting:', error);
        }
      }
      await this.saveImportedLists();
    },
  },
});
