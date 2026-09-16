import { h, markRaw } from 'vue';
import i18n from '@/i18n';
import TargetSchedulerViewerView from './views/TargetSchedulerViewerView.vue';
import { usePluginStore } from '@/store/pluginStore';
import metadata from './plugin.json';

export default {
  metadata,
  install(app, options) {
    const pluginStore = usePluginStore();
    const router = options.router;

    const currentPlugin = pluginStore.plugins.find((p) => p.id === metadata.id);

    let pluginPath;
    if (currentPlugin && currentPlugin.pluginPath) {
      pluginPath = currentPlugin.pluginPath;
    } else {
      const existingPaths = pluginStore.plugins
        .map((p) => p.pluginPath)
        .filter((path) => path && path.match(/^\/plugin\d+$/))
        .map((path) => parseInt(path.replace('/plugin', ''), 10))
        .sort((a, b) => a - b);

      let nextNumber = 1;
      for (const num of existingPaths) {
        if (num === nextNumber) {
          nextNumber++;
        } else {
          break;
        }
      }

      pluginPath = `/plugin${nextNumber}`;
    }

    router.addRoute({
      path: pluginPath,
      component: TargetSchedulerViewerView,
      meta: { requiresSetup: true },
    });

    if (currentPlugin && currentPlugin.enabled) {
      pluginStore.addNavigationItem({
        pluginId: metadata.id,
        path: pluginPath,
        icon: markRaw({
          render() {
            return h(
              'svg',
              {
                xmlns: 'http://www.w3.org/2000/svg',
                fill: 'none',
                viewBox: '0 0 24 24',
                'stroke-width': '1.5',
                stroke: 'currentColor',
              },
              [
                h('path', {
                  'stroke-linecap': 'round',
                  'stroke-linejoin': 'round',
                  d: 'M9 17.25V21m6-3.75V21m-9-3.75h12M4.5 3h15a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 13.5v-9A1.5 1.5 0 014.5 3z',
                }),
                h('path', {
                  'stroke-linecap': 'round',
                  'stroke-linejoin': 'round',
                  d: 'M7.5 10.5l2.25 2.25 4.5-4.5',
                }),
              ]
            );
          },
        }),
        title: i18n.global.t('plugins.targetSchedulerViewer.title'),
      });
    }
  },
};
