import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

export const useGuiderStore = defineStore('guiderStore', {
  state: () => ({
    intervalId: null,
    RADistanceRaw: [],
    DECDistanceRaw: [],
    raDuration: [],
    decDuration: [],
    chartInfo: [],
  }),
  actions: {
    async fetchGraphInfos() {
      try {
        const store = apiStore();

        if (!store.isBackendReachable) {
          console.warn('Backend ist nicht erreichbar log');
          return;
        }
        //Graphdaten vom Backend holen
        const response = await apiService.guiderAction('graph');
        this.chartInfo = response.Response;
        this.processGuiderChartDataApi(response.Response);
      } catch (error) {
        console.error('Fehler beim Abrufen der Informationen:', error);
      }
    },


    startFetching() {
      console.log('Start fetching graph data...');
      if (!this.intervalId) {
        this.intervalId = setInterval(this.fetchGraphInfos, 1000);
      }
    },

    stopFetching() {
      console.log('Stop fetching graph data...');
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },
  },
});
