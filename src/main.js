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
import { setupErrorHandler } from '@/utils/errorHandler';
import { ensureConsolePatched } from '@/utils/consoleCapture';

// Tooltip directive
const tooltipDirective = {
  mounted(el, binding, vnode) {
    // Check if this is a component instance (not a DOM element)
    if (vnode.component) {
      // Find the actual root element of the component
      const rootEl = vnode.component.subTree?.el;
      if (rootEl && typeof rootEl.setAttribute === 'function') {
        rootEl.setAttribute('title', binding.value);
        rootEl.style.cursor = 'pointer';
        return;
      }
    }

    // Handle regular DOM elements
    if (!el || typeof el.setAttribute !== 'function') {
      return; // Silently ignore invalid elements
    }
    el.setAttribute('title', binding.value);
    el.style.cursor = 'pointer';
  },
  updated(el, binding, vnode) {
    // Check if this is a component instance
    if (vnode.component) {
      const rootEl = vnode.component.subTree?.el;
      if (rootEl && typeof rootEl.setAttribute === 'function') {
        rootEl.setAttribute('title', binding.value);
        return;
      }
    }

    // Handle regular DOM elements
    if (!el || typeof el.setAttribute !== 'function') {
      return;
    }
    el.setAttribute('title', binding.value);
  },
};

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
const head = createHead();

// Setup global error handling
setupErrorHandler();

const app = createApp(App);
app.directive('tooltip', tooltipDirective);

// Start capturing console logs as early as possible
try {
  ensureConsolePatched();
} catch (e) {
  /* noop */
}

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
