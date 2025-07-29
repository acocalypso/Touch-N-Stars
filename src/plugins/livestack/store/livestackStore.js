import { defineStore } from 'pinia';

export const useLivestackStore = defineStore('livestackStore', {
  state: () => ({
    selectedFilter: [],
  }),
  actions: {},
});
