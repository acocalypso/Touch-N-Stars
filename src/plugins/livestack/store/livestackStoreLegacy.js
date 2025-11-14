import { defineStore } from 'pinia';

export const useLivestackStoreLegacy = defineStore('livestackStoreLegacy', {
  state: () => ({
    selectedFilter: [],
    selectedTarget: null,
    currentImageUrl: null,
    lastImageUpdate: null,
    currentImageTarget: null,
    currentImageFilter: null,
  }),
  actions: {
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
  },
});
