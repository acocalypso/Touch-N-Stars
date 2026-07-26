<template>
  <div class="stellarium-container" :class="containerClasses">
    <!-- Canvas for Stellarium -->
    <canvas ref="stelCanvas" class="stellarium-canvas"></canvas>

    <!-- Loading spinner while the Stellarium engine (WASM + catalogs) loads -->
    <div
      v-if="!isStellariumReady"
      class="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black"
    >
      <div
        class="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"
      ></div>
      <span class="text-white text-sm">{{ t('components.stellarium.loading') }}</span>
    </div>

    <!-- Search field button (magnifier) -->
    <button
      @click="toggleSearch"
      :class="searchButtonClasses"
      class="absolute p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
    >
      <MagnifyingGlassIcon class="w-6 h-6 text-white" />
    </button>

    <!-- Mount Position Component -->
    <stellariumMount
      v-if="stellariumStore.stel && store.mountInfo.Connected"
      ref="mountComponent"
      :canvasRef="stelCanvas"
      :isSearchVisible="isSearchVisible"
    />

    <!-- Camera FOV Frame Overlay -->
    <StellariumFovFrame v-if="showFovFrame" />

    <!-- Camera FOV Rotation Control + View-Center Actions -->
    <StellariumFovRotation v-if="showFovFrame" />

    <!-- Search field overlay -->
    <div
      v-if="isSearchVisible"
      :class="searchModalClasses"
      class="absolute bg-black/80 p-4 rounded-lg shadow-lg text-white w-80"
      style="z-index: 100"
    >
      <steallriumSearch ref="searchComponent" />
    </div>

    <!-- Selected object overlay -->
    <SelectedObject
      v-if="selectedObject"
      :selectedObject="selectedObject"
      :selectedObjectRa="selectedObjectRa"
      :selectedObjectDec="selectedObjectDec"
      :selectedObjectRaDeg="selectedObjectRaDeg"
      :selectedObjectDecDeg="selectedObjectDecDeg"
      @setFramingCoordinates="setFramingCoordinates"
    />
    <div
      :class="controlsClasses"
      class="fixed flex gap-2 bg-black/90 p-2 rounded-full stellarium-controls"
      style="bottom: var(--above-statusbar)"
    >
      <stellariumCredits />
      <stellariumSettings />

      <!-- Refresh Button (iOS only) -->
      <button
        v-if="Capacitor.getPlatform() === 'ios'"
        @click="refreshStellarium"
        class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md z-10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-7 h-7 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      <!-- Clock -->
      <stellariumClock v-if="stellariumStore.stel" />
    </div>

    <!-- Horizon overlay (renders into SWE GeoJSON layer, no visible DOM element) -->
    <StellariumHorizonOverlay v-if="stellariumStore.stel" />

    <!-- View Direction Display (hidden when camera FOV frame is rendered) -->
    <StellariumViewDirection v-if="stellariumStore.stel && !showFovFrame" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick, computed } from 'vue';
import { useOrientation } from '@/composables/useOrientation';
import { degreesToHMS, degreesToDMS, rad2deg } from '@/utils/utils';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useStellariumStore } from '@/store/stellariumStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Capacitor } from '@capacitor/core';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import steallriumSearch from '@/components/stellarium/steallriumSearch.vue';
import stellariumMount from '@/components/stellarium/stellariumMount.vue';
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import stellariumCredits from '@/components/stellarium/stellariumCredits.vue';
import SelectedObject from '@/components/stellarium/SelectedObject.vue';
import stellariumSettings from '@/components/stellarium/stellariumSettings.vue';
import stellariumClock from '@/components/stellarium/stellariumClock.vue';
import StellariumFovFrame from '@/components/stellarium/StellariumFovFrame.vue';
import StellariumFovRotation from '@/components/stellarium/StellariumFovRotation.vue';
import StellariumViewDirection from '@/components/stellarium/StellariumViewDirection.vue';
import StellariumHorizonOverlay from '@/components/stellarium/StellariumHorizonOverlay.vue';
import { timeSync } from '@/utils/timeSync';
import { utcToMJD } from '@/utils/utils';

