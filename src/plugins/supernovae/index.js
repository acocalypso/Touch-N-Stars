import { markRaw, h } from 'vue';
import SupernovaeView from './views/SupernovaeView.vue';
import { usePluginStore } from '@/store/pluginStore';
import metadata from './plugin.json';

// Icon: supernova explosion burst — irregular 8-spike starburst
const SupernovaeIcon = markRaw({
  render() {
    return h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        fill: 'currentColor',
      },
      [
        h('path', {
          d: 'M12 2 L13.2 9.8 L18.5 7.4 L14.4 11.4 L21.5 12.8 L14.2 13.2 L16.8 17.8 L12.7 14.4 L10.4 20.9 L10.6 14.1 L4.6 16.3 L9.6 12.5 L3 12.8 L9.7 10.9 L6.7 6.7 L11 9.7 Z',
        }),
      ]
    );
  },
});

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

    router.addRoute({ path: pluginPath, component: SupernovaeView, meta: { requiresSetup: true } });

    if (currentPlugin?.enabled) {
      pluginStore.addNavigationItem({
        pluginId: metadata.id,
        path: pluginPath,
        icon: SupernovaeIcon,
        title: metadata.name,
      });
    }
  },
};
