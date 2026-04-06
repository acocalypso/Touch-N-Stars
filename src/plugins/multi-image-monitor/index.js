import { h, markRaw } from 'vue';
import { usePluginStore } from '@/store/pluginStore';
import { useImageMonitorStore } from './store/imageMonitorStore';
import metadata from './plugin.json';

const multiCameraIcon = markRaw({
  render() {
    return h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        fill: 'none',
        viewBox: '0 0 24 24',
        'stroke-width': '1.5',
        stroke: 'currentColor',
        class: 'w-6 h-6',
      },
      [
        // Background camera — top-right, 68% size, clearly visible
        h('g', { opacity: '0.55', transform: 'translate(5.5, -1.5) scale(0.68)' }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            d: 'M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z',
          }),
        ]),
        // Foreground camera — bottom-left, 80% size, full opacity
        h('g', { transform: 'translate(-1.5, 3.5) scale(0.80)' }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            d: 'M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z',
          }),
        ]),
      ]
    );
  },
});

export default {
  metadata,
  install(app, options) {
    const pluginStore = usePluginStore();
    const imageStore = useImageMonitorStore();
    const router = options.router;

    const currentPlugin = pluginStore.plugins.find((p) => p.id === metadata.id);
    const pluginPath = currentPlugin ? currentPlugin.pluginPath : '/plugin12';

    // Only ONE route for the whole plugin
    router.addRoute({
      path: pluginPath,
      name: `plugin-${metadata.id}-main`,
      component: () => import('./views/MonitorMain.vue'),
    });

    // Only ONE sidebar icon (Dashboard)
    pluginStore.addNavigationItem({
      pluginId: metadata.id,
      path: pluginPath,
      icon: multiCameraIcon,
      title: 'Monitor Dashboard',
    });

    // Load cams from storage
    imageStore.loadFromLocalStorage();
  },
};
