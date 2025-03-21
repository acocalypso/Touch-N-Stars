import { defineStore } from 'pinia';

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
  }),

  actions: {
    setRunning(isRunning) {
      this.isRunning = isRunning;
      // Persist state to localStorage
      localStorage.setItem('tppaStore', JSON.stringify(this.$state));
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

  getters: {
    isTppaRunning: (state) => state.isRunning,
  },
});
