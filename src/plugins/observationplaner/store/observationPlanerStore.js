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
    // Session-only preview cache: target._id → blob: URL (not persisted; blob URLs die on reload)
    previewCache: {},
  }),
  actions: {
    resetFilters() {
      this.q = '';
      this.typeFilter = '';
      this.sectorFilter = '';
      this.sortMode = 'maxAltDesc';
      this.onlyAboveHorizon = true;
    },
    setPreview(id, url) {
      if (!id) return;
      this.previewCache[id] = url;
    },
    clearPreview(id) {
      if (!id) return;
      const url = this.previewCache[id];
      if (url && url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }
      delete this.previewCache[id];
    },
    clearAllPreviews() {
      for (const id of Object.keys(this.previewCache)) this.clearPreview(id);
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'observation-planer-store',
        storage: localStorage,
        paths: [
          'q',
          'typeFilter',
          'sectorFilter',
          'sortMode',
          'limit',
          'sampleMinutes',
          'onlyAboveHorizon',
          'useNinaCache',
          'lazyPreviews',
        ],
      },
    ],
  },
});
