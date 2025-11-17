import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

export const useDialogStore = defineStore('dialogStore', {
  state: () => ({
    dialogs: [],
    dialogCount: 0,
    meridianFlipData: null,
    slewAndCenterData: null,
    intervalId: null,
    isPolling: false,
  }),
  actions: {
    async fetchDialogs() {
      const store = apiStore();
      try {
        if (!store.isBackendReachable) {
          console.warn('Backend is not reachable');
          return;
        }

        const response = await apiService.getDialogList();
        if (response.Success) {
          this.dialogs = response.Response.Dialogs || [];
          //console.log('Fetched dialogs:',response.Response);
          this.dialogCount = response.Response.Count;
          // Store MeridianFlip data if available
          if (response.Response.MeridianFlip) {
            this.meridianFlipData = response.Response.MeridianFlip;
          }
          // Store SlewAndCenter data if available
          if (response.Response.SlewAndCenter) {
            this.slewAndCenterData = response.Response.SlewAndCenter;
          }
          //console.log('Dialog count:', this.dialogCount);
        }
      } catch (error) {
        console.error('Error fetching dialogs:', error);
      }
    },

    async fetchDialogCount() {
      const store = apiStore();
      try {
        if (!store.isBackendReachable) {
          console.warn('Backend is not reachable');
          return;
        }

        const response = await apiService.getDialogCount();
        if (response.Success) {
          this.dialogCount = response.Response;
        }
      } catch (error) {
        console.error('Error fetching dialog count:', error);
      }
    },

    async clickButton(buttonName, windowHashCode = null) {
      try {
        const response = await apiService.clickDialogButton(buttonName, windowHashCode);
        if (response.Success) {
          await this.fetchDialogs();
        }
        return response;
      } catch (error) {
        console.error(`Error clicking button ${buttonName}:`, error);
        throw error;
      }
    },

    async closeAllDialogs(confirm = true) {
      try {
        const response = await apiService.closeAllDialogs(confirm);
        if (response.Success) {
          await this.fetchDialogs();
        }
        return response;
      } catch (error) {
        console.error('Error closing all dialogs:', error);
        throw error;
      }
    },

    async closeDialogsByType(type, confirm = true) {
      try {
        const response = await apiService.closeDialogsByType(type, confirm);
        if (response.Success) {
          await this.fetchDialogs();
        }
        return response;
      } catch (error) {
        console.error(`Error closing dialogs by type ${type}:`, error);
        throw error;
      }
    },

    startPolling(interval = 2000) {
      if (!this.isPolling) {
        console.log('Start polling dialogs...');
        this.isPolling = true;
        this.fetchDialogs();
        this.intervalId = setInterval(() => this.fetchDialogs(), interval);
      }
    },

    stopPolling() {
      if (this.isPolling) {
        console.log('Stop polling dialogs...');
        this.isPolling = false;
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
      }
    },
  },
});
