// Import your icon component here
// import YourPluginIcon from './components/YourPluginIcon.vue';
import { h, markRaw } from 'vue';
import StellariumLandscapeCreator from './views/StellariumLandscapeCreator.vue';
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
      component: StellariumLandscapeCreator,
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
            // Panorama with a north marker icon.
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
                h('rect', { x: 2.75, y: 6.25, width: 18.5, height: 11.5, rx: 2.5 }),
                h('line', { x1: 12, y1: 6.25, x2: 12, y2: 17.75 }),
                h('path', {
                  d: 'M12 3.5 L13.7 6.2 L10.3 6.2 Z',
                  fill: 'currentColor',
                  stroke: 'none',
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
