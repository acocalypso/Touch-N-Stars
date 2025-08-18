<template>
  <div>
    <!-- Trigger -->
    <button
      @click="isModalOpen = true"
      class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md z-50"
    >
      <CommandLineIcon class="w-6 h-6 text-white" />
    </button>

    <!-- Modal using shared Modal component -->
    <Modal :show="isModalOpen" @close="isModalOpen = false" z-index="z-50">
      <template #header>
        <div class="flex justify-between items-center w-full">
          <h2 class="text-2xl font-bold">Debug Console</h2>
          <button
            @click="downloadLogs"
            class="text-white hover:text-cyan-300 text-sm border border-cyan-500 px-4 py-2 rounded flex items-center gap-2"
          >
            <ArrowDownTrayIcon
              class="w-5 h-5"
              :class="showSuccess ? 'text-green-400' : 'text-white'"
            />
            <span>Download</span>
          </button>
        </div>
      </template>

      <template #body>
        <div
          class="space-y-1 text-sm font-mono bg-gray-900 rounded p-4 border border-gray-700 max-h-[60vh] overflow-y-auto scrollbar-thin"
        >
          <div
            v-for="(log, index) in logs"
            :key="index"
            :class="getClassForType(log.type)"
            class="whitespace-pre-wrap"
          >
            [{{ log.type.toUpperCase() }}] {{ log.message }}
          </div>
          <div v-if="logs.length === 0" class="text-gray-400 text-center py-4">
            No console logs yet...
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { CommandLineIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline';
import Modal from './Modal.vue';
import { downloadLogs as downloadLogsHelper } from '@/utils/logDownloader';

const isModalOpen = ref(false);
const logs = ref([]);
const showSuccess = ref(false);

// Rate limiting cache for duplicate console messages
const consoleCache = new Map();

function safeToString(arg) {
  try {
    if (typeof arg === 'object') {
      return JSON.stringify(arg, getCircularReplacer(), 2);
    } else {
      return String(arg);
    }
  } catch (e) {
    return '[Unserialisierbares Objekt]';
  }
}

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

async function downloadLogs() {
  // Convert console logs to the format expected by the helper
  const formattedLogs = logs.value.map((log) => ({
    timestamp: new Date().toISOString(), // Since console logs don't have timestamps, use current time
    level: log.type.toUpperCase(),
    message: log.message,
  }));

  // Simple formatter for console logs (no actual timestamp to format)
  const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleString();

  const success = await downloadLogsHelper(formattedLogs, formatTimestamp, {
    filePrefix: 'console-logs',
    folderName: 'TNS-Console-Logs',
  });

  if (success) {
    showSuccess.value = true;
    setTimeout(() => (showSuccess.value = false), 2000);
  }
}
function getClassForType(type) {
  switch (type) {
    case 'log':
      return 'text-green-400';
    case 'warn':
      return 'text-yellow-300';
    case 'error':
      return 'text-red-400';
    case 'info':
      return 'text-cyan-300';
    case 'debug':
      return 'text-gray-400';
    default:
      return '';
  }
}

if (!window.__consoleViewerPatched) {
  window.__consoleViewerPatched = true;
  const types = ['log', 'warn', 'error', 'info', 'debug'];
  const originalConsole = {};

  types.forEach((type) => {
    originalConsole[type] = console[type];

    console[type] = (...args) => {
      originalConsole[type](...args);

      const message = args.map(safeToString).join(' ');

      // Filter out specific Vue warnings that are false positives
      if (message.includes('Runtime directive used on component with non-element root node')) {
        return; // Don't add this message to logs
      }

      // Rate limiting for duplicate console messages
      const cacheKey = `${type}:${message}`;
      const now = Date.now();

      if (consoleCache.has(cacheKey)) {
        const lastLogged = consoleCache.get(cacheKey);
        // Skip if same message was logged within last 3 seconds
        if (now - lastLogged < 3000) {
          return;
        }
      }

      // Update cache
      consoleCache.set(cacheKey, now);

      // Clean up old entries (older than 15 seconds)
      setTimeout(() => {
        for (const [key, timestamp] of consoleCache.entries()) {
          if (now - timestamp > 15000) {
            consoleCache.delete(key);
          }
        }
      }, 15000);

      logs.value.push({
        type,
        message,
      });
    };
  });

  // Patch WebSocket to catch connection errors
  const OriginalWebSocket = window.WebSocket;
  window.WebSocket = function (url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);

    ws.addEventListener('error', () => {
      logs.value.push({
        type: 'error',
        message: `WebSocket error: ${url} - Connection failed`,
      });
    });

    return ws;
  };
}
</script>
