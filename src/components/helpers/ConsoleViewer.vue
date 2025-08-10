<template>
  <div>
    <!-- Trigger -->
    <button
      @click="isModalOpen = true"
      class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md z-50"
    >
      <CommandLineIcon class="w-6 h-6 text-white" />
    </button>

    <!-- Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      @click.self="isModalOpen = false"
    >
      <div
        class="bg-gray-800 text-white p-6 rounded-lg max-w-4xl max-h-[80vh] w-full overflow-y-auto"
        @click.stop
      >
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold">Debug</h2>
          <div class="flex items-center space-x-2">
            <button
              @click="downloadLogs"
              class="text-white hover:text-cyan-300 text-sm border border-cyan-500 px-4 py-1 rounded"
            >
              <ArrowDownTrayIcon
                class="w-5 h-5"
                :class="showSuccess ? 'text-green-400' : 'text-white'"
              />
            </button>
            <button @click="isModalOpen = false" class="text-white hover:text-gray-300">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>
        </div>

        <!-- Logs -->
        <div class="space-y-1 text-sm font-mono bg-gray-900 rounded p-4 border border-gray-700">
          <div
            v-for="(log, index) in logs"
            :key="index"
            :class="getClassForType(log.type)"
            class="whitespace-pre-wrap"
          >
            [{{ log.type.toUpperCase() }}] {{ log.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { CommandLineIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline';
import { downloadLogs as downloadLogsHelper } from '@/utils/logDownloader';

const isModalOpen = ref(false);
const logs = ref([]);
const showSuccess = ref(false);

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
      logs.value.push({
        type,
        message: args.map(safeToString).join(' '),
      });
    };
  });

  // Patch WebSocket to catch connection errors
  const OriginalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    ws.addEventListener('error', (event) => {
      logs.value.push({
        type: 'error',
        message: `WebSocket error: ${url} - Connection failed`,
      });
    });
    
    return ws;
  };

  // Patch fetch to catch network errors
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).catch((error) => {
      logs.value.push({
        type: 'error',
        message: `Fetch error: ${args[0]} - ${error.message}`,
      });
      throw error;
    });
  };

  // Patch XMLHttpRequest to catch network errors
  const OriginalXMLHttpRequest = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXMLHttpRequest();
    const originalOpen = xhr.open;
    let url = '';
    
    xhr.open = function(method, reqUrl, ...rest) {
      url = reqUrl;
      return originalOpen.apply(this, [method, reqUrl, ...rest]);
    };
    
    xhr.addEventListener('error', () => {
      logs.value.push({
        type: 'error',
        message: `XMLHttpRequest error: ${url} - Network request failed`,
      });
    });
    
    return xhr;
  };
}
</script>
