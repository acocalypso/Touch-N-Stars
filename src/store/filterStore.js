import { defineStore } from 'pinia';

export const useFilterStore = defineStore('filterStore', {
  state: () => ({
    wsIsConnected: false,
    filterChange: false,
    message: '',
    filterName: '',
  }),
  actions: {},
});
