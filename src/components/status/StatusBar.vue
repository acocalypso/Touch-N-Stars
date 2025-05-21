<template>
  <div
    v-if="store.isBackendReachable"
    class="w-full h-8 text-sm px-4 text-gray-400 flex items-center justify-between"
  >
    <!--Camera-->
    <div v-if="store.cameraInfo.Connected" class="flex items-center gap-1 pl-1">
      <button class="flex w-5 h-5">
        <CameraIcon :class="{ 'text-green-500': store.cameraInfo.IsExposing }" />
      </button>
      <p class="hidden sm:block">Gain: {{ Number(store.cameraInfo.Gain).toFixed(0) }}</p>
      <p v-if="store.cameraInfo.CoolerOn" class="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-5 h-5 icon icon-tabler icons-tabler-outline icon-tabler-temperature"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5" />
          <path d="M10 9l4 0" />
        </svg>

        {{ Number(store.cameraInfo.Temperature).toFixed(1) }}
      </p>
      <p v-if="store.cameraInfo.CoolerOn" class="hidden sm:block">
        ({{ Number(store.cameraInfo.CoolerPower).toFixed(0) }}%)
      </p>
      <div v-if="store.filterInfo.Connected" class="hidden sm:block">
        <p class="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-5 h-5 icon icon-tabler icons-tabler-outline icon-tabler-filters"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12 8m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" />
            <path d="M8 11a5 5 0 1 0 3.998 1.997" />
            <path d="M12.002 19.003a5 5 0 1 0 3.998 -8.003" />
          </svg>
          {{ store.filterInfo.SelectedFilter.Name }}
        </p>
      </div>
    </div>
    <!--Mount-->
    <div v-if="store.mountInfo.Connected" class="pl-2 flex items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        :class="[
          'w-5 h-5 icon icon-tabler icons-tabler-outline icon-tabler-filters',
          store.mountInfo.AtPark
            ? 'text-red-500'
            : !store.mountInfo.TrackingEnabled
              ? 'text-yellow-500'
              : 'text-green-500',
        ]"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M6 21l6 -5l6 5" />
        <path d="M12 13v8" />
        <path
          d="M3.294 13.678l.166 .281c.52 .88 1.624 1.265 2.605 .91l14.242 -5.165a1.023 1.023 0 0 0 .565 -1.456l-2.62 -4.705a1.087 1.087 0 0 0 -1.447 -.42l-.056 .032l-12.694 7.618c-1.02 .613 -1.357 1.897 -.76 2.905z"
        />
        <path d="M14 5l3 5.5" />
      </svg>
    </div>
    <!--Guider-->
    <div v-if="store.guiderInfo.Connected" class="flex items-center gap-1 pl-3">
      <button>
        <svg
          class="w-5 h-5 icon icon-tabler icons-tabler-outline icon-tabler-viewfinder"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="{ 'text-green-500': store.guiderInfo.State == 'Guiding' }"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M12 3l0 4" />
          <path d="M12 21l0 -3" />
          <path d="M3 12l4 0" />
          <path d="M21 12l-3 0" />
          <path d="M12 12l0 .01" />
        </svg>
      </button>
      <p>RMS: {{ store.guiderInfo.RMSError.Total.Arcseconds.toFixed(2) }}</p>
    </div>
    <!-- Safety info -->
    <div v-if="store.safetyInfo.Connected" class="flex pl-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        :class="`w-5 h-5 ${store.safetyInfo.IsSafe ? 'text-green-600' : 'text-red-600'}`"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path
          d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"
        />
        <path d="M12 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        <path d="M12 12l0 2.5" />
      </svg>
    </div>
    <!-- Weather info container -->
    <div
      v-if="store.weatherInfo.Connected"
      class="flex items-center gap-1 min-w-[90px] px-2 py-1 cursor-pointer hover:bg-gray-700/50 rounded-lg"
      @click.stop.prevent="handleWeatherClick"
    >
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
      <span class="text-sm">{{ store.weatherInfo.Temperature.toFixed(1) }}°C</span>
    </div>
    <!--Log -->
    <div>
      <button class="flex w-5 h-5" @click.stop.prevent="handleLogClick">
        <EnvelopeIcon />
      </button>
    </div>
    <!-- About icon -->
    <div class="hover:text-gray-300" @click.stop.prevent="handleAboutClick">
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

    <!-- Weather modal -->
    <WeatherModal
      v-if="showWeatherModal"
      :weatherInfo="store.weatherInfo"
      @close="showWeatherModal = false"
    />
    <!-- About modal -->
    <AboutModal v-if="showAboutModal" :version="appVersion" @close="showAboutModal = false" />
    <!-- Log modal -->
    <LogModal v-if="showLogModal" @close="showLogModal = false" />
  </div>
</template>

<script setup>
import { apiStore } from '@/store/store';
import { ref, onMounted } from 'vue';
import { CameraIcon, EnvelopeIcon, XCircleIcon } from '@heroicons/vue/24/outline';
import WeatherModal from '../WeatherModal.vue';
import AboutModal from '../AboutModal.vue';
import LogModal from './LogModal.vue';
import version from '@/version';

const store = apiStore();
const showAboutModal = ref(false);
const showWeatherModal = ref(false);
const showLogModal = ref(false);
const appVersion = ref(version);

function handleWeatherClick(event) {
  showWeatherModal.value = true;
  event.stopPropagation();
  event.preventDefault();
}
function handleAboutClick(event) {
  showAboutModal.value = true;
  event.stopPropagation();
  event.preventDefault();
}
function handleLogClick(event) {
  showLogModal.value = true;
  event.stopPropagation();
  event.preventDefault();
}

onMounted(() => {});
</script>

<style scoped></style>
