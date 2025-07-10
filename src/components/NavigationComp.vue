<template>
  <div
    class="navigation-container shadow-md overflow-hidden"
    :class="[activeInstanceColor, orientationClasses]"
  >
    <div class="nav-content items-center scrollbar-hide" :class="contentClasses">
      <div class="nav-items-wrapper" :class="wrapperClasses">
        <!-- Plugin navigation items first -->
        <div v-for="item in pluginStore.navigationItems" :key="item.pluginId">
          <router-link
            :to="item.path"
            class="nav-button"
            active-class="active-nav-button"
            :title="item.title"
          >
            <component :is="item.icon" class="icon" />
          </router-link>
        </div>

        <div v-if="store.isBackendReachable">
          <router-link
            to="/equipment"
            class="nav-button"
            active-class="active-nav-button"
            :title="$t('components.navigation.equipment')"
          >
            <LinkIcon class="icon" />
          </router-link>
        </div>
        <div v-if="store.cameraInfo.Connected">
          <router-link
            to="/camera"
            class="nav-button"
            active-class="active-nav-button"
            :title="$t('components.navigation.camera')"
          >
            <CameraIcon
              class="icon"
              :class="store.cameraInfo.IsExposing ? 'text-green-500' : 'text-white'"
            />
          </router-link>
        </div>
        <div v-if="store.focuserInfo.Connected && !sequenceStore.sequenceRunning">
          <router-link
            to="/autofocus"
            class="nav-button"
            active-class="active-nav-button"
            :title="$t('components.navigation.autofocus')"
          >
            <EyeIcon class="icon" />
          </router-link>
        </div>
        <div v-if="store.mountInfo.Connected && !sequenceStore.sequenceRunning">
          <router-link
            to="/mount"
            class="nav-button"
            active-class="active-nav-button"
            :title="$t('components.navigation.mount')"
          >
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
              :class="[
                'icon',
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
          </router-link>
        </div>
        <div v-if="store.domeInfo.Connected && !sequenceStore.sequenceRunning">
          <router-link
            to="/dome"
            class="nav-button"
            active-class="active-nav-button"
            :title="$t('components.navigation.dome')"
          >
            <svg
              fill="#FFFFFF"
              height="24"
              width="24"
              version="1.1"
              id="Layer_1"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 512 512"
              xml:space="preserve"
            >
              <path
                d="M256,114.383c-22.526,0-40.851,18.325-40.851,40.851s18.325,40.851,40.851,40.851s40.851-18.325,40.851-40.851
            S278.526,114.383,256,114.383z M256,179.745c-13.516,0-24.511-10.995-24.511-24.511c0-13.516,10.995-24.511,24.511-24.511
            s24.511,10.995,24.511,24.511C280.511,168.75,269.516,179.745,256,179.745z"
              />
              <path
                d="M495.66,283.234h-2.723v-38.128h2.723c4.512,0,8.17-3.658,8.17-8.17c0-4.512-3.658-8.17-8.17-8.17h-2.878
			c-2.027-60.223-26.424-116.55-69.243-159.369c-26.822-26.822-58.948-46.412-94.006-57.812V8.45c0-4.512-3.658-8.17-8.17-8.17
			c-3.999,0-7.322,2.876-8.026,6.671C294.802,2.366,275.583,0,256,0c-19.714,0-39.059,2.393-57.707,7.038
			c-1.154-3.113-4.141-5.337-7.655-5.337c-4.512,0-8.17,3.658-8.17,8.17v1.714c-35.06,11.399-67.184,30.989-94.008,57.812
			c-42.82,42.818-67.215,99.144-69.242,159.368H16.34c-4.512,0-8.17,3.658-8.17,8.17c0,4.512,3.658,8.17,8.17,8.17h2.723v38.128
			H16.34c-4.512,0-8.17,3.658-8.17,8.17c0,4.512,3.658,8.17,8.17,8.17h2.723V503.83c0,4.512,3.658,8.17,8.17,8.17h457.532
			c4.512,0,8.17-3.658,8.17-8.17V299.574h2.723c4.512,0,8.17-3.658,8.17-8.17C503.83,286.892,500.172,283.234,495.66,283.234z
			M198.809,23.874c18.248-4.903,37.417-7.534,57.191-7.534c19.774,0,38.944,2.631,57.191,7.534v41.487H198.809V23.874z
			M182.468,28.958v175.297c0,4.512,3.658,8.17,8.17,8.17s8.17-3.658,8.17-8.17V81.702h114.383v122.553
			c0,4.512,3.658,8.17,8.17,8.17s8.17-3.658,8.17-8.17V28.958C412.68,58.443,473.049,136.45,476.429,228.766H35.571
			C38.951,136.45,99.32,58.443,182.468,28.958z M247.83,495.66h-49.021V343.149h49.021V495.66z M313.191,495.66H264.17V343.149
			h49.021V495.66z M476.596,283.234h-367.66c-4.512,0-8.17,3.658-8.17,8.17c0,4.512,3.658,8.17,8.17,8.17h367.66V495.66H329.532
			V334.979c0-4.512-3.658-8.17-8.17-8.17H190.638c-4.512,0-8.17,3.658-8.17,8.17V495.66H35.404V299.574h40.851
			c4.512,0,8.17-3.658,8.17-8.17c0-4.512-3.658-8.17-8.17-8.17H35.404v-38.128h49.021v13.617c0,4.512,3.658,8.17,8.17,8.17
			s8.17-3.658,8.17-8.17v-13.617h49.021v13.617c0,4.512,3.658,8.17,8.17,8.17s8.17-3.658,8.17-8.17v-13.617h49.021v13.617
			c0,4.512,3.658,8.17,8.17,8.17s8.17-3.658,8.17-8.17v-13.617h49.021v13.617c0,4.512,3.658,8.17,8.17,8.17s8.17-3.658,8.17-8.17
			v-13.617h49.021v13.617c0,4.512,3.658,8.17,8.17,8.17c4.512,0,8.17-3.658,8.17-8.17v-13.617h49.021V283.234z"
              />
              <path
                d="M354.043,359.489c-4.512,0-8.17,3.658-8.17,8.17v43.574c0,4.512,3.658,8.17,8.17,8.17s8.17-3.658,8.17-8.17V367.66 
          C362.213,363.147,358.555,359.489,354.043,359.489z"
              />
              <path
                d="M157.957,359.489c-4.512,0-8.17,3.658-8.17,8.17v43.574c0,4.512,3.658,8.17,8.17,8.17s8.17-3.658,8.17-8.17V367.66
            C166.128,363.147,162.47,359.489,157.957,359.489z"
              />
            </svg>
          </router-link>
        </div>
        <div v-if="store.flatdeviceInfo.Connected && !sequenceStore.sequenceRunning">
          <router-link to="/flat" class="nav-button" active-class="active-nav-button">
            <LightBulbIcon
              class="icon"
              :class="[
                'icon',
                store.flatdeviceInfo.LightOn
                  ? 'text-yellow-500'
                  : store.flatdeviceInfo.CoverState === 'Closed'
                    ? 'text-red-500'
                    : 'text-white',
              ]"
            />
          </router-link>
        </div>
        <div v-if="store.switchInfo.Connected">
          <router-link to="/switch" class="nav-button" active-class="active-nav-button">
            <AdjustmentsVerticalIcon class="icon" />
          </router-link>
        </div>
        <div v-if="store.guiderInfo.Connected">
          <router-link
            to="/guider"
            class="nav-button"
            active-class="active-nav-button"
            :title="$t('components.navigation.guider')"
          >
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
              :class="[
                'icon icon-tabler icons-tabler-outline icon-tabler-viewfinder',
                store.guiderInfo.State == 'Guiding' ? 'text-green-500' : 'text-white',
              ]"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
              <path d="M12 3l0 4" />
              <path d="M12 21l0 -3" />
              <path d="M3 12l4 0" />
              <path d="M21 12l-3 0" />
              <path d="M12 12l0 .01" />
            </svg>
          </router-link>
        </div>
        <div v-if="sequenceStore.sequenceIsLoaded">
          <router-link
            to="/sequence"
            class="nav-button"
            active-class="active-nav-button"
            :title="$t('components.navigation.sequence')"
          >
            <ListBulletIcon
              class="icon"
              :class="sequenceStore.sequenceRunning ? 'text-green-500' : 'text-white'"
            />
          </router-link>
        </div>
        <div v-if="store.cameraInfo.Connected && !sequenceStore.sequenceRunning">
          <router-link to="/flats" class="nav-button" active-class="active-nav-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="#FFFFFF"
            >
              <path
                d="m5,5.5v-2c0-1.93,1.57-3.5,3.5-3.5h2c.276,0,.5.224.5.5s-.224.5-.5.5h-2c-1.379,0-2.5,1.121-2.5,2.5v2c0,.276-.224.5-.5.5s-.5-.224-.5-.5Zm18.5,7.5c-.276,0-.5.224-.5.5v2c0,1.379-1.121,2.5-2.5,2.5h-2c-.276,0-.5.224-.5.5s.224.5.5.5h2c1.93,0,3.5-1.57,3.5-3.5v-2c0-.276-.224-.5-.5-.5ZM20.5,0h-2c-.276,0-.5.224-.5.5s.224.5.5.5h2c1.379,0,2.5,1.121,2.5,2.5v2c0,.276.224.5.5.5s.5-.224.5-.5v-2c0-1.93-1.57-3.5-3.5-3.5Zm-2.949,13.567l-2.199-.225-1.026,2.03c-.227.453-.691.733-1.19.733-.058,0-.115-.004-.173-.011-.562-.073-1.017-.494-1.134-1.048l-.379-1.79L.854,23.854c-.098.098-.226.146-.354.146s-.256-.049-.354-.146c-.195-.195-.195-.512,0-.707l10.579-10.579-1.739-.345c-.26-.05-.497-.177-.686-.365-.202-.202-.336-.47-.377-.754-.081-.56.202-1.111.704-1.373l2.034-1.066-.227-2.209c-.046-.565.263-1.096.769-1.33.505-.232,1.109-.125,1.503.267l1.522,1.523,2.067-.981c.508-.232,1.111-.124,1.504.268.394.392.502.994.27,1.499l-.983,2.072,1.522,1.521c.396.396.502,1.003.266,1.508-.235.506-.774.806-1.324.766Zm.351-1.567l-1.771-1.77c-.149-.149-.188-.377-.099-.567l1.132-2.386c.056-.121.028-.271-.069-.368-.099-.099-.249-.126-.376-.068l-2.38,1.129c-.191.091-.418.05-.567-.099l-1.771-1.771c-.063-.063-.15-.098-.237-.098-.048,0-.096.011-.14.031-.127.059-.204.191-.193.331l.261,2.534c.021.203-.084.398-.265.493l-2.335,1.225c-.127.066-.198.205-.178.345.01.073.043.139.094.189.047.047.106.079.171.091l2.668.529c.197.039.352.191.393.387l.567,2.684c.029.139.144.244.284.263.142.02.277-.053.341-.18l1.183-2.339c.094-.185.292-.297.497-.271l2.533.259c.147.003.266-.066.323-.192.061-.128.033-.28-.066-.38Z"
              />
            </svg>
          </router-link>
        </div>
        <div
          v-if="
            sequenceStore.sequenceRunning ||
            (store.imageHistoryInfo && store.imageHistoryInfo.length > 0)
          "
        >
          <router-link
            to="/seq-mon"
            class="nav-button"
            active-class="active-nav-button"
            :title="$t('components.navigation.sequence')"
          >
            <svg
              fill="#FFFFFF"
              height="400px"
              width="400px"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="-100 0 639.479 439.479"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              enable-background="new 0 0 439.479 439.479"
            >
              <g>
                <path
                  d="m407.18,60.082h-374.882c-17.81,0-32.298,14.489-32.298,32.299v226.626c0,17.81 14.488,32.299 32.298,32.299h106.252l-12.162,13.091h-18.23c-4.143,0-7.5,3.358-7.5,7.5s3.357,7.5 7.5,7.5h223.162c4.143,0 7.5-3.358 7.5-7.5s-3.357-7.5-7.5-7.5h-18.23l-12.162-13.091h106.252c17.81,0 32.299-14.489 32.299-32.299v-226.626c0-17.81-14.49-32.299-32.299-32.299zm-392.18,250.422v-209.62h409.479v209.621h-409.479zm17.298-235.423h374.882c7.24,0 13.447,4.475 16.021,10.801h-406.924c2.575-6.325 8.781-10.801 16.021-10.801zm260.318,289.314h-145.754l12.162-13.091h121.43l12.162,13.091zm114.564-28.09h-374.882c-7.24,0-13.446-4.475-16.021-10.801h406.924c-2.575,6.325-8.781,10.801-16.021,10.801z"
                />
                <path
                  d="m374.171,159.137c-9.064-9.064-23.814-9.065-32.879,0-4.392,4.391-6.811,10.23-6.811,16.44 0,3.34 0.721,6.562 2.051,9.52l-59.872,47.207c-6.806-3.618-15.042-3.618-21.847,0l-59.883-47.216c3.825-8.549 2.259-18.944-4.748-25.95-9.065-9.064-23.813-9.066-32.88,0-7.006,7.007-8.573,17.401-4.748,25.95l-59.883,47.216c-8.789-4.672-19.965-3.317-27.363,4.08-9.064,9.065-9.064,23.814 0,32.879 4.533,4.532 10.486,6.799 16.439,6.799 5.954,0 11.907-2.266 16.44-6.799 7.006-7.007 8.573-17.401 4.748-25.95l59.883-47.216c3.403,1.809 7.162,2.719 10.923,2.719 3.762,0 7.521-0.91 10.924-2.719l59.883,47.216c-3.825,8.549-2.259,18.944 4.748,25.95 4.533,4.533 10.485,6.798 16.44,6.798 5.952,0 11.907-2.266 16.439-6.798 0,0 0,0 0.001,0 7.006-7.007 8.572-17.401 4.747-25.95l59.884-47.216c3.403,1.809 7.162,2.719 10.924,2.719 5.953,0 11.906-2.266 16.439-6.799 9.065-9.065 9.065-23.815 0.001-32.88zm-286.591,99.519c-3.214,3.216-8.449,3.217-11.665,0-3.217-3.217-3.217-8.45 0-11.666 1.607-1.608 3.72-2.412 5.832-2.412 2.113,0 4.226,0.804 5.833,2.412 3.217,3.216 3.217,8.45 1.42109e-14,11.666zm80.329-77.246c-3.217-3.217-3.217-8.45 0-11.666 1.607-1.608 3.72-2.412 5.832-2.412 2.113,0 4.226,0.804 5.833,2.412 3.217,3.217 3.217,8.45 0,11.666-3.213,3.216-8.448,3.217-11.665,0zm103.661,77.246c-3.217,3.217-8.452,3.216-11.667,0-3.217-3.217-3.217-8.45 0-11.666 1.607-1.608 3.72-2.412 5.833-2.412 2.112,0 4.226,0.804 5.833,2.412 3.217,3.216 3.217,8.45 0.001,11.666zm91.993-77.246c-3.215,3.216-8.449,3.216-11.666,0-1.559-1.558-2.416-3.629-2.416-5.833 0-2.203 0.857-4.275 2.417-5.833 1.607-1.608 3.72-2.412 5.833-2.412 2.112,0 4.225,0.804 5.832,2.412 3.217,3.216 3.217,8.449 0,11.666z"
                />
              </g>
            </svg>
          </router-link>
        </div>
        <div v-if="store.isBackendReachable">
          <router-link
            to="/"
            class="nav-button"
            :class="{ 'active-nav-button': store.showStellarium }"
            @click="store.showStellarium = true"
          >
            <SparklesIcon class="icon" />
          </router-link>
        </div>
        <button
          @click="store.showSettings = true"
          class="nav-button"
          active-class="active-nav-button"
          :title="$t('components.navigation.settings')"
        >
          <Cog6ToothIcon class="icon" />
        </button>
        <button @click="showAboutModal = true" class="nav-button" active-class="active-nav-button">
          <InformationCircleIcon class="icon" />
        </button>
      </div>
    </div>
  </div>

  <exposureCountdown />
  <!-- About modal -->
  <AboutModal v-if="showAboutModal" :version="appVersion" @close="showAboutModal = false" />