const store = apiStore();
const framingStore = useFramingStore();
const stellariumStore = useStellariumStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const { t } = useI18n();
// Dedicated ready flag: only true once the engine is ready AND the catalogs are
// registered and a few frames have rendered. This keeps the spinner covering the
// visible sky build-up (instead of just the WASM initialization).
const isStellariumReady = ref(false);
let renderWaitHandle = null;
// Guards for the async onMounted flow: the profile wait and the script load can
// outlive the component (e.g. explicit iOS refresh remount), and must not
// initialize an engine for an instance that is already gone.
let isUnmounted = false;
let stopProfileWait = null;
// The Stellarium engine drives its own requestAnimationFrame(render) loop that
// cannot be stopped (no destroy/pause API). To avoid the continuous GPU load
// while Stellarium is not visible, we wrap the engine's native _core_render so
// the expensive render call is skipped whenever the view is hidden. The RAF
// tick keeps running but does almost nothing.
let renderActive = true;
const stelCanvas = ref(null);
const selectedObject = ref(null);
const selectedObjectRa = ref(null);
const selectedObjectDec = ref(null);
const selectedObjectRaDeg = ref(null);
const selectedObjectDecDeg = ref(null);
const wasmPath = '/stellarium-js/stellarium-web-engine.wasm';
const isSearchVisible = ref(false);
const searchComponent = ref(null);
const mountComponent = ref(null);

const { isLandscape } = useOrientation();

const containerClasses = computed(() => ({
  'stellarium-portrait': !isLandscape.value,
  'stellarium-landscape': isLandscape.value,
}));

const showFovFrame = computed(
  () =>
    !!stellariumStore.stel &&
    !!store.cameraInfo.Connected &&
    !!store.profileInfo?.TelescopeSettings?.FocalLength
);

// Controls positioning classes
const controlsClasses = computed(() => ({
  'left-2': !isLandscape.value,
  'left-2': isLandscape.value,
}));

// Search button positioning classes
const searchButtonClasses = computed(() => ({
  'top-24 right-3': !isLandscape.value,
  'top-3 right-6': isLandscape.value,
}));

// Search modal positioning classes
const searchModalClasses = computed(() => ({
  'top-28 left-1/2 transform -translate-x-1/2': !isLandscape.value,
  'top-16 right-4': isLandscape.value,
}));

// Toggles the search field
function toggleSearch(event) {
  // Prevent default behavior if event is provided
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Platform detection for iOS-specific handling using Capacitor
  const isIOS = Capacitor.getPlatform() === 'ios';

  // For iOS, first clear any existing selection to avoid UI conflicts
  if (isIOS && selectedObject.value) {
    selectedObject.value = null;
  }

  // Use a small delay on iOS to prevent layout issues
  setTimeout(
    () => {
      isSearchVisible.value = !isSearchVisible.value;

      if (isSearchVisible.value) {
        selectedObject.value = null;

        if (isIOS) {
          // For iOS, add extra delay to ensure UI is ready
          setTimeout(() => {
            searchComponent.value?.focusSearchInput();
          }, 100);
        } else {
          nextTick(() => {
            searchComponent.value?.focusSearchInput();
          });
        }
      }
    },
    isIOS ? 50 : 0
  );
}

// Framing coordinates
function setFramingCoordinates(data) {
  framingStore.RAangleString = data?.raString || selectedObjectRa.value;
  framingStore.DECangleString = data?.decString || selectedObjectDec.value;
  framingStore.RAangle = data?.ra || selectedObjectRaDeg.value;
  framingStore.DECangle = data?.dec || selectedObjectDecDeg.value;
  framingStore.selectedItem = {
    Name: data?.name || selectedObject.value?.[0] || '',
    RA: data?.ra || selectedObjectRaDeg.value,
    Dec: data?.dec || selectedObjectDecDeg.value,
  };

  console.log('Set Framing Coordinates');
  store.mount.currentTab = 'showSlew';
  console.log('store.mount.currentTab', store.mount.currentTab);
  router.push('/mount');
}

// Keeps the loading spinner up for a short while after onReady so Stellarium can
// load the catalogs and build the sky before the black overlay is removed. The
// engine offers no reliable "fully loaded" event, hence a fixed minimum duration
// plus a two-frame buffer.
const RENDER_SETTLE_MS = 1500;
function waitForStellariumRender() {
  renderWaitHandle = setTimeout(() => {
    if (!stellariumStore.stel) return; // engine is gone in the meantime
    // Wait two more frames so the first rendered sky is visible.
    requestAnimationFrame(() => requestAnimationFrame(() => (isStellariumReady.value = true)));
  }, RENDER_SETTLE_MS);
}

