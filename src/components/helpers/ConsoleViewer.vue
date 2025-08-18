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
import { ref, onMounted } from 'vue';
import { CommandLineIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline';
import { downloadLogs as downloadLogsHelper } from '@/utils/logDownloader';
import { ensureConsolePatched, consoleLogs } from '@/utils/consoleCapture';

const isModalOpen = ref(false);
const logs = ref([]);
const showSuccess = ref(false);

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

onMounted(() => {
  // Ensure global console is patched and bind to shared logs
  ensureConsolePatched();
  logs.value = consoleLogs.value;
});
</script>
