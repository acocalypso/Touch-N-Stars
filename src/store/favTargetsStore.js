import { defineStore } from 'pinia';

export const useFavTargetStore = defineStore('favTarget', {
  state: () => ({
    favoriteTargets: [], // { name, ra, dec }
  }),

  actions: {
    addFavorite(target) {
      this.favoriteTargets.push({
        name: target.name,
        ra: target.ra,
        dec: target.dec,
        rotation: target.rotation,
      });
    },
    removeFavorite(name) {
      this.favoriteTargets = this.favoriteTargets.filter((t) => t.name !== name);
    },
    clearFavorites() {
      this.favoriteTargets = [];
    },
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'settings',
        storage: localStorage,
      },
    ],
  },
});
