import { defineStore } from 'pinia';

export const useObservationPlanerStore = defineStore('observationPlanerStore', {
  state: () => ({
    q: '',
    typeFilter: '',
    sectorFilter: '',
    sortMode: 'maxAltDesc',
    limit: 20,
    sampleMinutes: 5,
    onlyAboveHorizon: true,
    useNinaCache: true,
    lazyPreviews: true,
  }),
  actions: {
    resetFilters() {
      this.q = '';
      this.typeFilter = '';
      this.sectorFilter = '';
      this.sortMode = 'maxAltDesc';
      this.onlyAboveHorizon = true;
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'observation-planer-store',
        storage: localStorage,
      },
    ],
  },
});
