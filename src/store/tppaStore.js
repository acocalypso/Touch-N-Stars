import { defineStore } from 'pinia';
import apiService from '@/services/apiService';

export const useTppaStore = defineStore('tppaStore', {
  state: () => ({
    lastMessage: null,
    status: 'nicht verbunden',
    isConnected: false,
    currentMessage: null,
    isRunning: false,
    initialized: false,
    isSouthernHemisphere: false,
    showAzimuthError: '',
    showAltitudeError: '',
    showTotalError: '',
    totalErrorDeg: 0,
    AzimuthErrorDeg: 0,
    AltitudeErrorDEG: 0,
    azimuthCorDirectionLeft: false,
    altitudeCorDirectionTop: false,
    isWithinTolerance: false,
    isPause: false,
    initialErrorLarge: false,
    initialErrorHuge: false,
    declinationSpreadLarge: false,
    declinationSpreadArcsec: 0,
    nearEastWest: false,
    distanceToEastWest: null,
    settings: {
      StartFromCurrentPosition: false,
      EastDirection: false,
      ManualMode: false,
      ExposureTime: null,
      Gain: null,
      Filter: null,
    },
  }),

  actions: {
    setRunning(isRunning) {
      this.isRunning = isRunning;
      localStorage.setItem('tppaStore', JSON.stringify(this.$state));
    },
    // Fetch the current TPPA status (running or not) from the backend.
    async fetchInfo() {
      try {
        const response = await apiService.getTppaInfo();
        if (response?.Success) {
          this.setRunning(!!response.IsRunning);
        }
      } catch (error) {
        console.error('Error fetching TPPA info:', error);
      }
    },
    initialize() {
      if (!this.initialized) {
        const savedState = localStorage.getItem('tppaStore');
        if (savedState) {
          this.$state = JSON.parse(savedState);
        }
        this.initialized = true;
      }
    },
  },
});
