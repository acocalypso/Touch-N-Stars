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
        console.error('Fehler beim Laden der Favoriten:', error);
      }
    },

    async addFavorite(target) {
      try {
        const response = await apiService.addFavorite(target);
        this.favoriteTargets.push(response.Response); // API gibt den gespeicherten Eintrag zurück
      } catch (error) {
        console.error('Fehler beim Hinzufügen des Favoriten:', error);
      }
    },

    async removeFavorite(id) {
      try {
        await apiService.deleteFavorite(id);
        const favorites = await apiService.getAllFavorites();
        this.favoriteTargets = favorites;
      } catch (error) {
        console.error('Fehler beim Löschen des Favoriten:', error);
      }
    },

    clearFavorites() {
      this.favoriteTargets = [];
    },
  },
});
