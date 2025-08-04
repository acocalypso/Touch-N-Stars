// Import an SVG component instead of HeroIcons
import BathinovIcon from './components/BathinovIcon.vue';
import BathinovAnalyzerView from './views/BathinovAnalyzerView.vue';
import { usePluginStore } from '@/store/pluginStore';
import metadata from './plugin.json';

export default {
  metadata,
  install(app, options) {
    try {
      const pluginStore = usePluginStore();
      const router = options.router;

      // Ensure router is available
      if (!router) {
        console.error('Router not available for plugin installation');
        return;
      }

      // Get current plugin state from store
      const currentPlugin = pluginStore.plugins.find((p) => p.id === metadata.id);

      // Use a unique fallback path for this plugin if not found in store
      const pluginPath =
        currentPlugin && currentPlugin.pluginPath ? currentPlugin.pluginPath : '/bathinov-analyzer';

      // Register route with generic plugin path
      router.addRoute({
        path: pluginPath,
        component: BathinovAnalyzerView,
        meta: { requiresSetup: true },
      });

      // Add navigation item if the plugin is enabled in the store
      if (currentPlugin && currentPlugin.enabled) {
        pluginStore.addNavigationItem({
          pluginId: metadata.id,
          path: pluginPath,
          icon: BathinovIcon, // Use the SVG component as the icon
          title: metadata.name,
        });
      }
    } catch (error) {
      console.error('Error installing bathinov-analyzer plugin:', error);
    }
  },
};
