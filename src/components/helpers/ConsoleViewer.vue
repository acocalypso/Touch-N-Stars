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
          <button @click="isModalOpen = false" class="text-white hover:text-gray-300">
            <XMarkIcon class="w-6 h-6" />
          </button>
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
import { CommandLineIcon, XMarkIcon } from '@heroicons/vue/24/outline';

const isModalOpen = ref(false);
const logs = ref([]); // hier speichern wir dauerhaft alle Logs

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

// Konsole patchen (nur einmal)
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
