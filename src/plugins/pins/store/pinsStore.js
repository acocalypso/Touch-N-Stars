import { defineStore } from 'pinia';

export const usePinsStore = defineStore('pins', {
  state: () => ({
    savedWifiPasswords: {}, // Object map: SSID -> Password
    timeSyncEnabled: false,
    suppressTimeWarning: false,
    stationaryMode: false,
    wifiList: [],
    selectedSsid: '',
    wifiPassword: '',
    selectedBand: 'auto',
    autoConnect: false,
    isScanning: false,
    wifiConnected: false,
    terminalLogs: [],
    terminalStatus: 'Idle',
    activeOperation: null,
    currentJobId: null,
  }),
  actions: {
    setTimeSync(enabled) {
      this.timeSyncEnabled = enabled;
    },
    setSuppressTimeWarning(value) {
      this.suppressTimeWarning = value;
    },
    savePassword(ssid, password) {
      if (!ssid) return;
      this.savedWifiPasswords[ssid] = password;
    },
    getPassword(ssid) {
      if (!ssid) return '';
      return this.savedWifiPasswords[ssid] || '';
    },
    removePassword(ssid) {
      if (!ssid) return;
      delete this.savedWifiPasswords[ssid];
    },
    clearTerminalLogs() {
      this.terminalLogs = [];
    },
    appendTerminalLog(message) {
      this.terminalLogs.push(message);
      // Keep memory bounded for long-running sessions.
      if (this.terminalLogs.length > 1000) {
        this.terminalLogs.splice(0, this.terminalLogs.length - 1000);
      }
    },
    setTerminalStatus(status) {
      this.terminalStatus = status;
    },
    setActiveOperation(operation) {
      this.activeOperation = operation;
    },
    setCurrentJobId(jobId) {
      this.currentJobId = jobId;
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'pins-plugin-store',
        storage: localStorage,
        paths: ['savedWifiPasswords', 'timeSyncEnabled', 'suppressTimeWarning'],
      },
    ],
  },
});
