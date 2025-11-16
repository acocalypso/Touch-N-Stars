import { defineStore } from 'pinia';
import apiService from '@/services/apiService';

export const useFavTargetStore = defineStore('favTarget', {
  state: () => ({
    favoriteTargets: [],
  }),

  actions: {
    async loadFavorites() {
      try {
        const favorites = await apiService.getAllFavorites();
        this.favoriteTargets = favorites;
        console.log(favorites);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    },

    async addFavorite(target) {
      try {
        const response = await apiService.addFavorite(target);
        this.favoriteTargets.push(response.Response); // API gibt den gespeicherten Eintrag zurück
      } catch (error) {
        console.error('Error adding favorite:', error);
      }
    },

    async removeFavorite(id) {
      try {
        await apiService.deleteFavorite(id);
        const favorites = await apiService.getAllFavorites();
        this.favoriteTargets = favorites;
      } catch (error) {
        console.error('Error deleting favorite:', error);
      }
    },

    clearFavorites() {
      this.favoriteTargets = [];
    },
  },
});