</template>

<script setup>
import {
  LinkIcon,
  CameraIcon,
  EyeIcon,
  ListBulletIcon,
  Cog6ToothIcon,
  LightBulbIcon,
  AdjustmentsVerticalIcon,
  SparklesIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline';
import { watch, computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { apiStore } from '@/store/store';
import { useSequenceStore } from '@/store/sequenceStore';
import { useSettingsStore } from '@/store/settingsStore';
import exposureCountdown from '@/components/helpers/ExposureCountdown.vue';
import { usePluginStore } from '@/store/pluginStore';
import AboutModal from './status/AboutModal.vue';
import version from '@/version';

const store = apiStore();
const sequenceStore = useSequenceStore();
const settingsStore = useSettingsStore();
const pluginStore = usePluginStore();
const route = useRoute();
const selectedInstanceId = computed(() => settingsStore.selectedInstanceId);
const appVersion = ref(version);
const showAboutModal = ref(false);

// Orientierung tracking
const isLandscape = ref(false);

const activeInstanceColor = computed(() =>
  settingsStore.getInstanceColorById(selectedInstanceId.value)
);

// Orientierung-spezifische CSS-Klassen
const orientationClasses = computed(() => ({
  'nav-portrait': !isLandscape.value,
  'nav-landscape': isLandscape.value,
}));

const contentClasses = computed(() => ({
  'flex mx-auto justify-start overflow-x-auto overflow-y-hidden': !isLandscape.value,
  'flex flex-col mx-auto justify-start overflow-y-auto overflow-x-hidden': isLandscape.value,
}));

const wrapperClasses = computed(() => ({
  'flex space-x-2 px-2': !isLandscape.value,
  'flex flex-col space-y-2 px-2 py-4': isLandscape.value,
}));

// Orientierung prüfen
function checkOrientation() {
  isLandscape.value = window.innerWidth > window.innerHeight;
}

function handleOrientationChange() {
  setTimeout(() => {
    checkOrientation();
  }, 100);
}

// Lifecycle
onMounted(() => {
  checkOrientation();
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);
});

onBeforeUnmount(() => {
  window.removeEventListener('orientationchange', handleOrientationChange);
  window.removeEventListener('resize', handleOrientationChange);
});

watch(
  () => route.path,
  (newPath) => {
    if (newPath !== '/') {
      store.showStellarium = false;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Base Navigation Container */
.navigation-container {
  @apply flex justify-center h-20 top-0 z-50 transition-all duration-300 ease-in-out;
}

/* Portrait Mode - Navigation oben */
.nav-portrait {
  @apply fixed top-0 left-0 right-0 w-full h-20;
}

/* Landscape Mode - Navigation links */
.nav-landscape {
  @apply fixed left-0 top-0 bottom-0 h-full w-20 flex-col justify-start;
  height: 100vh !important;
}

/* Content Area Anpassungen */
.nav-content {
  @apply scrollbar-hide transition-all duration-300 ease-in-out;
  scroll-snap-type: x mandatory;
}

/* Portrait Mode Content */
.nav-portrait .nav-content {
  @apply flex mx-auto items-center justify-start overflow-x-auto overflow-y-hidden;
  scroll-snap-type: x mandatory;
}

/* Landscape Mode Content */
.nav-landscape .nav-content {
  @apply flex flex-col mx-auto items-stretch justify-start overflow-y-auto overflow-x-hidden h-full;
  scroll-snap-type: none;
}

/* Navigation Items Wrapper */
.nav-items-wrapper {
  scroll-snap-align: start;
  @apply transition-all duration-300 ease-in-out;
}

/* Portrait Mode Wrapper */
.nav-portrait .nav-items-wrapper {
  @apply flex space-x-2 px-2;
}

/* Landscape Mode Wrapper */
.nav-landscape .nav-items-wrapper {
  @apply flex flex-col space-y-2 px-2 py-4 h-full;
}

/* Navigation Buttons - Base Styles */
.nav-button {
  @apply w-10 h-10 lg:w-12 lg:h-12 
    border border-slate-600/30 
    bg-slate-800/40 
    text-gray-300 
    rounded-full 
    hover:bg-slate-700/60
    hover:border-slate-500/50
    hover:text-gray-200
    backdrop-blur-sm
    transition-all
    duration-200
    ease-out
    focus:outline-none 
    focus:ring-2 
    focus:ring-cyan-500/40;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px;
  flex-shrink: 0;
}

/* Portrait Mode Button Anpassungen */
.nav-portrait .nav-button {
  @apply w-10 h-10 lg:w-12 lg:h-12;
  margin: 4px;
}

/* Landscape Mode Button Anpassungen */
.nav-landscape .nav-button {
  @apply w-16 h-16;
  margin: 4px 0;
  border-radius: 16px;
  min-height: 48px; /* Touch-friendly */
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Mobile Portrait Anpassungen */
@media (max-width: 1023px) {
  .nav-portrait .nav-button {
    margin: 8px 4px;
    width: 3.5rem;
    height: 3.5rem;
  }

  .nav-portrait {
    z-index: 50;
  }

  .nav-portrait .nav-content {
    padding: 8px 0;
  }
}

/* Tablet Landscape Anpassungen */
@media screen and (orientation: landscape) and (max-width: 1024px) {
  .nav-landscape {
    width: 4.5rem; /* 72px - zwischen w-16 (64px) und w-20 (80px) */
  }

  .nav-landscape .nav-button {
    @apply w-14 h-14;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .nav-landscape svg {
    width: 1.5rem !important;
    height: 1.5rem !important;
  }
}

/* Active Button States */
.active-nav-button {
  @apply border border-cyan-500/50 
    bg-cyan-700/50 
    text-cyan-100
    shadow-md
    shadow-cyan-500/20;
}

/* Landscape Mode Active Button */
.nav-landscape .active-nav-button {
  @apply border-l-4 border-l-cyan-400 
    bg-cyan-700/60 
    text-cyan-100
    shadow-lg
    shadow-cyan-500/30;
  border-radius: 0 16px 16px 0;
  margin-left: 0;
  padding-left: 8px;
}

/* Icon Styles */
.icon {
  @apply w-6 h-6 transition-all duration-200;
}

/* Landscape Mode Icon */
.nav-landscape .icon {
  @apply w-7 h-7;
}

/* SVG Icon spezifische Styles für Landscape */
.nav-landscape svg {
  width: 1.75rem !important;
  height: 1.75rem !important;
  flex-shrink: 0;
}

/* Portrait Mode SVG */
.nav-portrait svg {
  width: 1.5rem !important;
  height: 1.5rem !important;
  flex-shrink: 0;
}

/* Hover Effekte */
.nav-button:hover {
  transform: scale(1.05);
}

.nav-landscape .nav-button:hover {
  transform: translateX(4px) scale(1.05);
}

/* Smooth Transitions für Orientierungsänderung */
.navigation-container {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-content,
.nav-items-wrapper,
.nav-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Touch-optimierte Größen */
@media (max-width: 768px) {
  .nav-button {
    min-height: 44px; /* Apple's empfohlene Touch-Größe */
    min-width: 44px;
  }
}

/* Scrollbar Styling für Landscape Mode */
.nav-landscape .nav-content::-webkit-scrollbar {
  width: 4px;
}

.nav-landscape .nav-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.nav-landscape .nav-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.nav-landscape .nav-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Dark Mode Compatibility */
@media (prefers-color-scheme: dark) {
  .navigation-container {
    @apply bg-gray-900/95;
  }
}

/* Safe Area Support für iOS */
@supports (padding-top: env(safe-area-inset-top)) {
  .nav-portrait {
    padding-top: env(safe-area-inset-top);
    height: calc(5rem + env(safe-area-inset-top));
  }

  .nav-landscape {
    padding-left: env(safe-area-inset-left);
    width: calc(5rem + env(safe-area-inset-left));
  }
}
</style>
