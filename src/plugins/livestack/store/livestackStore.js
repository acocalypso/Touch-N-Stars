import { defineStore } from 'pinia';
import apiService from '@/services/apiService';

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
    status: 'stopped',
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

    async checkImageAvailability() {
      try {
        const counts = await this.loadAllTargetFilterCounts();
        this.initFromCounts(counts);
        if (this.selectedTarget && this.selectedFilter) {
          const t = this.selectedTarget?.label;
          const f = this.selectedFilter?.label;
          return true;
        }
      } catch (error) {
        console.error('Error checking image availability:', error);
        this.initFromCounts([]);
        return false;
      }
    },

    // Fetch all target/filter/count tuples up front
    async loadAllTargetFilterCounts() {
      const result = await apiService.livestackImageAvailable();
      if (!result.Success || !Array.isArray(result.Response)) {
        console.log('✗ API response not successful or Response not array');
        return [];
      }

      const pairs = Array.from(
        new Map(
          result.Response.map(({ Target, Filter }) => ({ target: Target, filter: Filter }))
            .filter(({ target, filter }) => target && filter)
            .map(({ target, filter }) => [`${target}|${filter}`, { target, filter }])
        ).values()
      );

      console.log(`Fetching counts for ${pairs.length} target/filter pairs`);
      const counts = await Promise.all(
        pairs.map(async ({ target, filter }) => {
          try {
            const info = await apiService.livestackImageInfo(target, filter);
            const count =
              info?.Success && info.Response
                ? info.Response.IsMonochrome
                  ? (info.Response.StackCount ?? '--')
                  : `${info.Response.RedStackCount} | ${info.Response.GreenStackCount} | ${info.Response.BlueStackCount}`
                : '--';
            return { target, filter, count };
          } catch (error) {
            console.error('Error fetching livestack image info:', error);
            return { target, filter, count: '--' };
          }
        })
      );

      return counts;
    },

    // Fetch info for a given target/filter using the API (authoritative count)
    async fetchAndUpdateCount(target, filter) {
      const targetLabel = target?.label ?? target;
      const filterLabel = filter?.label ?? filter;
      if (!targetLabel || !filterLabel) return;
      try {
        const info = await apiService.livestackImageInfo(targetLabel, filterLabel);
        if (info && info.Success && info.Response) {
          const count = info.Response.IsMonochrome
            ? (info.Response.StackCount ?? '--')
            : `${info.Response.RedStackCount} | ${info.Response.GreenStackCount} | ${info.Response.BlueStackCount}`;
          this.updateCountForTargetFilter(targetLabel, filterLabel, count);
        } else {
          console.log('livestackImageInfo returned no info for', targetLabel, filterLabel);
        }
      } catch (err) {
        console.error('Error fetching livestack image info:', err);
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
    _defaultFilter() {
      if (this.showFilters) {
        return this.availableFilters[0] || null;
      } else {
        return this.availableFilters.find((f) => f.label === 'RGB') || null;
      }
    },
  },
});
