import { AdjustmentsHorizontalIcon } from '@heroicons/vue/24/outline';
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

    // Register plugin metadata
    pluginStore.registerPlugin(metadata);

    // Add navigation item if the plugin is enabled
    if (metadata.enabled) {
      pluginStore.addNavigationItem({
        pluginId: metadata.id,
        path: '/bathinov-analyzer',
        icon: AdjustmentsHorizontalIcon,
        title: metadata.name,
      });
    }
  },
};
