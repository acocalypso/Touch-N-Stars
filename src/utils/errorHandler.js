import axios from 'axios';
import { useToastStore } from '@/store/toastStore';
import { createStructuredLog } from './logger';

// Rate limiting cache for toast notifications
const toastCache = new Map();

/**
 * Sets up global axios interceptors for error handling and logging
 */
export function setupErrorHandler() {
  // Request interceptor to track timing
  axios.interceptors.request.use((config) => {
    // Track request start time
    config.metadata = { startTime: performance.now() };
    return config;
  });

  // Response interceptor for error handling
  axios.interceptors.response.use(
    (response) => {
      const url = response.config?.url || 'unknown';
      const method = response.config?.method?.toUpperCase() || 'REQUEST';
      const duration = response.config?.metadata?.startTime
        ? Math.round(performance.now() - response.config.metadata.startTime)
        : null;

      // Check for non-200 HTTP status codes
      if (response.status !== 200) {
        const message = `${method} request failed: ${response.statusText}`;

        createStructuredLog('ERROR', 'HTTP', {
          method,
          url,
          status: response.status,
          message,
          duration,
          extra: { statusText: response.statusText },
        });

        // Show toast for HTTP errors (with rate limiting)
        showToast({
          type: 'error',
          title: `HTTP ${response.status}`,
          message,
          cacheKey: `HTTP_${response.status}_${url}`,
          autoClose: true,
        });
      }

      // Check for API-specific error responses (Success: false or StatusCode >= 400)
      const data = response.data;
      if (data && (data.Success === false || (data.StatusCode && data.StatusCode >= 400))) {
        const statusCode = data.StatusCode || response.status;
        // For HTTP 200 with Success: false, show Response text instead of Error text
        const errorMsg =
          response.status === 200
            ? data.Response || data.Error || 'API call completed'
            : data.Error || data.Response || 'API call failed';

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
            apiType: data.Type,
          },
        });

        // Show toast for HTTP errors or API StatusCode errors (but not for HTTP 200 + StatusCode 200)
        // Skip toasts only for HTTP 200 + StatusCode 200 (successful responses)
        if (response.status >= 400 || statusCode >= 400) {
          showToast({
            type: isRealError ? 'error' : 'info',
            title: isRealError ? `API Error ${statusCode}` : `API Status ${statusCode}`,
            message: errorMsg,
            cacheKey: `API_${statusCode}_${url}_${errorMsg}`,
            autoClose: true,
          });
        }
      } else if (response.status === 200 && duration > 5000) {
        // Log slow requests (over 5 seconds)
        createStructuredLog('WARN', 'PERFORMANCE', {
          method,
          url,
          status: response.status,
          message: `Slow request detected`,
          duration,
          extra: { threshold: 5000 },
        });
      }

      return response;
    },
    (error) => {
      const status = error.response?.status;
      const url = error.config?.url || 'unknown';
      const method = error.config?.method?.toUpperCase() || 'REQUEST';
      const duration = error.config?.metadata?.startTime
        ? Math.round(performance.now() - error.config.metadata.startTime)
        : null;

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
          timeout: error.config?.timeout,
        },
      });

      // Show toast for network and http errors (with rate limiting)
      /*
      showToast({
        type: 'error',
        title: status ? `HTTP ${status}` : 'Network Error',
        message: status ? `${method} request failed` : `Connection failed: ${error.message}`,
        cacheKey: `NETWORK_${status || 'ERROR'}_${url}`,
      });
      */

      // Return a mock error response instead of rejecting
      // This prevents the calling code from crashing
      return {
        data: {
          Response: '',
          Error: message,
          StatusCode: status || 500,
          Success: false,
          Type: 'API',
        },
        status: status || 500,
        config: error.config,
      };
    }
  );
}

/**
 * Shows toast notification with rate limiting
 * @param {Object} options - Toast options
 */
function showToast({ type, title, message, cacheKey }) {
  const toastStore = useToastStore();
  const now = Date.now();

  if (!toastCache.has(cacheKey) || now - toastCache.get(cacheKey) > 5000) {
    toastCache.set(cacheKey, now);
    toastStore.showToast({
      type,
      title,
      message,
    });
  }
}
