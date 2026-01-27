// Import your icon component here
// import YourPluginIcon from './components/YourPluginIcon.vue';
import { h, markRaw } from 'vue';
import DefaultPluginView from './views/ObservationPlanner.vue';
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
                fill: 'none',
                viewBox: '0 0 24 24',
                'stroke-width': '1.5',
                stroke: 'currentColor',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
              },
              [
                // === Lens ===
                h('circle', { cx: 11, cy: 11, r: 6 }),

                // === Handle ===
                h('path', { d: 'M15.5 15.5L21 21' }),

                // === Radar scan arcs ===
                h('path', { d: 'M11 5a6 6 0 0 1 6 6' }),
                h('path', { d: 'M11 7a4 4 0 0 1 4 4' }),
                h('path', { d: 'M11 9a2 2 0 0 1 2 2' }),

                // === Crosshair ===
                h('path', { d: 'M11 8.5v5' }),
                h('path', { d: 'M8.5 11h5' }),

                // === Target star ===
                h('path', {
                  d: 'M11 6.8l.6 1.3 1.4.2-1 .95.25 1.4L11 9.95l-1.25.7.25-1.4-1-.95 1.4-.2L11 6.8z',
                }),

                // === External scan spark ===
                h('path', { d: 'M18.3 6.2l.3.9.9.3-.9.3-.3.9-.3-.9-.9-.3.9-.3.3-.9z' }),
              ]
            );
          },
        }),
        title: metadata.name,
      });
    }
  },
};
