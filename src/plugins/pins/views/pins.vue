<template>
  <div class="container py-8 sm:py-16 flex items-center justify-center px-4">
    <div class="container max-w-4xl p-0 sm:p-4 w-full">
      <h5
        class="text-2xl text-center font-bold text-white mb-6 flex items-center justify-center gap-3"
      >
        <span>PINS Updater</span>
      </h5>

      <!-- Check for PINS environment -->
      <div
        v-if="!apiStoreInstance.isPINS"
        class="p-6 bg-red-900/50 rounded-lg border border-red-700 text-center shadow-lg"
      >
        <h3 class="text-xl font-semibold text-red-200 mb-2">Unavailable</h3>
        <p class="text-gray-300">This plugin requires the PINS environment enabled in settings.</p>
      </div>

      <div v-else class="flex flex-col space-y-6 animate-fade-in-up">
        <!-- Control Panel -->
        <div
          class="border border-gray-700 rounded-lg bg-gray-800 shadow-xl p-6 relative overflow-hidden"
        >
          <div class="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <!-- Decorative background element -->
            <svg class="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
              />
            </svg>
          </div>

          <div class="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div class="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <!-- Dry Run Checkbox -->
              <label
                class="flex items-center space-x-3 cursor-pointer bg-gray-900/50 px-4 py-3 rounded-lg border border-gray-600 hover:border-blue-500/50 hover:bg-gray-800 transition-all w-full sm:w-auto justify-center sm:justify-start group"
              >
                <input
                  type="checkbox"
                  v-model="dryRun"
                  class="w-5 h-5 rounded bg-gray-700 border-gray-500 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer disabled:opacity-50"
                  :disabled="status === 'Running'"
                />
                <span class="text-gray-200 font-medium group-hover:text-white transition-colors"
                  >Dry Run Mode</span
                >
              </label>

              <!-- Status Badge -->
              <div
                class="px-5 py-2 rounded-full font-bold text-sm border shadow-sm w-full sm:w-auto text-center"
                :class="{
                  'bg-gray-700 border-gray-600 text-gray-300': status === 'Idle',
                  'bg-blue-900/40 border-blue-500/50 text-blue-300 animate-pulse':
                    status === 'Running',
                  'bg-green-900/40 border-green-500/50 text-green-300': status === 'Success',
                  'bg-red-900/40 border-red-500/50 text-red-300': status === 'Failed',
                }"
              >
                <span
                  v-if="status === 'Running'"
                  class="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2 animate-ping"
                ></span>
                {{ status }}
              </div>
            </div>

            <!-- Start Button -->
            <button
              @click="startUpgrade"
              :disabled="status === 'Running'"
              class="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none w-full md:w-auto flex items-center justify-center gap-2"
            >
              <svg
                v-if="status === 'Running'"
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{{ status === 'Running' ? 'Upgrading...' : 'Start Upgrade' }}</span>
            </button>
          </div>
        </div>

        <!-- Terminal View -->
        <div
          class="border border-gray-700 rounded-lg bg-black overflow-hidden shadow-2xl flex flex-col h-[500px]"
        >
          <div
            class="bg-gray-900 px-4 py-2 border-b border-gray-700 flex justify-between items-center"
          >
            <div class="flex items-center gap-2">
              <svg
                class="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              <span class="text-xs text-gray-400 font-mono font-semibold tracking-wide"
                >TERMINAL OUTPUT</span
              >
            </div>
            <button
              @click="clearLogs"
              class="text-xs text-blue-400 hover:text-white transition-colors hover:underline px-2 py-1 rounded"
            >
              Clear Output
            </button>
          </div>
          <div
            ref="terminalRef"
            class="flex-1 overflow-y-auto p-4 font-mono text-xs sm:text-sm space-y-1 scroll-smooth bg-black"
          >
            <div v-if="logs.length === 0" class="text-gray-600 italic select-none opacity-50">
              Assuming control... Waiting for command...
            </div>
            <div
              v-for="(log, index) in logs"
              :key="index"
              class="break-words whitespace-pre-wrap font-mono leading-relaxed"
              :class="getLogClass(log)"
            >
              <span class="text-gray-600 select-none mr-2 text-[10px] align-middle">{{
                new Date().toLocaleTimeString([], { hour12: false })
              }}</span>
              <span class="mr-2 opacity-75">➜</span>
              <span v-html="formatLog(log)"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onUnmounted } from 'vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import axios from 'axios';

const apiStoreInstance = apiStore();
const settingsStore = useSettingsStore();

const dryRun = ref(false);
const status = ref('Idle');
const logs = ref([]);
const terminalRef = ref(null);
const jobId = ref(null);
let ws = null;

const PORT = 8000;
const TOKEN = 'change-me-please';

function clearLogs() {
  logs.value = [];
}

function appendLog(message) {
  logs.value.push(message);
  scrollToBottom();
}

function scrollToBottom() {
  nextTick(() => {
    if (terminalRef.value) {
      terminalRef.value.scrollTop = terminalRef.value.scrollHeight;
    }
  });
}

