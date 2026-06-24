import { h, markRaw } from 'vue';
import DefaultPluginView from './views/indiControlPanel.vue';
import { usePluginStore } from '@/store/pluginStore';
import metadata from './plugin.json';

export default {
  metadata,
  install(app, options) {
    const pluginStore = usePluginStore();
    const router = options.router;

    // Get current plugin state from store
    const currentPlugin = pluginStore.plugins.find((p) => p.id === metadata.id);

    // Generate sequential plugin path if not already assigned
    let pluginPath;
    if (currentPlugin && currentPlugin.pluginPath) {
      pluginPath = currentPlugin.pluginPath;
    } else {
      const existingPaths = pluginStore.plugins
        .map((p) => p.pluginPath)
        .filter((path) => path && path.match(/^\/plugin\d+$/))
        .map((path) => parseInt(path.replace('/plugin', '')))
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
        // Sliders / control-panel icon
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
                h('line', { x1: 4, y1: 7, x2: 20, y2: 7, stroke: 'currentColor' }),
                h('circle', { cx: 9, cy: 7, r: 2, fill: 'currentColor', stroke: 'none' }),
                h('line', { x1: 4, y1: 12, x2: 20, y2: 12, stroke: 'currentColor' }),
                h('circle', { cx: 15, cy: 12, r: 2, fill: 'currentColor', stroke: 'none' }),
                h('line', { x1: 4, y1: 17, x2: 20, y2: 17, stroke: 'currentColor' }),
                h('circle', { cx: 7, cy: 17, r: 2, fill: 'currentColor', stroke: 'none' }),
              ]
            );
          },
        }),
        title: metadata.name,
      });
    }
  },
};
