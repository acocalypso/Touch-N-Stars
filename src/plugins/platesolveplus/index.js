// Import your icon component here
// import psplus from './components/icon_psplus.svg';
import { h, markRaw } from 'vue';
import DefaultPluginView from './views/platesolveplus.vue';
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
      // Find the next available plugin number
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
        // Replace with your custom icon component when available
        icon: markRaw({
          render() {
            return h(
              'svg',
              {
                xmlns: 'http://www.w3.org/2000/svg',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': '1.6',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
              },
              [
                // Outer frame
                h('rect', { x: 2.5, y: 2.5, width: 19, height: 19, rx: 0.8 }),

                // Connection lines
                h('path', {
                  d: 'M12 5.2 L6.6 9.6 L6.6 16.8 L12 19.0 L18.0 15.9 L18.0 7.4 L12 5.2 Z',
                }),
                h('path', { d: 'M12 5.2 L18.0 7.4' }),
                h('path', { d: 'M12 19.0 L12 15.0' }),

                // Central target
                h('circle', { cx: 12, cy: 12, r: 3.2 }),

                // Nodes
                h('circle', { cx: 12, cy: 5.2, r: 1.4 }),
                h('circle', { cx: 18.0, cy: 7.4, r: 1.4 }),
                h('circle', { cx: 6.6, cy: 9.6, r: 1.4 }),
                h('circle', { cx: 6.6, cy: 16.8, r: 1.4 }),
                h('circle', { cx: 12, cy: 19.0, r: 1.2 }),
                h('circle', { cx: 18.0, cy: 15.9, r: 1.2 }),
              ]
            );
          },
        }),
        title: metadata.name,
      });
    }
  },
};
