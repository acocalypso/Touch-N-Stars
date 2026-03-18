// Import your icon component here
import HocusFocusIcon from './components/HocusFocusIcon.vue';
import { markRaw } from 'vue';
import DefaultPluginView from './views/hocusfocus.vue';
import { usePluginStore } from '@/store/pluginStore';
import { useHocusFocusStore } from './store/hocusfocusStore';
import metadata from './plugin.json';

export default {
  metadata,
  install(app, options) {
    // Get stores
    const pluginStore = usePluginStore();
    const hocusFocusStore = useHocusFocusStore();
    const router = options.router;

    // Get current plugin state from store
    const currentPlugin = pluginStore.plugins.find((p) => p.id === metadata.id);

    // Generate sequential plugin path if not already assigned
    let pluginPath;
    if (currentPlugin && currentPlugin.pluginPath) {
      pluginPath = currentPlugin.pluginPath;
    } else {
      // Find the next available plugin number
      const existingPaths = pluginStore.plugins
        .map((p) => p.pluginPath)
        .filter((path) => path && path.match(/^\/plugin\d+$/))
        .map((path) => parseInt(path.replace('/plugin', '')))
        .sort((a, b) => a - b);

      let nextNumber = 1;
      for (const num of existingPaths) {
        if (num === nextNumber) {
          nextNumber++;
        } else {
          break;
        }
      }

      pluginPath = `/plugin${nextNumber}`;
    }

    // Initialize HocusFocus store
    hocusFocusStore.initialize();

    // Register route with generic plugin path
    router.addRoute({
      path: pluginPath,
      component: DefaultPluginView,
      meta: { requiresSetup: true },
    });

    // Expose HocusFocus API to Vue app via globalProperties
    // This makes it accessible via this.$hocusfocus in components
    app.config.globalProperties.$hocusfocus = {
      // Store reference
      store: hocusFocusStore,

      // AutoFocus Status
      get isAutoFocusing() {
        return hocusFocusStore.autoFocusStatus.inProgress;
      },
      get currentFocusPosition() {
        return hocusFocusStore.autoFocusStatus.currentFocuserPosition;
      },
      get targetFocusPosition() {
        return hocusFocusStore.autoFocusStatus.targetFocuserPosition;
      },
      get initialHFR() {
        return hocusFocusStore.autoFocusStatus.initialHFR;
      },
      get finalHFR() {
        return hocusFocusStore.autoFocusStatus.finalHFR;
      },
      get autoFocusProgress() {
        return hocusFocusStore.autoFocusStatus.progress;
      },

      // Operations
      startAutoFocus: (filter) => hocusFocusStore.startAutoFocus(filter),
      stopAutoFocus: () => hocusFocusStore.stopAutoFocus(),
      setFocusPosition: (position) => hocusFocusStore.setFocusPosition(position),

      // Configuration
      getAutoFocusOptions: () => hocusFocusStore.autoFocusOptions,
      updateAutoFocusOptions: (options) => hocusFocusStore.updateAutoFocusOptions(options),
      getStarDetectionOptions: () => hocusFocusStore.starDetectionOptions,
      updateStarDetectionOptions: (options) => hocusFocusStore.updateStarDetectionOptions(options),

      // Data
      getFocusPoints: () => hocusFocusStore.focusPoints,
      getAutoFocusStatus: () => hocusFocusStore.autoFocusStatus,

      // Utilities
      startPolling: (interval) => hocusFocusStore.startPolling(interval),
      stopPolling: () => hocusFocusStore.stopPolling(),
      clearError: () => hocusFocusStore.clearError(),
    };

    // Add navigation item if the plugin is enabled in the store
    if (currentPlugin && currentPlugin.enabled) {
      pluginStore.addNavigationItem({
        pluginId: metadata.id,
        path: pluginPath,
        // Use HocusFocus icon component
        icon: markRaw(HocusFocusIcon),
        title: metadata.name,
      });
    }
  },
};
