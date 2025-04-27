import { defineStore } from 'pinia';

export const usePluginStore = defineStore('pluginStore', {
  state: () => ({
    plugins: [],
    navigationItems: [],
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
    togglePlugin(pluginId, enabled) {
      const plugin = this.plugins.find((p) => p.id === pluginId);
      if (plugin) {
        plugin.enabled = enabled;

        // If disabled, remove navigation item
        if (!enabled) {
          this.navigationItems = this.navigationItems.filter((item) => item.pluginId !== pluginId);
        }
      }
    },
    getEnabledPlugins() {
      return this.plugins.filter((plugin) => plugin.enabled);
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'plugin-store',
        storage: localStorage,
        paths: ['plugins'],
      },
    ],
  },
});
