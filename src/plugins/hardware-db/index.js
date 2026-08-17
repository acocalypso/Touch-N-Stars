import { markRaw } from 'vue';
import { CircleStackIcon } from '@heroicons/vue/24/outline';
import { usePluginStore } from '@/store/pluginStore';
import metadata from './plugin.json';
import HardwareDbView from './views/hardware-db.vue';

export default {
  metadata,
  install(app, options) {
    const pluginStore = usePluginStore();
    const router = options.router;
    const currentPlugin = pluginStore.plugins.find((plugin) => plugin.id === metadata.id);
    if (!currentPlugin) return;

    router.addRoute({
      path: currentPlugin.pluginPath,
      component: HardwareDbView,
      meta: { requiresSetup: true },
    });

    if (currentPlugin.enabled) {
      pluginStore.addPluginNavigationItem(metadata.id, {
        path: currentPlugin.pluginPath,
        icon: markRaw(CircleStackIcon),
        title: metadata.name,
      });
    }
  },
};
