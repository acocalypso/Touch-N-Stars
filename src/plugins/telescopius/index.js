// Import your icon component here
// import YourPluginIcon from './components/YourPluginIcon.vue';
import { h, markRaw } from 'vue';
import DefaultPluginView from './views/telescopius.vue';
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
        // Telescopius "T" logo icon
        icon: markRaw({
          render() {
            // Stylized "T" letter for Telescopius
            return h(
              'svg',
              {
                xmlns: 'http://www.w3.org/2000/svg',
                fill: 'currentColor',
                viewBox: '0 0 24 24',
                width: '24',
                height: '24',
              },
              [
                // Main "T" shape
                h('path', {
                  d: 'M4 4h16v3H14v13h-4V7H4V4z',
                  fill: 'currentColor',
                }),
                // Small decorative stars around the T
                h('circle', {
                  cx: '19',
                  cy: '8',
                  r: '1',
                  fill: 'currentColor',
                  opacity: '0.7',
                }),
                h('circle', {
                  cx: '5',
                  cy: '12',
                  r: '0.8',
                  fill: 'currentColor',
                  opacity: '0.7',
                }),
                h('circle', {
                  cx: '18',
                  cy: '18',
                  r: '0.6',
                  fill: 'currentColor',
                  opacity: '0.7',
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
