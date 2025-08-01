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
          <div class="flex flex-col sm:flex-row gap-4">
            <button
              @click="downloadJSON"
              class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
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
              class="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
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
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <p><strong>How to use:</strong></p>
            <p>1. Download or copy the JSON file</p>
            <p>2. Import it into N.I.N.A via Sequence → Load Sequence</p>
            <p>3. Adjust any equipment-specific settings as needed</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ getFileSize() }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSequenceStore } from '../stores/sequenceStore.js';

const store = useSequenceStore();
const copied = ref(false);

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

function getFileSize() {
  const bytes = new Blob([formattedJSON.value]).size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
