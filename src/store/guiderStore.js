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
    showGuiderGraph: false,

    phd2Status: [],
    phd2StarLost: [],
    phd2EquipmentProfiles: [],
  }),
  actions: {
    async fetchGraphInfos() {
      const store = apiStore();
      try {
        if (!store.isBackendReachable) {
          console.warn('Backend ist nicht erreichbar log');
          return;
        }
        //Graphdaten vom Backend holen
        const response = await apiService.guiderAction('graph');
        this.chartInfo = response.Response;
      } catch (error) {
        console.error('Fehler beim Abrufen der Informationen:', error);
      }
      if (store.guiderInfo?.DeviceId === 'PHD2_Single') {
        this.fetchPhd2Infos();
      }
    },

    async fetchPhd2Infos() {
      try {
        const store = apiStore();

        if (!store.isBackendReachable) {
          console.warn('Backend ist nicht erreichbar phd2');
          return;
        }
        const response = await apiService.getPhd2AllInfos();
        //console.log('PHD2 all infos:', response);
        this.phd2Status = response.Response.Status;
        this.phd2StarLost = response.Response.StarLostInfo;
        this.phd2EquipmentProfiles = response.Response.EquipmentProfiles;
        //console.log(response.Response.StarLostInfo);
      } catch (error) {
        console.error('Fehler beim Abrufen der Informationen:', error);
      }
    },

    startFetching() {
      const store = apiStore();
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
