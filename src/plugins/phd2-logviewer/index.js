import { markRaw } from 'vue';
import Phd2LogView from './views/Phd2LogView.vue';
import Phd2Icon from './components/Phd2Icon.vue';
import { usePluginStore } from '@/store/pluginStore';
import metadata from './plugin.json';

export default {
  metadata,
  install(app, options) {
    const pluginStore = usePluginStore();
    const router = options.router;

    const currentPlugin = pluginStore.plugins.find((p) => p.id === metadata.id);

    let pluginPath;
    if (currentPlugin?.pluginPath) {
      pluginPath = currentPlugin.pluginPath;
    } else {
      const existingNums = pluginStore.plugins
        .map((p) => p.pluginPath)
        .filter((path) => path?.match(/^\/plugin\d+$/))
        .map((path) => parseInt(path.replace('/plugin', '')))
        .sort((a, b) => a - b);

      let next = 1;
      for (const n of existingNums) {
        if (n === next) next++;
        else break;
      }
      pluginPath = `/plugin${next}`;
    }

    router.addRoute({
      path: pluginPath,
      component: Phd2LogView,
      meta: { requiresSetup: true },
    });

    if (currentPlugin?.enabled) {
      pluginStore.addNavigationItem({
        pluginId: metadata.id,
        path: pluginPath,
        icon: markRaw(Phd2Icon),
        title: metadata.name,
      });
    }
  },
};
