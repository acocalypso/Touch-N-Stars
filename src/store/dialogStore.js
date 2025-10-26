import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

export const useDialogStore = defineStore('dialogStore', {
  state: () => ({
    dialogs: [],
    dialogCount: 0,
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
          this.dialogs = response.Response || [];
          this.dialogCount = this.dialogs.length;
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

    async getDialogInfo(dialogId) {
      try {
        const response = await apiService.getDialogInfo(dialogId);
        return response;
      } catch (error) {
        console.error(`Error fetching dialog info for ${dialogId}:`, error);
        throw error;
      }
    },

    async clickButton(dialogId, buttonIndex) {
      try {
        const response = await apiService.clickDialogButton(dialogId, buttonIndex);
        if (response.Success) {
          await this.fetchDialogs();
        }
        return response;
      } catch (error) {
        console.error(`Error clicking button ${buttonIndex} in dialog ${dialogId}:`, error);
        throw error;
      }
    },

    async closeDialog(dialogId) {
      try {
        const response = await apiService.closeDialog(dialogId);
        if (response.Success) {
          await this.fetchDialogs();
        }
        return response;
      } catch (error) {
        console.error(`Error closing dialog ${dialogId}:`, error);
        throw error;
      }
    },

    async closeAllDialogs() {
      try {
        const response = await apiService.closeAllDialogs();
        if (response.Success) {
          await this.fetchDialogs();
        }
        return response;
      } catch (error) {
        console.error('Error closing all dialogs:', error);
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
