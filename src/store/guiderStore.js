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

    phd2Connection: [],
    phd2Status: [],
    phd2StarLostInfo: [],
    phd2StarLost: false,
    phd2EquipmentProfiles: [],
    phd2CurrentEquipment: [],
    phd2IsConnected: false,
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
        const response1 = await apiService.getPhd2AllInfos();

        this.phd2Connection = response1.Response?.Connection;

        if (!this.phd2Connection.IsConnected) {
          await apiService.connectPHD2();
          return;
        }
        const response2 = await apiService.getPhd2CurrentEquipment();

        this.phd2Status = response1.Response.Status;
        //console.log('appstate' , response1.Response.Status);

        this.phd2StarLostInfo = response1.Response.StarLostInfo;

        this.phd2StarLost = this.checkStarLostByFrame(this.phd2StarLostInfo);
        if (this.phd2StarLost) {
          console.log('Star lost');
          console.log(this.phd2StarLostInfo);

          // Prüfe, ob die Seite kürzlich aus dem Hintergrund zurückgekehrt ist
          const mainStore = apiStore();
          if (!mainStore.isPageRecentlyReturnedFromBackground()) {
            // Hier könnte die Toast-Benachrichtigung angezeigt werden
            console.log('Show star lost toast');
          } else {
            console.log('Page recently returned from background, skipping star lost toast');
          }
        }

        this.phd2EquipmentProfiles = response1.Response.EquipmentProfiles;

        this.phd2CurrentEquipment = response2.Response.CurrentEquipment;
        this.phd2IsConnected =
          this.phd2CurrentEquipment.camera?.connected || this.phd2CurrentEquipment.mount?.connected;
      } catch (error) {
        console.error('Error fetching the information:', error);
      }
    },

    data() {
      return {
        previousStarLostFrame: null,
        phd2StarLost: false,
        isStarLostInitialized: false, // <- new flag
      };
    },

    checkStarLostByFrame(starLostInfo) {
      if (!starLostInfo || typeof starLostInfo.Frame !== 'number') {
        this.previousStarLostFrame = null;
        this.isStarLostInitialized = false;
        return false;
      }

      const currentFrame = starLostInfo.Frame;

      if (!this.isStarLostInitialized) {
        // First call: store the frame but don't trigger star lost
        this.previousStarLostFrame = currentFrame;
        this.isStarLostInitialized = true;
        return false;
      }

      if (currentFrame !== this.previousStarLostFrame) {
        this.previousStarLostFrame = currentFrame;
        return true;
      }

      return false;
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
