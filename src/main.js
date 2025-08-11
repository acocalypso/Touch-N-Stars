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
import { useToastStore } from '@/store/toastStore';

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
  (response) => {
    const url = response.config?.url || 'unknown';
    const method = response.config?.method?.toUpperCase() || 'REQUEST';
    
    // Check for non-200 HTTP status codes
    if (response.status !== 200) {
      const message = `HTTP ${response.status}: ${method} ${url} - ${response.statusText}`;
      console.error(message);
      
      // Show toast for HTTP errors
      const toastStore = useToastStore();
      toastStore.showToast({
        type: 'error',
        title: `HTTP ${response.status}`,
        message: `${method} request failed: ${response.statusText}`,
      });
    }
    
    // Check for API-specific error responses (Success: false or StatusCode >= 400)
    const data = response.data;
    if (data && (
      data.Success === false || 
      (data.StatusCode && data.StatusCode >= 400)
    )) {
      const statusCode = data.StatusCode || response.status;
      // For HTTP 200 with Success: false, show Response text instead of Error text
      const errorMsg = response.status === 200 ? 
        (data.Response || data.Error || 'API call completed') : 
        (data.Error || data.Response || 'API call failed');
      
      console.error(`API Error ${statusCode}: ${method} ${url} - ${errorMsg}`);
      
      // Show toast for API errors
      const toastStore = useToastStore();
      toastStore.showToast({
        type: 'error',
        title: `API Error ${statusCode}`,
        message: errorMsg,
      });
    }
    
    return response;
  },
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
    
    // Show toast for network errors
    const toastStore = useToastStore();
    toastStore.showToast({
      type: 'error',
      title: status ? `HTTP ${status}` : 'Network Error',
      message: status ? `${method} request failed` : `Connection failed: ${error.message}`,
    });
    
    // Return a mock error response instead of rejecting
    // This prevents the calling code from crashing
    return {
      data: {
        Response: '',
        Error: message,
        StatusCode: status || 500,
        Success: false,
        Type: 'API'
      },
      status: status || 500,
      config: error.config
    };
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
