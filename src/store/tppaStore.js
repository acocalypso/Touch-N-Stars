import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { useSettingsStore } from '@/store/settingsStore';

// Older versions persisted the complete store state for ALL instances under
// this one global key; kept only as a read-once migration fallback.
const LEGACY_STORAGE_KEY = 'tppaStore';

// Only the user-editable settings are persisted, and they are scoped per
// backend instance: filter names, gain and exposure values are only valid on
// the instance they were chosen for. Everything else in this store is
// backend-derived live state and is re-synced via fetchInfo() / the TPPA
// websocket instead of being restored from disk.
function settingsStorageKey() {
  const connection = useSettingsStore().connection;
  return `tppaStore.settings:${connection?.ip ?? ''}:${connection?.port ?? ''}`;
}

export const useTppaStore = defineStore('tppaStore', {
  state: () => ({
    lastMessage: null,
    status: 'nicht verbunden',
    isConnected: false,
    currentMessage: null,
    isRunning: false,
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
      this.saveSettings();
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
    saveSettings() {
      localStorage.setItem(settingsStorageKey(), JSON.stringify(this.settings));
    },
    // Load the persisted settings for the currently selected instance. Safe to
    // call repeatedly; it only reloads when the endpoint changed since the
    // last load (e.g. after an instance switch).
    initialize() {
      const key = settingsStorageKey();
      if (this._loadedSettingsKey === key) return;
      this._loadedSettingsKey = key;

      let savedSettings = null;
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          savedSettings = JSON.parse(saved);
        } else {
          const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (legacy) {
            savedSettings = JSON.parse(legacy)?.settings ?? null;
          }
        }
      } catch (error) {
        console.error('Error loading TPPA settings from localStorage:', error);
      }
      if (savedSettings) {
        this.settings = { ...this.settings, ...savedSettings };
      }
    },
  },
});
