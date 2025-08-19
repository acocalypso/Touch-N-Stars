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
