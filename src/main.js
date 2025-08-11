import { createApp } from 'vue';
import App from '@/App.vue';
import router from '@/router';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import './assets/tailwind.css';
import { createHead } from '@unhead/vue';
import i18n from '@/i18n';
import { usePluginStore } from '@/store/pluginStore';
import { timeSync } from '@/utils/timeSync';
import axios from 'axios';

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

// Global axios interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || 'unknown';
    const method = error.config?.method?.toUpperCase() || 'REQUEST';
    
    let message;
    if (status) {
      message = `HTTP ${status}: ${method} ${url} - ${error.message}`;
    } else {
      message = `Network error: ${method} ${url} - ${error.message}`;
    }
    
    console.error(message);
    
    return Promise.reject(error);
  }
);

const app = createApp(App);
app.directive('tooltip', tooltipDirective);

// Initialize i18n with store before mounting
const settingsStore = pinia.state.value.settings;
if (settingsStore && settingsStore.language) {
  i18n.global.locale.value = settingsStore.language;
}

app.use(pinia).use(head).use(i18n).use(router);

// Initialize plugin system
(async () => {
  const pluginStore = usePluginStore(pinia);

  // Store references to app and router in plugin store
  pluginStore.initializeAppAndRouter(app, router);

  // Load and register all available plugins
  await pluginStore.loadAndRegisterPlugins();

  // Initialize all enabled plugins
  await pluginStore.initializeEnabledPlugins();

  // Mount the app after plugins are initialized
  app.mount('#app');

  // Initialize time synchronization after app is mounted and stores are ready
  setTimeout(async () => {
    try {
      await timeSync.initialize();
    } catch (error) {
      console.warn('Time sync initialization failed, will retry later:', error);
    }
  }, 1000);
})();
