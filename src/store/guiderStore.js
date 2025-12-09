import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import apiPinsService from '@/services/apiPinsService';
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
    phd2StarInfo: null,

    // PHD2 Camera State (PINS)
    phd2Cameras: [],
    phd2SelectedCameraIndex: null,
    phd2SelectedCameraName: null,
    phd2CamerasLoading: false,
  }),
  actions: {
    async fetchGraphInfos() {
      const store = apiStore();
      try {
        if (!store.isBackendReachable) {
          console.warn('Backend is not reachable log');
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
            console.log('Show star lost toast');
          } else {
            console.log('Page recently returned from background, skipping star lost toast');
          }
        }

        this.phd2EquipmentProfiles = response1.Response.EquipmentProfiles;

        // StarInfo aus all-info Response extrahieren
        this.phd2StarInfo = response1.Response.StarImage?.StarInfo || null;

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
        this.lastStarLostCheck = null;
        return false;
      }

      const currentFrame = starLostInfo.Frame;
      const now = Date.now();

      // Check if we're recently returned from background
      const mainStore = apiStore();
      if (mainStore.isPageRecentlyReturnedFromBackground()) {
        // Reset initialization to avoid false positives
        this.previousStarLostFrame = currentFrame;
        this.isStarLostInitialized = true;
        this.lastStarLostCheck = now;
        //console.log('Page recently returned, resetting star lost tracking');
        return false;
      }

      if (!this.isStarLostInitialized) {
        // First call: store the frame but don't trigger star lost
        this.previousStarLostFrame = currentFrame;
        this.isStarLostInitialized = true;
        this.lastStarLostCheck = now;
        console.log('Star lost initialized with frame:', currentFrame);
        return false;
      }

      // Don't check too frequently after initialization
      if (this.lastStarLostCheck && now - this.lastStarLostCheck < 5000) {
        return false;
      }

      if (currentFrame !== this.previousStarLostFrame) {
        console.log('Star lost frame changed:', this.previousStarLostFrame, '->', currentFrame);
        this.previousStarLostFrame = currentFrame;
        this.lastStarLostCheck = now;
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

    // PHD2 Camera Actions (PINS)
    async fetchPHD2Cameras() {
      const store = apiStore();
      if (!store.isPINS) return;
      this.phd2CamerasLoading = true;
      try {
        const response = await apiPinsService.getPHD2CameraList();
        if (response.Success && response.Response) {
          this.phd2Cameras = response.Response.Cameras;
          this.phd2SelectedCameraIndex = response.Response.SelectedIndex;
          this.phd2SelectedCameraName = response.Response.Cameras[response.Response.SelectedIndex];
        }
      } catch (error) {
        console.error('Error fetching PHD2 cameras:', error);
      } finally {
        this.phd2CamerasLoading = false;
      }
    },

    async setPHD2Camera(index) {
      try {
        const response = await apiPinsService.setPHD2SelectedCamera(index);
        if (response.Success && response.Response) {
          this.phd2SelectedCameraIndex = response.Response.Index;
          this.phd2SelectedCameraName = response.Response.Name;
          return response;
        }
      } catch (error) {
        console.error('Error setting PHD2 camera:', error);
        throw error;
      }
    },

    async refreshPHD2SelectedCamera() {
      const store = apiStore();
      if (!store.isPINS) return;
      try {
        const response = await apiPinsService.getPHD2SelectedCamera();
        if (response.Success && response.Response) {
          this.phd2SelectedCameraIndex = response.Response.Index;
          this.phd2SelectedCameraName = response.Response.Name;
        }
      } catch (error) {
        console.error('Error refreshing PHD2 selected camera:', error);
      }
    },
  },
});
