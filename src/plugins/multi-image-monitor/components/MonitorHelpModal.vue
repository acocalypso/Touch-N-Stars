<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black bg-opacity-50"
    @click.self="$emit('close')"
  >
    <div
      class="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 overflow-hidden"
    >
      <!-- Header -->
      <div class="px-6 py-4 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
        <h2 class="text-lg font-bold text-white">
          {{ $t('plugins.multiImageMonitor.help.title') }}
        </h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white transition-colors">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto text-sm">
        <!-- What is a snapshot URL -->
        <p class="text-gray-300 leading-relaxed">
          {{ $t('plugins.multiImageMonitor.help.what') }}
        </p>

        <!-- Examples -->
        <div>
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {{ $t('plugins.multiImageMonitor.help.examplesTitle') }}
          </p>
          <ul class="space-y-2">
            <li v-for="(example, i) in examples" :key="i" class="flex flex-col gap-0.5">
              <span class="text-gray-400 text-xs">{{ example.label }}</span>
              <code class="text-indigo-300 bg-gray-900 px-2 py-1 rounded text-xs break-all">{{
                example.url
              }}</code>
            </li>
          </ul>
        </div>

        <!-- Credentials -->
        <div class="border-t border-gray-700 pt-4 space-y-2">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {{ $t('plugins.multiImageMonitor.help.credentialsTitle') }}
          </p>
          <p class="text-gray-300 leading-relaxed">
            {{ $t('plugins.multiImageMonitor.help.credentials') }}
          </p>
          <code class="block text-indigo-300 bg-gray-900 px-3 py-2 rounded text-xs break-all">{{
            credentialsExample
          }}</code>
          <p class="text-gray-500 text-xs leading-relaxed">
            {{ $t('plugins.multiImageMonitor.help.credentialsNote') }}
          </p>
        </div>

        <!-- Proxy vs Direct -->
        <div class="border-t border-gray-700 pt-4 space-y-2">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {{ $t('plugins.multiImageMonitor.help.proxyTitle') }}
          </p>
          <p class="text-gray-300 leading-relaxed">
            {{ $t('plugins.multiImageMonitor.help.proxyText') }}
          </p>
          <ul class="space-y-2 mt-1">
            <li
              v-for="(option, i) in $tm('plugins.multiImageMonitor.help.proxyOptions')"
              :key="i"
              class="flex gap-2 text-xs text-gray-400 leading-relaxed bg-gray-900 rounded px-3 py-2"
            >
              <span class="text-indigo-400 font-bold shrink-0">{{ i === 0 ? '①' : '②' }}</span>
              <span>{{ option }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-gray-900 flex justify-end">
        <button
          @click="$emit('close')"
          class="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
        >
          {{ $t('plugins.multiImageMonitor.help.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps({ isOpen: Boolean });
defineEmits(['close']);

const { tm } = useI18n();

const exampleUrls = [
  'http://192.168.1.100/snapshot.jpg',
  'http://192.168.1.100/onvif-http/snapshot?Profile_1',
  'http://192.168.1.100/axis-cgi/jpg/image.cgi',
  'http://192.168.1.100/ISAPI/Streaming/channels/101/picture',
];

const credentialsExample = 'http://user:password@192.168.1.100/snapshot.jpg';

const examples = computed(() =>
  tm('plugins.multiImageMonitor.help.exampleLabels').map((label, i) => ({
    label,
    url: exampleUrls[i],
  }))
);
</script>
