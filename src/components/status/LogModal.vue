<template>
  <div
    class="fixed inset-0 z-top flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300"
    @click.self="handleOutsideClick"
  >
    <div
      class="bg-gray-800/95 rounded-xl p-4 pt-2 max-w-2xl w-full m-4 relative shadow-2xl transform transition-all duration-300 ease-out"
      :class="{ 'scale-95 opacity-0': !isMounted, 'scale-100 opacity-100': isMounted }"
      @click.stop
    >
      <div class="flex justify-between items-center pb-4">
        <h1>LOG</h1>
        <button
          @click="downloadLogs"
          class="p-2 hover:bg-gray-700 rounded-lg"
          :title="$t('components.lastLogs.download')"
        >
          <!-- Success indicator -->
          <div
            v-if="showSuccess"
            class="absolute z-10 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-fade-out opacity-0 pointer-events-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="3"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <ArrowDownTrayIcon class="w-6 h-6" />
        </button>
        <button
          @click="$emit('close')"
          class="hover:bg-gray-700/50 rounded-full transition-all duration-200"
          aria-label="Close modal"
        >
          <XMarkIcon class="w-7 h-7" />
        </button>
      </div>
      <!-- Tabelle anzeigen, wenn Daten verfügbar sind -->
      <div class="w-full max-h-[50vh] overflow-y-auto overflow-x-auto relative scrollbar-thin">
        <table
          class="w-full table-fixed border-collapse border border-gray-800 text-gray-300 text-sm"
        >
          <thead class="sticky top-0 bg-gray-800 z-10">
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
              <td class="border border-gray-300 px-4 py-2">
                {{ formatTimestamp(entry.timestamp) }}
              </td>
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
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useLogStore } from '@/store/logStore';
import { downloadLogs as downloadLogsHelper } from '@/utils/logDownloader';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline';

const logStore = useLogStore();
const emit = defineEmits(['close']);
const isMounted = ref(false);
const showSuccess = ref(false);

// Funktion zum Formatieren des Timestamps (optional)
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

const filteredLogs = computed(() =>
  logStore.LogsInfo.logs.filter((entry) => !entry.message.includes('EDS_ERR_INVALID_PARAMETER'))
);

function handleOutsideClick(event) {
  emit('close');
  if (event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
}

async function downloadLogs() {
  const success = await downloadLogsHelper(filteredLogs.value, formatTimestamp);

  if (success) {
    showSuccess.value = true;
    setTimeout(() => (showSuccess.value = false), 2000);
  }
}

onMounted(() => {
  isMounted.value = true;
});
</script>

<style scoped>
/* Smooth scroll behavior */
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #4a5568;
  border-radius: 20px;
}

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
