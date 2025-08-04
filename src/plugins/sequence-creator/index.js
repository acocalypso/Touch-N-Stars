import { h, markRaw } from 'vue';
import DefaultPluginView from './views/DefaultPluginView.vue';
import SequenceIcons from './components/SequenceIcons.vue';
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
      const pluginPath = currentPlugin && currentPlugin.pluginPath 
        ? currentPlugin.pluginPath 
        : '/sequence-creator';

      // Register route with generic plugin path
      router.addRoute({
        path: pluginPath,
        component: DefaultPluginView,
        meta: { requiresSetup: true },
      });

      // Add navigation item if the plugin is enabled in the store
      if (currentPlugin && currentPlugin.enabled) {
        pluginStore.addNavigationItem({
          pluginId: metadata.id,
          path: pluginPath,
          // Sequence creator icon using SequenceIcons component
          icon: markRaw({
            render() {
              return h(SequenceIcons, {
                name: 'list-with-pencil',
                className: 'w-6 h-6',
              });
            },
          }),
          title: metadata.name,
        });
      }
    } catch (error) {
      console.error('Error installing sequence-creator plugin:', error);
    }
  },
};
