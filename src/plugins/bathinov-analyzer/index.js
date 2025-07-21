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

    // Register route
    router.addRoute({
      path: '/bathinov-analyzer',
      component: BathinovAnalyzerView,
      meta: { requiresSetup: true },
    });

    // Get current plugin state from store
    const currentPlugin = pluginStore.plugins.find(p => p.id === metadata.id);
    
    // Add navigation item if the plugin is enabled in the store
    if (currentPlugin && currentPlugin.enabled) {
      pluginStore.addNavigationItem({
        pluginId: metadata.id,
        path: '/bathinov-analyzer',
        icon: BathinovIcon, // Use the SVG component as the icon
        title: metadata.name,
      });
    }
  },
};
