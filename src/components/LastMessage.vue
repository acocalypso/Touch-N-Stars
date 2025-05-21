<template>
  <div>
    <!-- Backend unreachable error -->
    <div
      v-if="!store.isBackendReachable"
      class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
    >
      <div class="text-red-600 text-3xl">
        {{ $t('app.unreachable') }}
      </div>
    </div>

    <!-- API version incompatible error -->
    <div
      v-else-if="!store.isVersionNewerOrEqual"
      class="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
    >
      <div class="text-yellow-600 text-3xl">
        {{
          $t('app.api_version_incompatible', {
            current: store.currentApiVersion,
            required: store.minimumApiVersion,
          })
        }}
      </div>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoading">{{ $t('components.loading') }}</div>

    <!-- Main content -->
    <div v-else>
      <div
        v-for="(entry, index) in firstLog"
        :key="index"
        class="fixed bottom-0 left-0 right-0 flex flex-wrap items-center gap-2 border-t border-gray-900 bg-gray-800 p-2 text-sm"
        :class="{
          'text-green-600': entry.level === 'INFO',
          'text-red-600': entry.level === 'ERROR',
          'text-yellow-600': entry.level === 'WARNING',
        }"
      >
        <!-- Timestamp -->
        <div class="max-w-[20%] truncate text-gray-400">
          {{ formatTimestamp(entry.timestamp) }}
        </div>

        <!-- Message -->
        <div class="flex-1 truncate">
          {{ entry.message }}
        </div>

        <!-- About icon -->
        <div
          class="ml-auto cursor-pointer hover:text-gray-300"
          @click.stop.prevent="handleAboutClick"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- About modal -->
    <AboutModal v-if="showAboutModal" :version="appVersion" @close="showAboutModal = false" />
  </div>
</template>

<script setup>
import { apiStore } from '@/store/store';
import { useLogStore } from '@/store/logStore';
import { ref, computed, onMounted, watch } from 'vue';
import version from '@/version';
import AboutModal from './AboutModal.vue';

const store = apiStore();
const logStore = useLogStore();
const isLoading = ref(true);
const showAboutModal = ref(false);
const showWeatherModal = ref(false);
const appVersion = ref(version);

function handleAboutClick(event) {
  showAboutModal.value = true;
  event.stopPropagation();
  event.preventDefault();
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const timeString = date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateString = date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${timeString}, ${dateString}`;
}

const firstLog = computed(() => {
  return logStore.LogsInfo.logs
    .filter((entry) => !entry.message.includes('EDS_ERR_INVALID_PARAMETER'))
    .slice(0, 1);
});

onMounted(() => {
  const unwatch = logStore.$subscribe((mutation, state) => {
    if (!store.isBackendConnected) {
      isLoading.value = false;
    }
    if (state.LogsInfo.logs.length > 0) {
      isLoading.value = false;
      unwatch();
    }
  });
});

watch(
  () => logStore.LogsInfo,
  (newVal, oldVal) => {
    if (!oldVal || newVal.length > oldVal.length) {
      isLoading.value = false;
    }
  },
  { immediate: false }
);
</script>

<style scoped></style>