// While hidden the engine's rAF loop keeps ticking (it cannot be stopped), but
// its per-frame _core_update is throttled to ~1 Hz — enough to keep the engine
// clock current at negligible cost. While visible, rendering runs at the full
// display refresh rate: the engine's WebGL context uses preserveDrawingBuffer =
// false, so any frame whose _core_render is skipped is composited as a cleared
// (black) buffer — capping the visible frame rate therefore causes flicker (and
// makes wheel-zoom look broken on high-refresh displays).
const HIDDEN_UPDATE_INTERVAL_MS = 1000;
let lastHiddenUpdateTs = 0;

// WebKit (especially iPadOS) fires touchcancel instead of touchend when the
// system takes over a gesture (edge swipes, multitasking gestures, long-press
// magnifier). The engine only listens for touchend, so a cancelled finger
// would stay registered as "down" forever — the next touch then reads as a
// two-finger pinch (sudden zoom) and gesture handling deadlocks. Replay
// cancelled touches as releases so the engine's touch state stays consistent.
function handleTouchCancel(e) {
  const stel = stellariumStore.stel;
  if (typeof stel?._core_on_mouse !== 'function' || !stelCanvas.value) return;
  const rect = stelCanvas.value.getBoundingClientRect();
  for (const touch of e.changedTouches) {
    stel._core_on_mouse(touch.identifier, 0, touch.pageX - rect.left, touch.pageY - rect.top, 1);
  }
}

// Wrap the engine's native _core_render so we can skip the expensive GPU work
// while Stellarium is hidden. _core_update gets the same treatment but keeps
// running at ~1 Hz while hidden; resuming stays instant because
// setRenderActive(true) forces one update.
//
// The engine's exports use Emscripten's lazy-binding pattern: on the first call
// it does `Module._core_render = realWasmFn`, which would overwrite a plain
// wrapper. To survive that, we install an accessor property: the getter always
// returns our gated wrapper, and the setter captures whatever the engine
// assigns (the real WASM function) as the underlying implementation.
function installRenderGate(stel) {
  if (!stel || stel._coreRenderGated) return;

  let renderImpl = stel._core_render;
  let updateImpl = stel._core_update;
  if (typeof renderImpl !== 'function' || typeof updateImpl !== 'function') return;

  const gatedRender = function (...args) {
    if (!renderActive) return; // skip rendering while hidden
    return renderImpl.apply(stel, args);
  };

  const gatedUpdate = function (...args) {
    if (!renderActive) {
      const now = performance.now();
      if (now - lastHiddenUpdateTs < HIDDEN_UPDATE_INTERVAL_MS) return;
      lastHiddenUpdateTs = now;
    }
    return updateImpl.apply(stel, args);
  };

  Object.defineProperty(stel, '_core_render', {
    configurable: true,
    get() {
      return gatedRender;
    },
    set(fn) {
      // The lazy-binding resolves to the real WASM function; keep it as impl
      // but keep exposing our gated wrapper.
      renderImpl = fn;
    },
  });

  Object.defineProperty(stel, '_core_update', {
    configurable: true,
    get() {
      return gatedUpdate;
    },
    set(fn) {
      updateImpl = fn;
    },
  });

  stel._coreRenderGated = true;
}

// Enable/disable the actual rendering. Resuming forces one immediate update so
// the canvas is up to date the instant Stellarium becomes visible again.
function setRenderActive(active) {
  renderActive = active;
  // Mirror the state into the store so overlay components can stop their own
  // requestAnimationFrame loops while Stellarium is hidden.
  stellariumStore.isVisible = active;
  if (active) {
    // Force one update so the canvas is up to date the instant it becomes visible.
    if (typeof stellariumStore.stel?._core_update === 'function') {
      stellariumStore.stel._core_update();
    }
  }
}

// Refresh Stellarium function
function refreshStellarium() {
  console.log('Manually refreshing Stellarium...');
  // Emit event to parent to trigger re-render via landscapeSwitch
  const event = new CustomEvent('refresh-stellarium');
  window.dispatchEvent(event);
}

