import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

export const useLogStore = defineStore('LogStore', {
  state: () => ({
    intervalId: null,
    LogsInfo: {
      logs: [],
    },
    canSetPos: true,
    foundPos: 0,
    foundPosTime: new Date(),

    focuserData: [],
    startAfTime: '',
    lastHfrLogTime: 0,
  }),

  actions: {
    async fetchLogInfos() {
      try {
        const store = apiStore();

        if (!store.isBackendReachable) {
          console.warn('Backend ist nicht erreichbar log');
          return;
        }

        // Logs vom Backend holen (z.B. die letzten 100)
        const logs = await apiService.getLastLogs('100');
        this.LogsInfo.logs = logs;
        //console.log('Alle Logs:', this.LogsInfo);
      } catch (error) {
        console.error('Fehler beim Abrufen der Informationen:', error);
      }
    },

    startFetchingLog() {
      if (!this.intervalId) {
        this.intervalId = setInterval(this.fetchLogInfos, 1000);
      }
    },

    stopFetchingLog() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },
  },
});
