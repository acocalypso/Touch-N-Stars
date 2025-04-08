import { defineStore } from 'pinia';
import tutorialContent from '@/assets/tutorial.json';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    language: 'en',
    setupCompleted: localStorage.getItem('setupCompleted') === 'true',
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
    },
    useImperialUnits: localStorage.getItem('useImperialUnits') === 'true',
    tutorial: {
      completed: localStorage.getItem('tutorialCompleted') === 'true',
      steps: tutorialContent.steps,
    },
    framing: {
      useNinaCache: true,
    },
    mount: {
      slewRate: 2,
      reversePrimaryAxis: false,
      reverseSecondaryAxis: false,
    },
    camera: {
      exposureTime: 2,
      gain: 0,
      offset: 0,
      useSolve: false,
      imageScale: 100,
      imageQuality: 90,
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
    },
  }),
  actions: {
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

    setSelectedInstanceId(id) {
      this.selectedInstanceId = id;
      const instance = this.getInstance(id);
      if (instance) {
        this.connection.ip = instance.ip;
        this.connection.port = instance.port;
      }
    },

    setActiveConnection(ip, port) {
      this.connection.ip = ip;
      this.connection.port = port;
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
        ],
      },
    ],
  },
});
