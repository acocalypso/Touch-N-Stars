// Import an SVG component instead of HeroIcons
import BathinovIcon from './components/BathinovIcon.vue';
import BathinovAnalyzerView from './views/BathinovAnalyzerView.vue';
import { usePluginStore } from '@/store/pluginStore';
import metadata from './plugin.json';

export default {
  metadata,
  install(app, options) {
    const pluginStore = usePluginStore();
    const router = options.router;

    // Get current plugin state from store
    const currentPlugin = pluginStore.plugins.find((p) => p.id === metadata.id);
    const pluginPath = currentPlugin ? currentPlugin.pluginPath : '/plugin1';

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
  },
};
