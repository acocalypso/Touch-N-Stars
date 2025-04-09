import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

export const useGuiderStore = defineStore('guiderStore', {
  state: () => ({
    intervalId: null,
    RADistanceRaw: [],
    DECDistanceRaw: [],
    raDuration:[],
    decDuration:[],
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

    processGuiderChartDataApi(data) {
      // Überprüfen, ob das GuideSteps-Array vorhanden ist
      //console.log('GuideSteps:', data?.GuideSteps);
      if (!Array.isArray(data?.GuideSteps)) {
        console.warn('Invalid GuideSteps, initializing as an empty array.');
        this.RADistanceRaw = [];
        this.DECDistanceRaw = [];
        this.raDuration = [];
        this.decDuration = [];
        return;
      }
      // Extrahieren der RADistanceRawDisplay und DECDistanceRawDisplay Werte
      this.RADistanceRaw = data.GuideSteps.map((step) =>
        typeof step.RADistanceRaw === 'number' ? step.RADistanceRawDisplay : 0
      );

      this.DECDistanceRaw = data.GuideSteps.map((step) =>
        typeof step.DECDistanceRaw === 'number' ? step.DECDistanceRawDisplay : 0
      );

      this.raDuration = data.GuideSteps.map((step) =>
        typeof step.DECDistanceRaw === 'number' ? step.RADuration : 0
      );

      this.decDuration = data.GuideSteps.map((step) =>
        typeof step.DECDistanceRaw === 'number' ? step.DECDuration : 0
      );
    },

    startFetching() {
      console.log('Start fetching graph data...');
      this.stopFetching(); // Stop any existing interval before starting a new one
      this.intervalId = setInterval(this.fetchGraphInfos, 1000);
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
