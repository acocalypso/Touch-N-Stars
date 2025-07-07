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
    phd2CurrentEquipment : [],
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
        console.error('Error fetching the information:', error);
      }
      if (store.guiderInfo?.DeviceId === 'PHD2_Single' && store.isBackendReachable) {
        this.fetchPhd2Infos();
      }
    },

    async fetchPhd2Infos() {
      try {
        const store = apiStore();

        const [response1, response2] = await Promise.all([
          apiService.getPhd2AllInfos(),
          apiService.getPhd2CurrentEquipment()
        ]);

        this.phd2Status = response1.Response.Status;
        this.phd2StarLost = response1.Response.StarLostInfo;
        this.phd2EquipmentProfiles = response1.Response.EquipmentProfiles;

        this.phd2CurrentEquipment = response2.Response.CurrentEquipment;
        console.log( response2.Response.CurrentEquipment.camera.connected)

      } catch (error) {
        console.error('Error fetching the information:', error);
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
