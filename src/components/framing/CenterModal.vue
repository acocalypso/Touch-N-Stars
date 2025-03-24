<template>
    <div>
      <!-- Modal Trigger -->
      <button
        @click="isModalOpen = true"
        class="fixed bottom-12 right-16 p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md z-10"
        
      >
        <svg
          fill="#ffffff"
          height="24"
          width="24"
          version="1.1"
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 329.015 329.015"
          xml:space="preserve"
        >
          <g>
            <g>
              <g>
                <path
                  d="M164.508,71.909c-51.059,0-92.599,41.54-92.599,92.599c0,51.059,41.54,92.599,92.599,92.599s92.599-41.54,92.599-92.599
                                  C257.107,113.449,215.568,71.909,164.508,71.909z M164.508,239.107c-41.134,0-74.599-33.465-74.599-74.599
                                  c0-41.134,33.465-74.599,74.599-74.599c41.134,0,74.599,33.465,74.599,74.599C239.107,205.642,205.643,239.107,164.508,239.107z"
                />
                <path
                  d="M164.508,137.639c-14.815,0-26.869,12.053-26.869,26.869c0,14.816,12.053,26.869,26.869,26.869
                                  c14.816,0,26.869-12.053,26.869-26.869C191.378,149.692,179.323,137.639,164.508,137.639z M164.508,173.376
                                  c-4.89,0-8.869-3.979-8.869-8.869c0-4.89,3.979-8.869,8.869-8.869s8.869,3.979,8.869,8.869
                                  C173.378,169.397,169.398,173.376,164.508,173.376z"
                />
                <path
                  d="M320.016,155.508h-8.934C306.596,81.685,247.333,22.42,173.51,17.935V9c0-4.971-4.029-9-9-9c-4.971,0-9,4.029-9,9v8.934
                                  C81.685,22.42,22.42,81.685,17.935,155.508H9c-4.971,0-9,4.029-9,9s4.029,9,9,9h8.934
                                  c4.486,73.823,63.75,133.088,137.573,137.573v8.934c0,4.971,4.029,9,9,9s9-4.029,9-9v-8.934
                                  c73.823-4.486,133.088-63.75,137.573-137.573h8.934c4.971,0,9-4.029,9-9S324.987,155.508,320.016,155.508z M293.047,173.486
                                  c-4.42,63.912-55.649,115.141-119.561,119.561c-0.228-4.768-4.154-8.566-8.978-8.566s-8.75,3.798-8.978,8.566
                                  c-63.912-4.421-115.141-55.65-119.561-119.562c4.768-0.228,8.566-4.154,8.566-8.978c0-4.824-3.798-8.75-8.566-8.978
                                  c4.42-63.911,55.649-115.14,119.561-119.561c0.228,4.768,4.154,8.566,8.978,8.566s8.75-3.798,8.978-8.566
                                  c63.912,4.421,115.141,55.65,119.561,119.562c-4.768,0.228-8.566,4.154-8.566,8.978S288.279,173.258,293.047,173.486z"
                />
              </g>
            </g>
          </g>
        </svg>
      </button>
  
      <!-- Modal Overlay -->
      <div
        v-if="isModalOpen"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        @click.self="isModalOpen = false"
      >
        <div
          class="bg-gray-800 text-white p-4 rounded-lg min-w-[400px] max-w-4xl max-h-[80vh] overflow-y-auto"
          @click.stop
        >
          <div class="flex justify-end items-center">
            <button @click="isModalOpen = false" class="text-white hover:text-gray-300">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>
          <div>
            <h2 class="text-xl font-bold mb-4">Center Modal</h2>
            <div class="text-md text-gray-400 pb-2">{{ $t('components.tppa.last_messages') }}:</div>
                <ul>
                    <li
                    v-for="(msg, index) in lastCenterMessages.slice().reverse()"
                    :key="index"
                    :style="{
                        color: msg.line === '56' ? 'red' : msg.line === '54' ? 'green' : 'inherit',
                    }"
                    >
                    <template v-if="index === 0">
                        <span class="spinner"></span>
                    </template>
                    <template v-else> {{ formatTime(msg.timestamp) }} - </template>
                    {{ msg.message }}
                    </li>
                </ul>
          </div>
          

        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue';
  import { XMarkIcon } from '@heroicons/vue/24/outline';
  import { useLogStore } from '@/store/logStore';
  import { useI18n } from 'vue-i18n';
  import { formatTime } from '@/utils/utils';

  const { t } = useI18n();
  const logStore = useLogStore();
  const isModalOpen = ref(false);
  let lastProcessedTimestamp = null;
  const lastCenterMessages = ref([]);
  let centerOkTimestamp = null;

  watch(
  () => logStore.LogsInfo.logs,
  (newLogs) => {
    if (!newLogs || newLogs.length === 0) return;

    // Sortiere aufsteigend nach Timestamp:
    const sortedLogs = [...newLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    for (const entry of sortedLogs) {
      // Nur neue Einträge
      if (lastProcessedTimestamp && new Date(entry.timestamp) <= new Date(lastProcessedTimestamp)) {
        continue;
      }
      let message;
      if (entry.message.includes('Slewing from framing assistant to ')) {
        //message = t('components.tppa.plate_solve_start');
        message = 'Start slewing';
      } else if (entry.message.includes('Centering from framing assistant to RA:')) {
        message = 'Start centering';
      } else if (entry.message.includes('Platesolving with parameters')) {
        message = 'Start platesolving';
      }else if (entry.message.includes('Platesolve successful:')) {
        message = 'Platesolve successful';
      }else if (entry.message.includes('Finishing Category: , Item: Center')) {
        centerOkTimestamp = new Date(entry.timestamp);
        message = 'Centering successful';
      }else if (entry.message.includes('')) {
        message = 'Check if centering is done';

      } else {
        // Nicht relevante Logs überspringen
        continue;
      }
      // Speichere Einträge (max. 3)
      lastCenterMessages.value.push({
        timestamp: entry.timestamp,
        message,
        line: entry.line,
      });

      if (lastCenterMessages.value.length > 3) {
        lastCenterMessages.value.shift();
      }
      lastProcessedTimestamp = entry.timestamp;
    }
  },
  { deep: true }
);


  </script>
  <style scoped>
  .spinner {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 2px solid #bbb;
    border-top-color: #333;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    vertical-align: middle;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  </style>