function getLogClass(log) {
  if (typeof log !== 'string') return 'text-gray-300';
  const lower = log.toLowerCase();
  if (lower.includes('error') || lower.includes('fail')) return 'text-red-400';
  if (lower.includes('warn')) return 'text-yellow-400';
  if (lower.includes('success') || lower.includes('done') || lower.includes('complete'))
    return 'text-green-400';
  if (lower.includes('info')) return 'text-blue-300';
  return 'text-gray-300';
}

function formatLog(log) {
  if (typeof log === 'object') {
    try {
      return JSON.stringify(log, null, 2);
    } catch (e) {
      return String(log);
    }
  }
  return log;
}

// Function to get the current connection IP
function getIp() {
  return settingsStore.connection.ip;
}

async function startUpgrade() {
  if (status.value === 'Running') return;

  const ip = getIp();
  if (!ip) {
    appendLog('Error: No IP address found in settings. Please connect to an instance first.');
    status.value = 'Failed';
    return;
  }

  status.value = 'Running';
  logs.value = [];
  appendLog(`Initializing upgrade sequence on host: ${ip}`);
  appendLog(`Configuration: Dry Run = ${dryRun.value}`);

  try {
    const response = await axios.post(
      `http://${ip}:${PORT}/upgrade`,
      { dryRun: dryRun.value },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
        // Ensure we catch 405 and other errors properly by validating status ourselves if needed,
        // though default axios throws on non-2xx.
        // If we suspect global config overrides this, we can set it explicitly:
        validateStatus: function (status) {
          return status >= 200 && status < 300; // default
        },
      }
    );

    const data = response.data;
    let returnedJobId;

    if (data && typeof data === 'object' && data.jobId) {
      returnedJobId = data.jobId;
    } else if (typeof data === 'string' || typeof data === 'number') {
      returnedJobId = data;
    }

    if (!returnedJobId) {
      throw new Error('No valid Job ID returned. server response: ' + JSON.stringify(data));
    }

    jobId.value = returnedJobId;
    appendLog(`Job successfully created. ID: ${returnedJobId}`);

    connectWebSocket(ip, returnedJobId);
  } catch (error) {
    console.error(error);
    status.value = 'Failed';
    appendLog(`Make sure the PINS daemon is running on ${ip}:${PORT}`);

    // Detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      appendLog(`Server Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      if (error.response.status === 405) {
        appendLog(
          'Hint: The server rejected the request method. Check CORS configuration on the server.'
        );
      }
    } else if (error.request) {
      // The request was made but no response was received
      appendLog(`Network Error: No response received from server.`);
    } else {
      // Something happened in setting up the request that triggered an Error
      appendLog(`Error: ${error.message}`);
    }
  }
}

function connectWebSocket(ip, id) {
  if (ws) {
    ws.close();
  }

  const wsUrl = `ws://${ip}:${PORT}/logs/${id}?token=${TOKEN}`;
  appendLog(`Negotiating WebSocket connection to ${wsUrl}...`);

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      appendLog('Connection established. Streaming logs...');
    };

    ws.onmessage = (event) => {
      if (event.data) {
        appendLog(event.data);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      appendLog('WebSocket encountered an error.');
    };

    ws.onclose = (event) => {
      appendLog(
        `Connection closed (Code: ${event.code}${event.reason ? ', Reason: ' + event.reason : ''})`
      );
      ws = null;

      // When WS closes, we check the final status
      checkFinalStatus(ip, id);
    };
  } catch (e) {
    appendLog(`Failed to create WebSocket: ${e.message}`);
    status.value = 'Failed';
  }
}

async function checkFinalStatus(ip, id) {
  appendLog('Verifying final job status...');
  try {
    const response = await axios.get(`http://${ip}:${PORT}/jobs/${id}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 5000,
    });

    const result = response.data;
    if (typeof result === 'object') {
      appendLog(`Job Report: ${JSON.stringify(result, null, 2)}`);

      // Check for success indicators
      const isSuccess =
        result.status === 'success' ||
        result.status === 'completed' ||
        result.exit_code === 0 ||
        result.exitCode === 0 ||
        result.success === true;

      if (isSuccess) {
        status.value = 'Success';
        appendLog('Upgrade process finished successfully.');
      } else {
        status.value = 'Failed';
        appendLog('Upgrade process reported failure.');
      }
    } else {
      appendLog(`Job Status: ${result}`);
      status.value = 'Idle'; // Ambiguous
    }
  } catch (e) {
    appendLog(`Could not fetch final status: ${e.message}`);
    // If we can't verify, we leave it as Idle or keep last state?
    // Let's set to finish but unknown
    if (status.value === 'Running') status.value = 'Idle';
  }
}

onUnmounted(() => {
  if (ws) {
    ws.close();
  }
});
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom scrollbar for terminal */
::-webkit-scrollbar {
  width: 10px;
}
::-webkit-scrollbar-track {
  background: #111827;
}
::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 5px;
  border: 2px solid #111827;
}
::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}
</style>
