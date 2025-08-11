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
  }
};

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
const head = createHead();

// Rate limiting cache for duplicate messages
const errorCache = new Map();
const toastCache = new Map();

// Structured logging function with rate limiting
function createStructuredLog(level, category, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level,
    category: category,
    method: data.method || 'UNKNOWN',
    url: data.url || 'unknown',
    status: data.status,
    message: data.message,
    duration: data.duration,
    userAgent: navigator.userAgent.split(' ').pop(), // Simplified UA
    ...data.extra
  };
  
  // Rate limiting: prevent spam of identical messages
  const cacheKey = `${level}:${category}:${data.method}:${data.url}:${data.status}:${data.message}`;
  const now = Date.now();
  
  if (errorCache.has(cacheKey)) {
    const lastLogged = errorCache.get(cacheKey);
    // Skip if same message was logged within last 5 seconds
    if (now - lastLogged < 5000) {
      return logEntry; // Return entry but don't log
    }
  }
  
  // Update cache and log
  errorCache.set(cacheKey, now);
  
  // Clean up old entries (older than 30 seconds)
  setTimeout(() => {
    for (const [key, timestamp] of errorCache.entries()) {
      if (now - timestamp > 30000) {
        errorCache.delete(key);
      }
    }
  }, 30000);
  
  // Log both structured and human-readable
  console.log(JSON.stringify(logEntry));
  
  return logEntry;
}

// Global axios interceptor for error handling with structured logging
axios.interceptors.request.use((config) => {
  // Track request start time
  config.metadata = { startTime: performance.now() };
  return config;
});

axios.interceptors.response.use(
  (response) => {
    const url = response.config?.url || 'unknown';
    const method = response.config?.method?.toUpperCase() || 'REQUEST';
    const duration = response.config?.metadata?.startTime ? 
      Math.round(performance.now() - response.config.metadata.startTime) : null;
    
    // Check for non-200 HTTP status codes
    if (response.status !== 200) {
      const message = `${method} request failed: ${response.statusText}`;
      
      createStructuredLog('ERROR', 'HTTP', {
        method,
        url,
        status: response.status,
        message,
        duration,
        extra: { statusText: response.statusText }
      });
      
      // Show toast for HTTP errors (with rate limiting)
      const toastStore = useToastStore();
      const toastKey = `HTTP_${response.status}_${url}`;
      const now = Date.now();
      
      if (!toastCache.has(toastKey) || (now - toastCache.get(toastKey)) > 5000) {
        toastCache.set(toastKey, now);
        toastStore.showToast({
          type: 'error',
          title: `HTTP ${response.status}`,
          message,
        });
      }
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
      
      // For HTTP 200 with Success: false, treat as info (API state messages)  
      // Only log as ERROR if HTTP status indicates failure
      const isRealError = response.status >= 400;
      const logLevel = isRealError ? 'ERROR' : 'INFO';
      
      createStructuredLog(logLevel, 'API', {
        method,
        url,
        status: statusCode,
        message: errorMsg,
        duration,
        extra: { 
          httpStatus: response.status,
          apiSuccess: data.Success,
          apiType: data.Type
        }
      });
      
      // Show toast for HTTP errors or API StatusCode errors (but not for HTTP 200 + StatusCode 200)
      // Skip toasts only for HTTP 200 + StatusCode 200 (successful responses)
      if (response.status >= 400 || statusCode >= 400) {
        const toastStore = useToastStore();
        const toastKey = `API_${statusCode}_${url}_${errorMsg}`;
        const now = Date.now();
        
        if (!toastCache.has(toastKey) || (now - toastCache.get(toastKey)) > 5000) {
          toastCache.set(toastKey, now);
          toastStore.showToast({
            type: isRealError ? 'error' : 'info',
            title: isRealError ? `API Error ${statusCode}` : `API Status ${statusCode}`,
            message: errorMsg,
          });
        }
      }
    } else if (response.status === 200 && duration > 5000) {
      // Log slow requests (over 5 seconds)
      createStructuredLog('WARN', 'PERFORMANCE', {
        method,
        url,
        status: response.status,
        message: `Slow request detected`,
        duration,
        extra: { threshold: 5000 }
      });
    }
    
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || 'unknown';
    const method = error.config?.method?.toUpperCase() || 'REQUEST';
    const duration = error.config?.metadata?.startTime ? 
      Math.round(performance.now() - error.config.metadata.startTime) : null;
    
    let message;
    let category = 'NETWORK';
    
    if (status) {
      message = `${method} request failed`;
      category = 'HTTP';
    } else {
      message = `Connection failed: ${error.message}`;
    }
    
    createStructuredLog('ERROR', category, {
      method,
      url,
      status: status || 0,
      message,
      duration,
      extra: { 
        errorCode: error.code,
        errorMessage: error.message,
        timeout: error.config?.timeout
      }
    });
    
    // Show toast for network errors (with rate limiting)
    const toastStore = useToastStore();
    const toastKey = `NETWORK_${status || 'ERROR'}_${url}`;
    const now = Date.now();
    
    if (!toastCache.has(toastKey) || (now - toastCache.get(toastKey)) > 5000) {
      toastCache.set(toastKey, now);
      toastStore.showToast({
        type: 'error',
        title: status ? `HTTP ${status}` : 'Network Error',
        message: status ? `${method} request failed` : `Connection failed: ${error.message}`,
      });
    }
    
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

// Suppress specific Vue warning about runtime directives in browser console
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('Runtime directive used on component with non-element root node')) {
    // Suppress this specific warning as it appears to be a false positive
    return;
  }
  originalWarn.apply(console, args);
};

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