watch(
  () => stellariumStore.search.DECangleString,
  (newValue) => {
    console.log('selectedObject:', newValue);
    stellariumStore.search.DECangleString = '';
  }
);

watch(
  () => [
    store.profileInfo?.AstrometrySettings?.Latitude,
    store.profileInfo?.AstrometrySettings?.Longitude,
    store.profileInfo?.AstrometrySettings?.Elevation,
  ],
  ([lat, lon, elev]) => {
    if (!stellariumStore.stel || lat == null) return;
    const stel = stellariumStore.stel;
    stel.core.observer.latitude = lat * stel.D2R;
    stel.core.observer.longitude = lon * stel.D2R;
    stel.core.observer.elevation = elev ?? 0;
    mountComponent.value?.refreshPosition();
  }
);

// Skip rendering when Stellarium is not the visible page.
watch(
  () => store.showStellarium,
  (visible) => {
    setRenderActive(visible);
  }
);

// Also skip rendering when the whole app goes into the background, and resume
// only if Stellarium is the visible page again.
function handleVisibilityChange() {
  if (document.hidden) {
    setRenderActive(false);
  } else {
    setRenderActive(store.showStellarium);
  }
}

onMounted(async () => {
  document.addEventListener('visibilitychange', handleVisibilityChange);

  stelCanvas.value?.addEventListener('touchcancel', handleTouchCancel, { passive: true });

  // Stellarium starts hidden (the default page is not Stellarium); only render
  // once it actually becomes visible.
  renderActive = store.showStellarium;
  stellariumStore.isVisible = store.showStellarium;

  // Prepare NINA. The view is mounted independently of the backend connection
  // (App.vue keeps it alive across reconnects, since a remount would leak the
  // engine), so the profile may not be available yet — the engine init below
  // needs it for the observer location, so wait for it.
  await store.fetchProfilInfos();
  if (!store.profileInfo?.AstrometrySettings) {
    await new Promise((resolve) => {
      stopProfileWait = watch(
        () => store.profileInfo?.AstrometrySettings,
        (settings) => {
          if (settings) resolve();
        }
      );
    });
    stopProfileWait();
    stopProfileWait = null;
  }
  if (isUnmounted) return;

  // Step 1) Load the Stellarium Web Engine script. Only evaluate it once per
  // page: on an explicit remount (iOS refresh button) StelWebEngine already
  // exists, and re-evaluating the script blocks the main thread for ~250 ms.
  if (window.StelWebEngine) {
    initStellariumEngine();
    return;
  }
  const script = document.createElement('script');
  script.src = '/stellarium-js/stellarium-web-engine.js';
  console.log('Loading Stellarium Web Engine script...');

  script.onload = initStellariumEngine;
  document.head.appendChild(script);
});

