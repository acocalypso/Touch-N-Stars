import { defineStore } from 'pinia';
import { loadAllPluginsMetadata, importPlugin } from '@/utils/pluginDiscovery';

export const usePluginStore = defineStore('pluginStore', {
  state: () => ({
    plugins: [],
    navigationItems: [],
    isInitialized: false,
  }),
  actions: {
    registerPlugin(plugin) {
      // Check if plugin already exists
      const existingPluginIndex = this.plugins.findIndex((p) => p.id === plugin.id);
      if (existingPluginIndex >= 0) {
        // Update existing plugin
        this.plugins[existingPluginIndex] = plugin;
      } else {
        // Add new plugin
        this.plugins.push(plugin);
      }
    },

    addNavigationItem(item) {
      // Remove existing navigation item for this plugin if it exists
      this.navigationItems = this.navigationItems.filter(
        (navItem) => navItem.pluginId !== item.pluginId
      );
      // Then add the new one
      this.navigationItems.push(item);
    },

    async togglePlugin(pluginId, enabled) {
      const plugin = this.plugins.find((p) => p.id === pluginId);
      if (!plugin) return;

      plugin.enabled = enabled;

      if (enabled) {
        // Load and initialize the plugin if it's enabled
        await this.initializePlugin(plugin.id);
      } else {
        // If disabled, remove navigation item
        this.navigationItems = this.navigationItems.filter((item) => item.pluginId !== pluginId);
      }
    },

    getEnabledPlugins() {
      return this.plugins.filter((plugin) => plugin.enabled);
    },

    // Initialize app and router references (called from main.js)
    initializeAppAndRouter(app, router) {
      this._app = app;
      this._router = router;
    },

    async loadAndRegisterPlugins() {
      if (this.isInitialized) return;

      try {
        // Load all plugins metadata first
        const pluginsMetadata = await loadAllPluginsMetadata();

        // Store current user settings before updating
        const userSettings = new Map();
        this.plugins.forEach((plugin) => {
          userSettings.set(plugin.id, { enabled: plugin.enabled });
        });

        // Clear plugins array and reload with fresh metadata
        this.plugins = [];

        // Register metadata for all discovered plugins
        console.log('Loading plugins metadata:', pluginsMetadata);
        pluginsMetadata.forEach((metadata, index) => {
          // Check if user had previous settings for this plugin
          const userSetting = userSettings.get(metadata.id);
          const newPlugin = {
            ...metadata,
            // Use user setting if available, otherwise default to false for first load
            enabled: userSetting !== undefined ? userSetting.enabled : false,
            // Generate plugin path based on index
            pluginPath: `/plugin${index + 1}`,
          };

          this.plugins.push(newPlugin);
          console.log('Added plugin:', newPlugin);
        });

        console.log('Final plugins array:', this.plugins);

        this.isInitialized = true;
      } catch (error) {
        console.error('Error loading plugins:', error);
      }
    },

    // Initialize all enabled plugins
    async initializeEnabledPlugins() {
      const enabledPlugins = this.getEnabledPlugins();
      for (const plugin of enabledPlugins) {
        await this.initializePlugin(plugin.id);
      }
    },

    // Initialize a specific plugin by ID
    async initializePlugin(pluginId) {
      if (!this._app || !this._router) {
        console.error('App and router must be initialized before initializing plugins');
        return;
      }

      try {
        const plugin = this.plugins.find((p) => p.id === pluginId);
        if (!plugin) {
          console.warn(`Plugin ${pluginId} not found`);
          return;
        }

        // Skip if the plugin is not enabled
        if (!plugin.enabled) return;

        const pluginModule = await importPlugin(plugin.id);
        if (pluginModule && typeof pluginModule.install === 'function') {
          // Install the plugin
          pluginModule.install(this._app, { router: this._router });
        }
      } catch (error) {
        console.error(`Error initializing plugin ${pluginId}:`, error);
      }
    },

    addPluginNavigationItem(pluginId, navigationItem) {
      // This method is now called by each plugin to add its own navigation item
      if (!navigationItem) return;

      // Add plugin ID to the navigation item
      navigationItem.pluginId = pluginId;

      // Add the navigation item
      this.addNavigationItem(navigationItem);
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'plugin-store',
        storage: localStorage,
        paths: ['plugins', 'isInitialized'],
      },
    ],
  },
});
