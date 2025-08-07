import { defineStore } from 'pinia';
import apiService from '@/services/apiService';

export const useTelescopisStore = defineStore('telescopius', {
  state: () => ({
    apiKey: '',
    isLoaded: false,
  }),

  getters: {
    hasApiKey: (state) => state.apiKey && state.apiKey.length > 0,
  },

  actions: {
    async loadApiKey() {
      try {
        const response = await apiService.getSetting('telescopius_api_key');
        console.log('Loaded telescopius API key:', response);
        if (response && response.Response && response.Response.Value) {
          this.apiKey = response.Response.Value;
          console.log('Telescopius API key loaded successfully:', this.apiKey);
        }
        this.isLoaded = true;
      } catch (error) {
        console.log('No telescopius API key found in settings');
        this.isLoaded = true;
      }
    },

    async saveApiKey(apiKey) {
      try {
        await apiService.createSetting({
          Key: 'telescopius_api_key',
          Value: apiKey
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
    }
  }
});