import { showLocationSyncModal } from '@/utils/locationSyncUtils'; // eslint-disable-line no-unused-vars
import { defineStore } from 'pinia';

export const useFilterStore = defineStore('filterStore', {
  state: () => ({
    wsIsConnected: false,
    filterChange: false,
    message: '',
    filterName: '',
    showFilterwheelInfo: false,
  }),
  actions: {},
});
