<template>
  <div>
    <div
      v-if="!store.isBackendReachable"
      class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
    >
      <div class="text-red-600 text-3xl">
        {{ $t('app.unreachable') }}
      </div>
    </div>
    <div v-else-if="isLoading">{{ $t('components.loading') }}</div>
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
        <!-- Weather info container -->
        <div
          v-if="store.weatherInfo.Connected"
          class="flex items-center gap-1 min-w-[90px] px-2 py-1 cursor-pointer hover:bg-gray-700/50 rounded-lg"
          @click.stop.prevent="handleWeatherClick"
        >
          <span class="text-sm">{{ store.weatherInfo.Temperature.toFixed(1) }}°C</span>
          <svg
            v-if="store.weatherInfo.CloudCover < 20"
            class="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M6.05 4.14l-.39-.39a.993.993 0 0 0-1.4 0l-.01.01c-.39.39-.39 1.02 0 1.41l.39.39c.39.39 1.01.39 1.4 0l.01-.01c.39-.38.39-1.02 0-1.41zM3.01 10.5H1.99c-.55 0-.99.44-.99.99v.01c0 .55.44.99.99.99H3c.56.01 1-.43 1-.98v-.01c0-.56-.44-1-.99-1zm9-9.95H12c-.56 0-1 .44-1 .99v.96c0 .55.44.99.99.99H12c.56.01 1-.43 1-.98v-.97c0-.55-.44-.99-.99-.99zm7.74 3.21c-.39-.39-1.02-.39-1.41-.01l-.39.39a.996.996 0 0 0 0 1.41l.01.01c.39.39 1.02.39 1.4 0l.39-.39c.39-.39.39-1.02 0-1.41zm-1.81 15.1l.39.39a.996.996 0 1 0 1.41-1.41l-.39-.39a.996.996 0 0 0-1.41 1.41zm-2.83-9.9c0-.56-.44-1-.99-1H12c-.55 0-.99.44-.99.99v.01c0 .55.44.99.99.99h4.95c.56.01 1-.43 1-.98v-.01zm-9.95 9.95c.56 0 1-.44 1-.99v-.96c0-.55-.44-.99-.99-.99H12c-.56 0-1 .44-1 .99v.96c0 .56.44 1 .99 1h4.95zm12.45-8.45a.996.996 0 0 0 0-1.41L19.14 5.6a.996.996 0 0 0-1.41 0c-.39.39-.39 1.02 0 1.41l2.12 2.12c.39.39 1.02.39 1.41 0z"
            />
          </svg>
          <svg
            v-else-if="store.weatherInfo.CloudCover < 60"
            class="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M6.05 4.14l-.39-.39a.993.993 0 0 0-1.4 0l-.01.01c-.39.39-.39 1.02 0 1.41l.39.39c.39.39 1.01.39 1.4 0l.01-.01c.39-.38.39-1.02 0-1.41zM3.01 10.5H1.99c-.55 0-.99.44-.99.99v.01c0 .55.44.99.99.99H3c.56.01 1-.43 1-.98v-.01c0-.56-.44-1-.99-1zm9-9.95H12c-.56 0-1 .44-1 .99v.96c0 .55.44.99.99.99H12c.56.01 1-.43 1-.98v-.97c0-.55-.44-.99-.99-.99zm7.74 3.21c-.39-.39-1.02-.39-1.41-.01l-.39.39a.996.996 0 0 0 0 1.41l.01.01c.39.39 1.02.39 1.4 0l.39-.39c.39-.39.39-1.02 0-1.41zm-1.81 15.1l.39.39a.996.996 0 1 0 1.41-1.41l-.39-.39a.996.996 0 0 0-1.41 1.41zm-2.83-9.9c0-.56-.44-1-.99-1H12c-.55 0-.99.44-.99.99v.01c0 .55.44.99.99.99h4.95c.56.01 1-.43 1-.98v-.01zm-9.95 9.95c.56 0 1-.44 1-.99v-.96c0-.55-.44-.99-.99-.99H12c-.56 0-1 .44-1 .99v.96c0 .56.44 1 .99 1h4.95zm12.45-8.45a.996.996 0 0 0 0-1.41L19.14 5.6a.996.996 0 0 0-1.41 0c-.39.39-.39 1.02 0 1.41l2.12 2.12c.39.39 1.02.39 1.41 0z"
            />
            <path
              d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"
            />
          </svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"
            />
          </svg>
        </div>

        <!-- Safety info -->
        <div v-if="store.safetyInfo.Connected" class="flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="`w-4 h-4 ${store.safetyInfo.IsSafe ? 'text-green-600' : 'text-red-600'}`"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path
              d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"
            />
            <path d="M12 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
            <path d="M12 12l0 2.5" />
          </svg>
        </div>

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
    <!-- Weather modal -->
    <WeatherModal
      v-if="showWeatherModal"
      :weatherInfo="store.weatherInfo"
      @close="showWeatherModal = false"
    />
  </div>
</template>

<script setup>
import { apiStore } from '@/store/store';
import { useLogStore } from '@/store/logStore';
import { ref, computed, onMounted, watch } from 'vue';
import version from '@/version';
import AboutModal from './AboutModal.vue';
import WeatherModal from './WeatherModal.vue';

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

function handleWeatherClick(event) {
  showWeatherModal.value = true;
  event.stopPropagation();
  event.preventDefault();
}

// Function to format timestamp
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

// Computed property for the first log entry
/*const firstLog = computed(() => {
  return logStore.LogsInfo.logs.slice(0, 1);
});*/
// Computed property for the filtered first log entry
const firstLog = computed(() => {
  return logStore.LogsInfo.logs
    .filter((entry) => !entry.message.includes('EDS_ERR_INVALID_PARAMETER'))
    .slice(0, 1);
});

// Watch when logs are loaded
onMounted(() => {
  const unwatch = logStore.$subscribe((mutation, state) => {
    if (!store.isBackendReachable) {
      isLoading.value = false;
    }
    if (state.LogsInfo.logs.length > 0) {
      isLoading.value = false;
      unwatch(); // Stop watching once the data is loaded
    }
  });
});

watch(
  () => logStore.LogsInfo,
  (newVal, oldVal) => {
    if (!oldVal || newVal.length > oldVal.length) {
      isLoading.value = false;
      console.log('ja');
    }
  },
  { immediate: false }
);
</script>

<style scoped></style>
