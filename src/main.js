import { createApp } from 'vue';
import App from '@/App.vue';
import router from '@/router';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import './assets/tailwind.css';
import { createHead } from '@unhead/vue';
import i18n from '@/i18n';
import { usePluginStore } from '@/store/pluginStore';

// Import plugins individually
import weatherStationPlugin from './plugins/weather-station';
const plugins = [weatherStationPlugin];

// Tooltip directive
const tooltipDirective = {
  mounted(el, binding) {
    el.setAttribute('title', binding.value);
    el.style.cursor = 'pointer';
  },
};

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
const head = createHead();

const app = createApp(App);
app.directive('tooltip', tooltipDirective);

// Initialize i18n with store before mounting
const settingsStore = pinia.state.value.settings;
if (settingsStore && settingsStore.language) {
  i18n.global.locale.value = settingsStore.language;
}

app.use(pinia).use(head).use(i18n).use(router);

// Initialize plugins
const pluginStore = usePluginStore(pinia);
plugins.forEach((plugin) => {
  if (plugin && typeof plugin.install === 'function') {
    plugin.install(app, { router });
  }
});

app.mount('#app');