async function initStellariumEngine() {
  if (!window.StelWebEngine) {
    console.error('StelWebEngine global object not found!');
    return;
  }

  try {
    const response = await fetch(wasmPath);
    if (!response.ok) {
      throw new Error(`Error loading WASM file: ${response.statusText}`);
    }
    const wasmArrayBuffer = await response.arrayBuffer();
    console.log('WASM file loaded successfully. Size (bytes):', wasmArrayBuffer.byteLength);

    // Unmounted while loading — creating the engine now would leak it (its
    // rAF loop can never be stopped).
    if (isUnmounted) return;

    window.StelWebEngine({
      wasmFile: wasmPath,

      canvas: stelCanvas.value,
      async onReady(stel) {
        console.log('Stellarium is ready!');
        stellariumStore.stel = stel;

        // Set the observer location (coordinates must be in radians):
        stel.core.observer.latitude = store.profileInfo.AstrometrySettings.Latitude * stel.D2R;
        stel.core.observer.longitude = store.profileInfo.AstrometrySettings.Longitude * stel.D2R;
        stel.core.observer.elevation = store.profileInfo.AstrometrySettings.Elevation;

        // Ensure timeSync is synced, then set server time
        await timeSync.ensureSync();
        const serverTime = new Date(timeSync.getServerTime());
        const mjd = utcToMJD(serverTime);
        stel.core.observer.utc = mjd;
        console.log('Stellarium initialized with server time:', serverTime.toISOString());

        stel.core.time_speed = 1;

        // Store Stellarium for later access
        stellariumStore.stel = stel;

        // Wrap the engine's native render so it can be skipped while Stellarium
        // is hidden. onReady receives the Emscripten Module itself, so
        // _core_render is available directly on `stel`.
        installRenderGate(stel);

        // Helper to read the current view direction (RA/Dec)
        function getCurrentViewDirection() {
          const obs = stel.core.observer;

          // In the VIEW frame [0, 0, -1] points forward (where the camera looks)
          // In the VIEW frame [0, 0, 1] points backward (behind the camera)
          const viewVec = [0, 0, -1];

          // Convert from VIEW to CIRS
          const cirsVec = stel.convertFrame(stel.observer, 'VIEW', 'CIRS', viewVec);

          // Convert to spherical coordinates (RA/Dec)
          const raDecSpherical = stel.c2s(cirsVec);

          const alt = obs.azalt[0];
          const az = obs.azalt[1];

          return {
            ra: raDecSpherical[0],
            dec: raDecSpherical[1],
            alt,
            az,
          };
        }

        // Helper to set the view direction (RA/Dec)
        function setViewDirection(raDeg, decDeg) {
          try {
            // Convert degrees to radians
            const raRad = raDeg * stel.D2R;
            const decRad = decDeg * stel.D2R;

            // Create ICRF vector from RA/Dec
            const icrfVec = stel.s2c(raRad, decRad);

            // Convert from ICRF to CIRS frame
            const cirsVec = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', icrfVec);

            // Create a virtual circle object at the specified position
            const targetCircle = stel.createObj('circle', {
              id: 'framingTarget',
              pos: cirsVec,
              color: [0, 0, 0, 0.1],
              size: [0.05, 0.05],
            });

            // Update the object and select it
            targetCircle.pos = cirsVec;
            targetCircle.update();
            stel.core.selection = targetCircle;
            stel.pointAndLock(targetCircle);

            console.log('Updated Stellarium view to RA:', raDeg, 'Dec:', decDeg);
          } catch (error) {
            console.error('Error setting view direction:', error);
          }
        }

        stellariumStore.getCurrentViewDirection = getCurrentViewDirection;
        stellariumStore.setViewDirection = setViewDirection;

        // Step 3) Add data sources (catalogs)
        // Determine the plugin's IP and port
        const protocol = settingsStore.backendProtocol || 'http';
        const host = settingsStore.connection.ip || window.location.hostname;
        const port = settingsStore.connection.port || window.location.port;
        const baseUrl = `${protocol}://${host}:${port}/stellarium-data/`;
        stellariumStore.baseUrl = baseUrl;
        const core = stel.core;

        core.dsos.hints_mag_offset = 4;
        //core.stars.hints_mag_offset = 3;

        // Add data
        core.stars.addDataSource({ url: baseUrl + 'stars' });
        core.skycultures.addDataSource({ url: baseUrl + 'skycultures/western', key: 'western' });
        core.dsos.addDataSource({ url: baseUrl + 'dso' });
        core.dss.addDataSource({ url: baseUrl + 'surveys/dss' });
        //core.landscapes.addDataSource({ url: baseUrl + 'landscapes/guereins', key: 'guereins' });
        //core.landscapes.addDataSource({ url: baseUrl + 'landscapes/gray', key: 'guereins' });
        core.milkyway.addDataSource({ url: baseUrl + 'surveys/milkyway' });
        core.minor_planets.addDataSource({ url: baseUrl + 'mpcorb.dat', key: 'mpc_asteroids' });
        // Planets with official HiPS textures
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/moon', key: 'moon' });
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/sun', key: 'sun' });
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/mercury', key: 'mercury' });
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/venus', key: 'venus' });
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/mars', key: 'mars' });
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/jupiter', key: 'jupiter' });
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/saturn', key: 'saturn' });
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/uranus', key: 'uranus' });
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/neptune', key: 'neptune' });

        // Jupiter moons
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/io', key: 'io' });
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/europa', key: 'europa' });
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/ganymede', key: 'ganymede' });
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/callisto', key: 'callisto' });

        core.planets.addDataSource({ url: baseUrl + 'surveys/sso', key: 'default' });
        core.comets.addDataSource({ url: baseUrl + 'CometEls.txt', key: 'mpc_comets' });
        // core.satellites.addDataSource({url: baseUrl + 'tle_satellite.jsonl.gz',key: 'jsonl/sat', });

        stellariumStore.updateStellariumCore();

        // Only remove the spinner once the catalogs are loaded and the sky has
        // rendered. The engine has no "fully loaded" event, so we keep the
        // overlay for a short settle time before hiding it.
        waitForStellariumRender();

        // Step 4) Watch for selection changes
        stel.change((obj, attr) => {
          if (attr === 'selection') {
            const selection = core.selection;
            if (!selection) {
              // Deselected
              selectedObject.value = null;
              console.log('No selection (deselected).');
              return;
            }
            if (stel.core.selection) {
              isSearchVisible.value = false;
              const selectedDesignations = stel.core.selection.designations() || [];
              // For coordinate-based search results (NGC, etc.) designations()
              // returns nothing useful — prepend the last searched name so it
              // gets passed on to framing/sequence.
              const searchedName = stellariumStore.lastSearchedName;
              stellariumStore.lastSearchedName = '';
              const designationsList = Array.isArray(selectedDesignations)
                ? selectedDesignations
                : [];
              if (searchedName && !designationsList.includes(searchedName)) {
                selectedObject.value = [searchedName, ...designationsList];
              } else {
                selectedObject.value = designationsList;
              }
              console.log('Object designations:', selectedObject.value);
              const info = stel.core.selection;
              //console.log('Object information:', info);

              const raDec = info.getInfo('RADEC');
              console.log(raDec);
              //const cirs = stel.convertFrame(stel.observer, 'ICRF', 'ICRF', raDec);
              const radecCIRS = stel.c2s(raDec);
              console.log('radecCIRS', radecCIRS);
              const ra = stel.anp(radecCIRS[0]); // RA in Radian
              const dec = stel.anpm(radecCIRS[1]); // Dec in Radian

              console.log(ra, dec);

              selectedObjectRa.value = degreesToHMS(rad2deg(ra));
              selectedObjectDec.value = degreesToDMS(rad2deg(dec));
              selectedObjectRaDeg.value = rad2deg(ra);
              selectedObjectDecDeg.value = rad2deg(dec);
            }
          }
        });
      },
    });
  } catch (err) {
    console.error('Error with Fetch or StelWebEngine:', err);
  }
}
onBeforeUnmount(() => {
  isUnmounted = true;
  stopProfileWait?.();
  stopProfileWait = null;
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  stelCanvas.value?.removeEventListener('touchcancel', handleTouchCancel);

  // The engine's render loop cannot be stopped, so at least disable rendering so
  // it stops producing GPU work once the component is gone.
  renderActive = false;

  if (renderWaitHandle) {
    clearTimeout(renderWaitHandle);
    renderWaitHandle = null;
  }
  if (stellariumStore.stel) {
    console.log('Tearing down Stellarium...');
    stellariumStore.stel = null;

    if (stelCanvas.value) {
      stelCanvas.value.width = 0;
      stelCanvas.value.height = 0;
    }

    console.log('Stellarium torn down.');
  }
});
</script>

<style scoped>
.stellarium-container {
  position: fixed;
  z-index: 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Landscape Mode  */
.stellarium-landscape {
  top: 0;
  left: var(--nav-width);
  width: calc(100vw - var(--nav-width));
  height: calc(100dvh - 2rem - env(safe-area-inset-bottom, 0px));
}

@media screen and (orientation: landscape) {
  .stellarium-controls.left-2 {
    left: var(--nav-offset) !important;
  }
}

.stellarium-portrait {
  top: 0;
  left: 0;
  width: 100vw;
  height: calc(100dvh - 1.5rem - env(safe-area-inset-bottom, 0px));
}

.stellarium-canvas {
  width: 100%;
  height: 100%;
  /* Keep the browser from claiming pan/pinch/double-tap gestures on the sky
     canvas — WebKit otherwise aborts engine touches with touchcancel. */
  touch-action: none;
  /* No long-press text-selection/magnifier callout on iPadOS. */
  -webkit-user-select: none;
  user-select: none;
}
</style>
