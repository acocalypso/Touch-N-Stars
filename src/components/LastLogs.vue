<template>
  <div class="p-4">
    <!-- Tabelle anzeigen, wenn Daten verfügbar sind -->
    <div class="w-full overflow-x-auto relative">
      <button
        @click="downloadLogs"
        class="absolute top-0 right-0 p-2 hover:bg-gray-700 rounded-lg"
        :title="$t('components.lastLogs.download')"
      >
        <!-- Success indicator -->
        <div
          v-if="showSuccess"
          class="absolute -top-1 -right-1 z-10 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-fade-out opacity-0 pointer-events-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      </button>
      <table
        class="w-full table-fixed border-collapse border border-gray-800 text-gray-300 text-sm"
      >
        <thead>
          <tr class="bg-gray-800">
            <th class="border border-gray-300 px-4 py-2 text-left w-1/10">
              {{ $t('components.lastLogs.timestamp') }}
            </th>
            <th class="border border-gray-300 px-4 py-2 text-left w-1/10">
              {{ $t('components.lastLogs.level') }}
            </th>
            <th class="border border-gray-300 px-4 py-2 text-left w-2/5">
              {{ $t('components.lastLogs.message') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(entry, index) in filteredLogs"
            :key="index"
            class="odd:bg-gray-900 even:bg-gray-600"
          >
            <td class="border border-gray-300 px-4 py-2">{{ formatTimestamp(entry.timestamp) }}</td>
            <td
              class="border border-gray-300 px-4 py-2"
              :class="{
                'text-green-600': entry.level === 'INFO',
                'text-red-600': entry.level === 'ERROR',
                'text-yellow-600': entry.level === 'WARNING',
              }"
            >
              {{ entry.level }}
            </td>
            <td class="border border-gray-300 px-4 py-2">{{ entry.message }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useLogStore } from '@/store/logStore';
const showSuccess = ref(false);
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { saveAs } from 'file-saver';
const logStore = useLogStore();

// Funktion zum Formatieren des Timestamps (optional)
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

const filteredLogs = computed(() =>
  logStore.LogsInfo.logs.filter((entry) => !entry.message.includes('EDS_ERR_INVALID_PARAMETER'))
);

async function downloadLogs() {
  const logContent = filteredLogs.value
    .map((entry) => `[${formatTimestamp(entry.timestamp)}] ${entry.level}: ${entry.message}`)
    .join('\n');

  const fileName = `logs-${new Date().toISOString().slice(0, 10)}.log`;
  const platform = Capacitor.getPlatform();

  if (platform === 'android' || platform === 'ios') {
    try {
      const folderName = 'TNS-Logs';
      const directory = platform === 'android' ? Directory.ExternalStorage : Directory.Documents;

      // Create TNS-Logs directory if it doesn't exist
      try {
        await Filesystem.mkdir({
          path: folderName,
          directory: directory,
          recursive: true,
        });
      } catch (mkdirError) {
        // Directory might already exist, ignore error
        if (
          !mkdirError.message.includes('Directory exists') &&
          !mkdirError.message.includes('already exists')
        ) {
          console.warn('Error creating directory:', mkdirError);
        }
      }

      // Write the log file
      await Filesystem.writeFile({
        path: `${folderName}/${fileName}`,
        data: logContent,
        directory: directory,
        encoding: 'utf8',
      });

      console.log(`Log file saved successfully to ${folderName}/${fileName}`);
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
</script>

<style scoped>
@keyframes fade-out {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
.animate-fade-out {
  animation: fade-out 1s ease-in forwards;
}
</style>
