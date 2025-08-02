import { h, markRaw } from 'vue';
import DefaultPluginView from './views/DefaultPluginView.vue';
import SequenceIcons from './components/SequenceIcons.vue';
import { usePluginStore } from '@/store/pluginStore';
import metadata from './plugin.json';

export default {
  metadata,
  install(app, options) {
    const pluginStore = usePluginStore();
    const router = options.router;

    // Register route
    router.addRoute({
      path: '/sequence-creator',
      component: DefaultPluginView,
      meta: { requiresSetup: true },
    });

    // Register plugin metadata
    pluginStore.registerPlugin(metadata);

    // Add navigation item if the plugin is enabled
    if (metadata.enabled) {
      pluginStore.addNavigationItem({
        pluginId: metadata.id,
        path: '/sequence-creator',
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
  },
};
