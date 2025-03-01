import { defineStore } from 'pinia';

export const useStellariumStore = defineStore('stellariumStore', {
  state: () => ({
    stel: null,
    search: {
      RAangle: 0,
      DECangle: 0,
      RAangleString: '',
      DECangleString: '',
    },
  }),
  actions: {},
});
