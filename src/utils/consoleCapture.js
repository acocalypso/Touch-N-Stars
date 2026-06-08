import { ref } from 'vue';

// Shared reactive log storage for console messages
export const consoleLogs = ref([]);

function getCircularReplacer() {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Zirkulär]';
      seen.add(value);
    }
    return value;
  };
}

function safeToString(arg) {
  try {
    if (arg instanceof Error) {
      return JSON.stringify(
        {
          name: arg.name,
          message: arg.message,
          stack: arg.stack,
          cause:
            arg.cause && typeof arg.cause === 'object'
              ? {
                  name: arg.cause.name,
                  message: arg.cause.message,
                }
              : arg.cause,
          status: arg.status,
          response: arg.response
            ? {
                status: arg.response.status,
                statusText: arg.response.statusText,
                data: arg.response.data,
              }
            : undefined,
        },
        getCircularReplacer(),
        2
      );
    }

    if (
      arg &&
      typeof arg === 'object' &&
      typeof arg.name === 'string' &&
      typeof arg.message === 'string' &&
      typeof arg.stack === 'string'
    ) {
      return JSON.stringify(
        {
          name: arg.name,
          message: arg.message,
          stack: arg.stack,
          status: arg.status,
          response: arg.response
            ? {
                status: arg.response.status,
                statusText: arg.response.statusText,
                data: arg.response.data,
              }
            : undefined,
        },
        getCircularReplacer(),
        2
      );
    }

    if (typeof arg === 'object') {
      return JSON.stringify(arg, getCircularReplacer(), 2);
    }
    return String(arg);
  } catch (e) {
    return '[Unserialisierbares Objekt]';
  }
}

// Patch console.* only once and push messages into consoleLogs
export function ensureConsolePatched() {
  if (window.__tnsConsolePatched) return consoleLogs;
  window.__tnsConsolePatched = true;

  const types = ['log', 'warn', 'error', 'info', 'debug'];
  const originalConsole = {};

  types.forEach((type) => {
    originalConsole[type] = console[type];
    console[type] = (...args) => {
      try {
        // Call original console method to preserve default behavior
        originalConsole[type](...args);
      } catch (e) {
        // In case calling original fails in some environments, ignore
      }
      consoleLogs.value.push({
        type,
        message: args.map(safeToString).join(' '),
        ts: Date.now(),
      });
    };
  });

  return consoleLogs;
}

export function getConsoleLogs() {
  return consoleLogs.value;
}
