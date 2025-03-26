import { defineStore } from 'pinia';

export const useEquipmentStore = defineStore('equipmentStore', {
  state: () => ({
    availableDevices: {
      camera: [],
      mount: [],
      filter: [],
      focuser: [],
      rotator: [],
      guider: [],
      safety: [],
      flatdevice: [],
      dome: [],
      weather: [],
      switch: [],
    },
  }),
  actions: {},
});
