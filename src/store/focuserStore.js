import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

export const useFocuserStore = defineStore('focuserStore', () => {
  const store = apiStore();
  const focuserSettings = ref();

  // Read focuser settings (only PINS)
  async function readSettings() {
    if (!store.isPINS) return;
    if (!store.focuserInfo.Connected) return;
    try {
      const response = await apiService.focusAction('get-settings');
      focuserSettings.value = response.Response;
      console.log('[Focuserstore] Focuser settings: ', response.Response);
    } catch (error) {
      console.error(' [focuserStore] Error fetching focuser settings:', error.message);
    }
  }

  return {
    focuserSettings,
    readSettings,
  };
});
