import { defineStore } from 'pinia';
import apiService from '@/services/apiService';

export const useHocusFocusStore = defineStore('hocusfocus', {
  state: () => ({
    // Connection status
    cameraConnected: false,
    focuserConnected: false,
    error: null,
    isLoading: false,

    // Detailed AutoFocus analysis state
    isCancelling: false,

    // Star Annotator Options state
    starAnnotatorOptions: null,
    isLoadingOptions: false,
    optionsError: null,

    // Star Detection Options state
    starDetectionOptions: null,
    isLoadingDetectionOptions: false,
    detectionOptionsError: null,

    // Plugin Info
    pluginInfo: {
      name: 'HocusFocus',
      version: '',
      description:
        'Improved Star Detection, Star Annotation, Auto Focus, and Tilt Correction for NINA',
      installed: false,
    },
  }),

  actions: {
    // Initialize store
    async initialize() {
      try {
        this.isLoading = true;
        this.error = null;
        // Fetch equipment status on initialization
        await this.fetchEquipmentStatus();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.isLoading = false;
      }
    },

    // Fetch equipment connection status
    async fetchEquipmentStatus() {
      try {
        // Try to get camera info which includes connection status
        const cameraInfo = await apiService.cameraAction('info');
        this.cameraConnected =
          cameraInfo?.Response?.Connected || cameraInfo?.data?.Connected || false;
      } catch (err) {
        console.warn('Failed to fetch camera status:', err);
        this.cameraConnected = false;
      }

      try {
        // Try to get focuser info which includes connection status
        const focuserInfo = await apiService.focusAction('info');
        this.focuserConnected =
          focuserInfo?.Response?.Connected || focuserInfo?.data?.Connected || false;
      } catch (err) {
        console.warn('Failed to fetch focuser status:', err);
        this.focuserConnected = false;
      }
    },

    // Load Star Annotator Options
    async loadStarAnnotatorOptions() {
      try {
        this.isLoadingOptions = true;
        this.optionsError = null;
        const options = await apiService.hocusfocus.getStarAnnotatorOptions();
        this.starAnnotatorOptions = options;
        return options;
      } catch (err) {
        this.optionsError = err.message || 'Failed to load Star Annotator options';
        console.error('Error loading Star Annotator options:', err);
        throw err;
      } finally {
        this.isLoadingOptions = false;
      }
    },

    // Save Star Annotator Options
    async saveStarAnnotatorOptions(options) {
      try {
        this.isLoadingOptions = true;
        this.optionsError = null;
        const response = await apiService.hocusfocus.setStarAnnotatorOptions(options);
        // Reload options to sync with backend
        await this.loadStarAnnotatorOptions();
        return response;
      } catch (err) {
        this.optionsError = err.message || 'Failed to save Star Annotator options';
        console.error('Error saving Star Annotator options:', err);
        throw err;
      } finally {
        this.isLoadingOptions = false;
      }
    },

    // Reset Star Annotator Options to defaults
    async resetStarAnnotatorDefaults() {
      try {
        this.isLoadingOptions = true;
        this.optionsError = null;
        const response = await apiService.hocusfocus.resetStarAnnotatorDefaults();
        // Reload options to sync with backend
        await this.loadStarAnnotatorOptions();
        return response;
      } catch (err) {
        this.optionsError = err.message || 'Failed to reset Star Annotator options';
        console.error('Error resetting Star Annotator options:', err);
        throw err;
      } finally {
        this.isLoadingOptions = false;
      }
    },

    // Clear error message
    clearError() {
      this.error = null;
    },

    // Clear options error message
    clearOptionsError() {
      this.optionsError = null;
    },

    // Load Star Detection Options
    async loadStarDetectionOptions() {
      try {
        this.isLoadingDetectionOptions = true;
        this.detectionOptionsError = null;
        const options = await apiService.hocusfocus.getStarDetectionOptions();
        this.starDetectionOptions = options;
        return options;
      } catch (err) {
        this.detectionOptionsError = err.message || 'Failed to load Star Detection options';
        console.error('Error loading Star Detection options:', err);
        throw err;
      } finally {
        this.isLoadingDetectionOptions = false;
      }
    },

    // Save Star Detection Options
    async saveStarDetectionOptions(options) {
      try {
        this.isLoadingDetectionOptions = true;
        this.detectionOptionsError = null;
        const response = await apiService.hocusfocus.setStarDetectionOptions(options);
        // Reload options to sync with backend
        await this.loadStarDetectionOptions();
        return response;
      } catch (err) {
        this.detectionOptionsError = err.message || 'Failed to save Star Detection options';
        console.error('Error saving Star Detection options:', err);
        throw err;
      } finally {
        this.isLoadingDetectionOptions = false;
      }
    },

    // Reset Star Detection Options to defaults
    async resetStarDetectionDefaults() {
      try {
        this.isLoadingDetectionOptions = true;
        this.detectionOptionsError = null;
        const response = await apiService.hocusfocus.resetStarDetectionDefaults();
        // Reload options to sync with backend
        await this.loadStarDetectionOptions();
        return response;
      } catch (err) {
        this.detectionOptionsError = err.message || 'Failed to reset Star Detection options';
        console.error('Error resetting Star Detection options:', err);
        throw err;
      } finally {
        this.isLoadingDetectionOptions = false;
      }
    },

    // Clear detection options error message
    clearDetectionOptionsError() {
      this.detectionOptionsError = null;
    },
  },
});
