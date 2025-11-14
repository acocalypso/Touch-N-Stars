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
    showFilters: false,
    isStacking: false,
  }),
  getters: {
    currentCounter: (state) => {
      if (state.selectedTarget == null) return '--';
      if (state.showFilters) return state.selectedFilter?.count ?? '--';
      return state.selectedTarget?.count ?? '--';
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
      this.selectedTarget = this.availableTargets[0] || null;

      this.availableFilters = this._filtersForTarget(this.selectedTarget?.label);
      this.selectedFilter = this.availableFilters[0] || null;
    },
    selectTarget(targetLabel) {
      const found = this.availableTargets.find((t) => t.label === targetLabel);
      this.selectedTarget =
        found || (this.availableTargets.length ? this.availableTargets[0] : null);

      this.availableFilters = this._filtersForTarget(this.selectedTarget?.label);
      this.selectedFilter = this.availableFilters[0] || null;
    },
    selectFilter(filterLabel) {
      this.selectedFilter = this.availableFilters.find((f) => f.label === filterLabel) || null;
    },

    // Update count for a specific target/filter from WebSocket event
    updateCountForTargetFilter(targetLabel, filterLabel, count) {
      console.log(`🎯 updateCountForTargetFilter: ${targetLabel}/${filterLabel} = ${count}`);

      // Find or create target
      let targetObj = this.availableTargets.find((t) => t.label === targetLabel);
      if (!targetObj) {
        console.log(`   Creating new target: "${targetLabel}"`);
        targetObj = { label: targetLabel, count };
        this.availableTargets.push(targetObj);

        // If no target was selected, select this new one
        if (!this.selectedTarget) {
          this.selectedTarget = targetObj;
        }
      } else {
        console.log(`   Updating target "${targetLabel}": ${targetObj.count} → ${count}`);
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
          this.availableFilters[0] ||
          null;
      }

      console.log(
        `   ✓ Update complete. Targets: ${this.availableTargets.length}, Filters: ${this.availableFilters.length}`
      );
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
      // RBC: toggle the visibility of filters
      this.showFilters = !this.showFilters;
      if (!this.showFilters) {
        this.selectFilter('RGB');
      }
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
  },
});
