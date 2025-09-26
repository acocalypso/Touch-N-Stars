import { defineStore } from 'pinia';

export const useMountStore = defineStore('mountStore', {
  state: () => ({
    lastDirection: '',
    rate: 1,
    wsIsConnected: false,
    showMountInfo: false,
  }),
  actions: {},
});
