<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"
      >
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Export N.I.N.A Sequence
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your sequence is ready to be exported as N.I.N.A compatible JSON
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden flex flex-col">
        <!-- Export Options -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              @click="downloadJSON"
              class="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download JSON File
            </button>

            <button
              @click="copyToClipboard"
              class="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {{ copied ? 'Copied!' : 'Copy to Clipboard' }}
            </button>

            <button
              @click="sendToNina"
              :disabled="isSending"
              :class="[
                'px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors',
                isSending
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : sendSuccess
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : sendError
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white',
              ]"
            >
              <svg
                v-if="isSending"
                class="w-5 h-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <svg
                v-else-if="sendSuccess"
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <svg
                v-else-if="sendError"
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              {{
                isSending
                  ? 'Sending...'
                  : sendSuccess
                    ? 'Sent!'
                    : sendError
                      ? 'Failed'
                      : 'Send to N.I.N.A'
              }}
            </button>
          </div>

          <!-- Status Messages -->
          <div
            v-if="sendError"
            class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p class="text-sm text-red-800 dark:text-red-200">
              <strong>Error:</strong> {{ sendErrorMessage }}
            </p>
          </div>

          <div
            v-if="sendSuccess"
            class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>Success:</strong> Sequence has been loaded into N.I.N.A successfully!
            </p>
          </div>
        </div>

        <!-- JSON Preview -->
        <div class="flex-1 overflow-hidden p-6">
          <div class="h-full">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">JSON Preview</h3>
            <div
              class="h-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <pre
                class="h-full overflow-auto p-4 text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap"
                >{{ formattedJSON }}</pre
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg"
      >
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>How to use:</strong></p>
          <p>1. Download or copy the JSON file, or</p>
          <p>2. Send directly to N.I.N.A (requires connection), or</p>
          <p>3. Import manually into N.I.N.A via Sequence → Load Sequence</p>
          <p>4. Adjust any equipment-specific settings as needed</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSequenceStore } from '../stores/sequenceStore.js';
import apiService from '@/services/apiService.js';

const store = useSequenceStore();
const copied = ref(false);
const isSending = ref(false);
const sendSuccess = ref(false);
const sendError = ref(false);
const sendErrorMessage = ref('');

const formattedJSON = computed(() => {
  return store.ninaSequenceJSON;
});

function downloadJSON() {
  const blob = new Blob([formattedJSON.value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nina-sequence-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(formattedJSON.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = formattedJSON.value;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
}

async function sendToNina() {
  // Reset states
  sendSuccess.value = false;
  sendError.value = false;
  sendErrorMessage.value = '';
  isSending.value = true;

  try {
    // Send the JSON content to N.I.N.A
    const response = await apiService.sequenceLoadJson(formattedJSON.value);

    if (response && response.Success !== false) {
      sendSuccess.value = true;
      console.log('Sequence successfully sent to N.I.N.A:', response);
    } else {
      sendError.value = true;
      sendErrorMessage.value = response?.Response || 'Unknown error occurred';
    }
  } catch (error) {
    sendError.value = true;
    sendErrorMessage.value = error.message || 'Failed to send sequence to N.I.N.A';
    console.error('Error sending sequence to N.I.N.A:', error);
  } finally {
    isSending.value = false;

    // Auto-reset success/error state after 5 seconds
    setTimeout(() => {
      sendSuccess.value = false;
      sendError.value = false;
      sendErrorMessage.value = '';
    }, 5000);
  }
}
</script>

<style scoped>
pre {
  line-height: 1.5;
}

/* Custom scrollbar for JSON preview */
pre::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

pre::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

pre::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

pre::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

@media (prefers-color-scheme: dark) {
  pre::-webkit-scrollbar-track {
    background: #374151;
  }

  pre::-webkit-scrollbar-thumb {
    background: #6b7280;
  }

  pre::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
}
</style>
