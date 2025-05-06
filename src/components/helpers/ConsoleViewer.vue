<template>
  <div>
    <!-- Trigger -->
    <button
      @click="isModalOpen = true"
      class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md z-10"
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
              <ArrowDownTrayIcon class="w-5 h-5"  :class="showSuccess ? 'text-green-400' : 'text-white'"/>
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
import { CommandLineIcon, XMarkIcon, ArrowDownTrayIcon} from '@heroicons/vue/24/outline';

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
  const logContent = logs.value
  .map(log => `[${log.type.toUpperCase()}] ${log.message}`)
  .join('\n');

  const fileName = `logs-${new Date().toISOString().slice(0, 10)}.log`;

  // Platform detection for native Android vs web
  if (Capacitor.getPlatform() === 'android') {
    // Let user choose directory
    try {
      const dirResult = await FilePicker.pickDirectory();
      if (!dirResult.path) return;

      // Extract clean path from URI and ensure directory exists
      const cleanPath = dirResult.path.replace(/content:\/\/.*?\/tree\/primary%3A/, '');
      const decodedPath = decodeURIComponent(cleanPath).replace(/:/, '/');

      try {
        await Filesystem.mkdir({
          path: decodedPath,
          directory: Directory.ExternalStorage,
          recursive: true,
        });
      } catch (mkdirError) {
        if (mkdirError.message !== 'Directory exists') {
          throw mkdirError;
        }
      }

      await Filesystem.writeFile({
        path: `${decodedPath}/${fileName}`,
        data: logContent,
        directory: Directory.ExternalStorage,
        encoding: 'utf8',
        recursive: true,
        exists: true,
      });

      console.log('Log file saved successfully');
      showSuccess.value = true;
      setTimeout(() => (showSuccess.value = false), 2000);
    } catch (error) {
      console.error('Error saving log file:', error);
    }
  } else {
    // Web browser fallback using file-saver
    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, fileName);
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
}
</script>
