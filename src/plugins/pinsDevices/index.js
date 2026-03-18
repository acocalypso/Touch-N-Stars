// Import your icon component here
// import YourPluginIcon from './components/YourPluginIcon.vue';
import { h, markRaw } from 'vue';
import DefaultPluginView from './views/pinsDevices.vue';
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
        // Powerbox icon - power distribution unit
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
                // Main powerbox body
                h('rect', {
                  x: 3,
                  y: 2,
                  width: 18,
                  height: 20,
                  rx: 2,
                  stroke: 'currentColor',
                  'stroke-width': '1.5',
                  fill: 'none',
                }),
                // Power button indicator
                h('circle', {
                  cx: 12,
                  cy: 5,
                  r: 1.5,
                  fill: 'currentColor',
                }),
                // Port indicators (left side)
                h('circle', {
                  cx: 6,
                  cy: 10,
                  r: 1,
                  fill: 'currentColor',
                }),
                h('circle', {
                  cx: 6,
                  cy: 14,
                  r: 1,
                  fill: 'currentColor',
                }),
                h('circle', {
                  cx: 6,
                  cy: 18,
                  r: 1,
                  fill: 'currentColor',
                }),
                // Port indicators (right side)
                h('circle', {
                  cx: 18,
                  cy: 10,
                  r: 1,
                  fill: 'currentColor',
                }),
                h('circle', {
                  cx: 18,
                  cy: 14,
                  r: 1,
                  fill: 'currentColor',
                }),
                h('circle', {
                  cx: 18,
                  cy: 18,
                  r: 1,
                  fill: 'currentColor',
                }),
              ]
            );
          },
        }),
        title: metadata.name,
      });
    }
  },
};
