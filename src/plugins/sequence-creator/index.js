// Import your icon component here
// import YourPluginIcon from './components/YourPluginIcon.vue';
import { h, markRaw } from 'vue';
import DefaultPluginView from './views/DefaultPluginView.vue';
import { usePluginStore } from '@/store/pluginStore';
import metadata from './plugin.json';

export default {
  metadata,
  install(app, options) {
    const pluginStore = usePluginStore();
    const router = options.router;

    // Register route
    router.addRoute({
      path: '/sequence-creator',
      component: DefaultPluginView,
      meta: { requiresSetup: true },
    });

    // Register plugin metadata
    pluginStore.registerPlugin(metadata);

    // Add navigation item if the plugin is enabled
    if (metadata.enabled) {
      pluginStore.addNavigationItem({
        pluginId: metadata.id,
        path: '/sequence-creator',
        // Custom sequence creator icon
        icon: markRaw({
          render() {
            return h(
              'svg',
              {
                width: '48',
                height: '48',
                viewBox: '0 0 48 48',
                fill: 'none',
                xmlns: 'http://www.w3.org/2000/svg',
                class: 'w-6 h-6', // Tailwind classes to size it appropriately for navigation
              },
              [
                // Paper background
                h('rect', {
                  x: '8',
                  y: '8',
                  width: '32',
                  height: '36',
                  rx: '4',
                  fill: '#f3f4f6',
                  stroke: '#ccc',
                  'stroke-width': '2',
                }),
                // Pencil body
                h('rect', {
                  x: '28',
                  y: '32',
                  width: '10',
                  height: '4',
                  rx: '2',
                  transform: 'rotate(-45 28 32)',
                  fill: '#ffbb44',
                  stroke: '#b8822b',
                  'stroke-width': '1',
                }),
                // Pencil tip
                h('polygon', {
                  points: '36,28 38,30 34,34 32,32',
                  fill: '#4a4a4a',
                }),
                // Pencil eraser
                h('rect', {
                  x: '36',
                  y: '26',
                  width: '3',
                  height: '4',
                  rx: '1',
                  transform: 'rotate(-45 36 26)',
                  fill: '#ed6e6e',
                  stroke: '#b04a4a',
                  'stroke-width': '1',
                }),
                // Paper lines
                h('rect', {
                  x: '14',
                  y: '18',
                  width: '20',
                  height: '2',
                  rx: '1',
                  fill: '#d1d5db',
                }),
                h('rect', {
                  x: '14',
                  y: '24',
                  width: '12',
                  height: '2',
                  rx: '1',
                  fill: '#d1d5db',
                }),
                h('rect', {
                  x: '14',
                  y: '30',
                  width: '16',
                  height: '2',
                  rx: '1',
                  fill: '#d1d5db',
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
