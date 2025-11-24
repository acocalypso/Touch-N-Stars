import { defineStore } from 'pinia';
import tutorialContent from '@/assets/tutorial.json';
import { apiStore } from '@/store/store';
import { useImagetStore } from './imageStore';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    language: 'en',
    setupCompleted: localStorage.getItem('setupCompleted') === 'true',
    showDebugConsole: false,
    showSpecial: false,
    useBetaFeatures: false,
    livestack: {
      showFilters: true,
    },
    coordinates: {
      latitude: null,
      longitude: null,
      altitude: null,
    },
    connection: {
      ip: '',
      port: '',
      instances: [],
    },
    selectedInstanceId: null,
    lastCreatedInstanceId: null,
    monitorViewSetting: {
      showImage: true,
      showImageStats: true,
      showImgStatsGraph: true,
      showGuiderGraph: true,
      showGuiderAfGraph: true,
      showSequenceCurrentState: true,
      displayStatusUnderImage: false,
      showHistoryImageStats: true,
      historyTimeRange: {
        startIndex: 0, // Index des ersten anzuzeigenden Datenpunkts
        endIndex: null, // null bedeutet: alle Daten anzeigen
      },
      graphDataSource1: 'HFR', // Erste Datenquelle für Graph
      graphDataSource2: 'Stars', // Zweite Datenquelle für Graph
    },
    useImperialUnits: localStorage.getItem('useImperialUnits') === 'true',
    tutorial: {
      completed: localStorage.getItem('tutorialCompleted') === 'true',
      steps: tutorialContent.steps,
      histogramVisited: false,
    },
    framing: {
      useNinaCache: true,
    },
    mount: {
      slewRate: 2,
      reversePrimaryAxis: false,
      reverseSecondaryAxis: false,
      useCenter: false,
      useRotate: false,
      settingsVisited: false,
    },
    camera: {
      exposureTime: 2,
      gain: 0,
      offset: 0,
      useSolve: false,
      useSyncSolveToMount: false,
      imageScale: 100,
      imageQuality: 90,
      maxDimension: 2048,
      snapshotTargetName: 'Snapshot',
    },
    flats: {
      selectedOption: 'AutoExposure',
      minBrightness: 0,
      maxBrightness: 100,
      brightness: 50,
      exposureTime: 2,
    },
    stellarium: {
      constellationsLinesVisible: true,
      azimuthalLinesVisible: false,
      equatorialLinesVisible: false,
      meridianLinesVisible: false,
      eclipticLinesVisible: false,
      atmosphereVisible: true,
      landscapesVisible: true,
      dsosVisible: true, // Deep Sky Objects (Messier, NGC, etc.)
    },
    guider: {
      phd2ForceCalibration: localStorage.getItem('phd2ForceCalibration') === 'true',
    },
    instanceColorClasses: [
      'bg-gray-900/95',
      'bg-gray-800',
      'bg-blue-900',
      'bg-sky-900',
      'bg-indigo-900',
      'bg-cyan-900',
      'bg-amber-900',
      'bg-slate-800',
      'bg-zinc-800',
      'bg-fuchsia-900',
      'bg-emerald-900',
      'bg-teal-900',
      'bg-gray-900',
      'bg-red-900',
      'bg-orange-900',
      'bg-lime-900',
      'bg-neutral-900',
      'bg-stone-900',
      'bg-green-900',
      'bg-purple-900',
      'bg-rose-900',
    ],
    // Device/screen behavior
    keepAwakeEnabled: false,
  }),
  actions: {
    _getApiStore() {
      return apiStore();
    },

    setCoordinates(coords) {
      this.coordinates = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        altitude: coords.altitude,
      };
    },

    completeSetup() {
      this.setupCompleted = true;
      localStorage.setItem('setupCompleted', 'true');
    },

    resetSetup() {
      this.setupCompleted = false;
      localStorage.removeItem('setupCompleted');
    },

    isSetupComplete() {
      return this.setupCompleted;
    },

    async setConnection(connection) {
      this.connection.ip = connection.ip;
      this.connection.port = connection.port;

      // Clear all backend states when connection changes
      this._getApiStore().clearAllStates();
    },

    addInstance(instance) {
      const existingInstance = this.getInstanceByNameIpPort(
        instance.name || 'Instance',
        instance.ip,
        instance.port
      );
      if (existingInstance) {
        this.setSelectedInstanceId(existingInstance.id);
      } else {
        const newInstance = {
          id: Date.now().toString(),
          name: instance.name || 'Instance',
          ip: instance.ip,
          port: instance.port,
        };
        this.connection.instances.push(newInstance);
        this.lastCreatedInstanceId = newInstance.id;
        this.setSelectedInstanceId(newInstance.id);
      }
    },

    isLastCreatedInstance(id) {
      return this.lastCreatedInstanceId === id;
    },

    updateInstance(id, updatedInstance) {
      const index = this.connection.instances.findIndex((i) => i.id === id);
      if (index !== -1) {
        // Merge the existing instance with updated properties
        const mergedInstance = {
          ...this.connection.instances[index],
          ...updatedInstance,
        };
        this.connection.instances[index] = mergedInstance;

        // If the updated instance is the selected one, update connection details
        if (this.selectedInstanceId === id) {
          this.connection.ip = mergedInstance.ip;
          this.connection.port = mergedInstance.port;

          // Clear all backend states when active connection changes
          this._getApiStore().clearAllStates();
        }
      }
    },

    removeInstance(id) {
      this.connection.instances = this.connection.instances.filter((i) => i.id !== id);
      if (this.selectedInstanceId === id) {
        this.selectedInstanceId = null;
      }
    },

    getInstance(id) {
      return this.connection.instances.find((i) => i.id === id);
    },

    getInstanceByNameIpPort(name, ip, port) {
      return this.connection.instances.find(
        (i) => i.name === name && i.ip === ip && i.port === port
      );
    },

    getInstanceColorByIndex(index) {
      return this.instanceColorClasses[index % this.instanceColorClasses.length];
    },

    getInstanceColorById(id) {
      const index = this.connection.instances.findIndex((i) => i.id === id);
      return index !== -1 ? this.getInstanceColorByIndex(index) : 'bg-gray-900/95';
    },

    setSelectedInstanceId(id) {
      this.selectedInstanceId = id;
      const instance = this.getInstance(id);
      const imageStore = useImagetStore();
      if (instance) {
        this.connection.ip = instance.ip;
        this.connection.port = instance.port;

        // Clear all backend states when switching instances
        this._getApiStore().clearAllStates();
        imageStore.clearImageCache();
        console.log('[SettingsStore] Selected instance set to:', id);
      }
    },

    setActiveConnection(ip, port) {
      this.connection.ip = ip;
      this.connection.port = port;

      // Clear all backend states when connection changes
      this._getApiStore().clearAllStates();
    },

    setLanguage(lang) {
      this.language = lang;
    },

    getLanguage() {
      return this.language;
    },

    completeTutorial() {
      this.tutorial.completed = true;
      localStorage.setItem('tutorialCompleted', 'true');
    },

    resetTutorial() {
      this.tutorial.completed = false;
      localStorage.removeItem('tutorialCompleted');
    },

    toggleUnits() {
      this.useImperialUnits = !this.useImperialUnits;
      localStorage.setItem('useImperialUnits', this.useImperialUnits);
    },

    togglePluginsVisibility() {
      this.showPlugins = !this.showPlugins;
    },

    setPhd2ForceCalibration(value) {
      this.guider.phd2ForceCalibration = value;
      localStorage.setItem('phd2ForceCalibration', value);
    },

    setKeepAwakeEnabled(value) {
      this.keepAwakeEnabled = value;
    },

    setHistoryTimeRange(startIndex, endIndex) {
      this.monitorViewSetting.historyTimeRange.startIndex = startIndex;
      this.monitorViewSetting.historyTimeRange.endIndex = endIndex;
    },

    resetHistoryTimeRange() {
      this.monitorViewSetting.historyTimeRange.startIndex = 0;
      this.monitorViewSetting.historyTimeRange.endIndex = null;
    },

    setGraphDataSource1(dataSource) {
      this.monitorViewSetting.graphDataSource1 = dataSource;
    },

    setGraphDataSource2(dataSource) {
      this.monitorViewSetting.graphDataSource2 = dataSource;
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'settings-store',
        storage: localStorage,
        paths: [
          'language',
          'setupCompleted',
          'coordinates',
          'connection',
          'selectedInstanceId',
          'lastCreatedInstanceId',
          'monitorViewSetting',
          'tutorial',
          'showPlugins',
          'guider',
          'keepAwakeEnabled',
          'livestack',
          'useBetaFeatures',
          'camera',
          'monitorViewSetting.graphDataSource1',
          'monitorViewSetting.graphDataSource2',
          'livestack',
          'mount.settingsVisited',
          'tutorial.histogramVisited',
        ],
      },
    ],
  },
});
