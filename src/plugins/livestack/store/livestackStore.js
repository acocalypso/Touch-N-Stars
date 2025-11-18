import { defineStore } from 'pinia';

export const useLivestackStore = defineStore('livestackStore', {
  state: () => ({
    availableImages: [],
    availableTargets: [],
    availableFilters: [],
    selectedFilter: null,
    selectedTarget: null,
    currentImageUrl: null,
    lastImageUpdate: null,
    showFilters: true,
    isStacking: false,
  }),
  getters: {
    currentCounter: (state) => {
      if (state.selectedTarget == null) return '--';
      return state.selectedFilter?.count ?? '--';
    },
  },
  actions: {
    initFromCounts(counts = []) {
      const normalized = Array.isArray(counts)
        ? counts.filter((c) => c && c.target && c.filter)
        : [];

      this.availableImages = normalized;

      const targetsMap = new Map();
      normalized.forEach(({ target, count }) => {
        if (!targetsMap.has(target)) {
          targetsMap.set(target, { label: target, count });
        }
      });
      this.availableTargets = Array.from(targetsMap.values());
      if (this.selectedTarget == null) {
        this.selectedTarget = this.availableTargets[0] || null;
      }

      this.availableFilters = this._filtersForTarget(this.selectedTarget?.label);
      if (this.availableFilters.find((f) => f.label === this.selectedFilter?.label) == null) {
        this.selectedFilter = this._defaultFilter();
      }
    },
    selectTarget(targetLabel) {
      const found = this.availableTargets.find((t) => t.label === targetLabel);
      this.selectedTarget =
        found || (this.availableTargets.length ? this.availableTargets[0] : null);

      this.availableFilters = this._filtersForTarget(this.selectedTarget?.label);
      this.selectedFilter = this._defaultFilter();
    },
    selectFilter(filterLabel) {
      this.selectedFilter = this.availableFilters.find((f) => f.label === filterLabel) || null;
    },

    // Update count for a specific target/filter from WebSocket event
    updateCountForTargetFilter(targetLabel, filterLabel, count) {
      // Find or create target
      let targetObj = this.availableTargets.find((t) => t.label === targetLabel);
      if (!targetObj) {
        targetObj = { label: targetLabel, count };
        this.availableTargets.push(targetObj);

        // If no target was selected, select this new one
        if (!this.selectedTarget) {
          this.selectedTarget = targetObj;
        }
      } else {
        targetObj.count = count;
      }

      // Update or append the underlying tuple
      let tuple = this.availableImages.find(
        (img) => img.target === targetLabel && img.filter === filterLabel
      );
      if (!tuple) {
        tuple = { target: targetLabel, filter: filterLabel, count };
        this.availableImages.push(tuple);
      } else {
        tuple.count = count;
      }

      // Recompute filters for the selected target
      if (this.selectedTarget?.label === targetLabel) {
        this.availableFilters = this._filtersForTarget(targetLabel);
        this.selectedFilter =
          this.availableFilters.find((f) => f.label === this.selectedFilter?.label) ||
          this._defaultFilter();
      }
    },
    setCurrentImageUrl(imageUrl, target = null, filter = null) {
      // Clean up previous image URL if it exists
      if (this.currentImageUrl) {
        URL.revokeObjectURL(this.currentImageUrl);
      }
      this.currentImageUrl = imageUrl;
      this.currentImageTarget = target;
      this.currentImageFilter = filter;
      this.lastImageUpdate = new Date().toISOString();
    },
    clearCurrentImageUrl() {
      if (this.currentImageUrl) {
        URL.revokeObjectURL(this.currentImageUrl);
      }
      this.currentImageUrl = null;
      this.currentImageTarget = null;
      this.currentImageFilter = null;
      this.lastImageUpdate = null;
    },
    shouldReloadImage(target, filter) {
      // Reload if no image cached or target/filter changed
      return (
        !this.currentImageUrl ||
        this.currentImageTarget !== target ||
        this.currentImageFilter !== filter
      );
    },
    forceReloadImage() {
      // Force reload even if cached - used for websocket updates
      return true;
    },
    toogleShowFilters() {
      this.showFilters = !this.showFilters;
      this.selectedFilter = this._defaultFilter();
    },

    // Collect filters for a given target from the current tuples
    _filtersForTarget(targetLabel) {
      if (!targetLabel) return [];

      const filtersMap = new Map();
      this.availableImages
        .filter((img) => img.target === targetLabel)
        .forEach(({ filter, count }) => {
          if (filter && !filtersMap.has(filter)) {
            filtersMap.set(filter, { label: filter, count });
          }
        });

      return Array.from(filtersMap.values());
    },
    _defaultFilter() {
      if (this.showFilters) {
        return this.availableFilters[0] || null;
      } else {
        return this.availableFilters.find((f) => f.label === 'RGB') || null;
      }
    },
  },
});
