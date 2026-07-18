<template>
  <div class="container flex items-center justify-center">
    <div class="container max-w-md">
      <h5 class="text-xl font-bold mb-4">
        {{ $t('components.framing.search.title') }}
      </h5>

      <FavTargets
        :showSeqTarget="false"
        class="fixed right-5 z-20"
        style="bottom: var(--above-statusbar)"
      />
      <FitsPlateSolve
        v-if="
          appStore.isPINS ||
          appStore.checkVersionNewerOrEqual(appStore.currentTnsPluginVersion, '1.2.7.0')
        "
        :showFraming="true"
        :showSeqTarget="false"
        class="fixed right-16 z-20"
        style="bottom: var(--above-statusbar)"
      />
      <!-- Search Input -->
      <div class="text-black mx-auto">
        <div class="flex gap-1">
          <input
            type="text"
            v-model="framingStore.searchQuery"
            @input="fetchTargetSearch"
            class="tns-input w-full"
            :placeholder="$t('components.framing.search.placeholder')"
          />
          <SaveFavTargets
            v-if="framingStore.selectedItem"
            class="w-5 h-5 mr-5"
            :name="framingStore.selectedItem.Name"
            :ra="framingStore.RAangle"
            :dec="framingStore.DECangle"
            :ra-string="framingStore.RAangleString"
            :dec-string="framingStore.DECangleString"
            :rotation="framingStore.rotationAngle"
            :mosaic-cols="framingStore.isMosaicMode ? framingStore.mosaicCols : null"
            :mosaic-rows="framingStore.isMosaicMode ? framingStore.mosaicRows : null"
            :mosaic-overlap="framingStore.isMosaicMode ? framingStore.mosaicOverlap : null"
            :mosaic-preserve-alignment="
              framingStore.isMosaicMode ? framingStore.mosaicPreserveAlignment : null
            "
          />
        </div>
        <!-- Search Results -->
        <ul
          v-if="
            Array.isArray(framingStore.targetSearchResult) &&
            framingStore.targetSearchResult.length > 0
          "
          class="tns-select max-h-[21.5rem] overflow-y-auto"
        >
          <li
            v-for="(item, index) in framingStore.targetSearchResult"
            :key="index"
            class="p-2 hover:bg-blue-800 cursor-pointer"
            @click="selectTarget(item)"
          >
            {{ item.Name }}
            <span v-if="item['Common names']"> ({{ item['Common names'] }})</span>
            <span v-if="item['M']"> (M {{ item['M'] }})</span>
          </li>
        </ul>
      </div>

      <!-- Star Selection Dropdown -->
      <div class="mb-4 mt-4">
        <label for="visibleStars" class="block text-white font-bold text-xl mb-4">
          {{ $t('components.slewAndCenter.visibleStars') }}
        </label>
        <select
          id="visibleStars"
          v-model="selectedStar"
          class="tns-select w-full"
          @change="updateRaDec"
        >
          <option v-for="star in visibleStars" :key="star.name" :value="star.name">
            {{ star.name }} (Mag: {{ star.magnitude }}) - Alt: {{ star.altAz.alt.toFixed(1) }}°, Az:
            {{ star.altAz.az.toFixed(1) }}° ({{ star.altAz.direction }})
          </option>
        </select>
      </div>

      <!-- Additional Control -->
      <div class="flex min-w-36 items-center border border-gray-500 p-1 mt-2 rounded-lg">
        <label for="DewHeater" class="text-sm mb-1 text-gray-400">
          {{ $t('components.framing.useNinaCache') }}
        </label>
        <div class="flex ml-auto items-center space-x-2">
          <controlUseNinaCache class="p-2" />
        </div>
      </div>

      <!-- Selected Item Details -->
      <div
        v-if="framingStore.selectedItem"
        class="grid grid-cols-2 mt-4 p-4 border border-gray-700 rounded shadow"
      >
        <div class="flex flex-col justify-between">
          <div class="text-xs">
            <p v-if="framingStore.selectedItem['Common names']">
              <strong>Name:</strong>
              {{ framingStore.selectedItem['Common names'] }}
            </p>
            <p>{{ framingStore.selectedItem.Name }}</p>
            <p v-if="framingStore.selectedItem.M">
              {{ framingStore.selectedItem.M }}
            </p>
          </div>
        </div>
        <div>
          <TargetPic class="border border-gray-500 rounded-md" />
        </div>
      </div>

      <!-- Altitude chart -->
      <SkyChart
        v-if="framingStore.selectedItem"
        :target="{ RA: framingStore.selectedItem.RA, Dec: framingStore.selectedItem.Dec }"
        :coordinates="{
          latitude: appStore.profileInfo?.AstrometrySettings?.Latitude ?? 0,
          longitude: appStore.profileInfo?.AstrometrySettings?.Longitude ?? 0,
        }"
      />

      <!-- Open Framing Page Button -->
      <div v-if="framingStore.selectedItem" class="mb-4">
        <button @click="openFraming" class="tns-btn-primary">
          {{ $t('components.framing.openFraminingModal') }}
        </button>
      </div>

      <div>
        <slewAndCenter
          v-model:RAangleString="framingStore.RAangleString"
          v-model:DECangleString="framingStore.DECangleString"
          @slew="slew"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Papa from 'papaparse';
import apiService from '@/services/apiService';
import slewAndCenter from '@/components/framing/slewAndCenter.vue';
import TargetPic from '@/components/framing/TargetPic.vue';
import controlUseNinaCache from '@/components/framing/controlUseNinaCache.vue';
import { useFramingStore } from '@/store/framingStore';
import SkyChart from '@/components/framing/SkyChart.vue';
import FavTargets from '@/components/favTargets/FavTargets.vue';
import SaveFavTargets from '@/components/favTargets/SaveFavTargets.vue';
import FitsPlateSolve from '@/components/fitsPlatesolve/FitsPlateSolve.vue';
import { raDecToAltAz, degreesToHMS, degreesToDMS } from '@/utils/utils';
import { timeSync } from '@/utils/timeSync';
import { apiStore } from '@/store/store';
import { useRouter } from 'vue-router';

const framingStore = useFramingStore();
const appStore = apiStore();
const router = useRouter();

function openFraming() {
  router.push('/framing');
}
const stars = ref([]);
const selectedStar = ref(null);
const currentSiderealTime = ref(0);

// Visible stars are computed once on load (see computeVisibleStars), not reactively,
// so the 2s profileInfo polling does not reset the dropdown selection.
const visibleStars = ref([]);

// Filters visible stars and calculates Alt/Az – called once, not reactive.
function computeVisibleStars() {
  visibleStars.value = stars.value
    .map((star) => {
      const altAz = calculateAltAz(star.raDeg, star.decDeg);
      return { ...star, altAz };
    })
    .filter((star) => star.altAz.alt > 0)
    .sort((a, b) => parseFloat(b.altAz.alt) - parseFloat(a.altAz.alt));
}

async function fetchTargetSearch() {
  if (framingStore.searchQuery.trim() === '') {
    framingStore.targetSearchResult = [];
    return;
  }
  try {
    const data = await apiService.searchNGC(framingStore.searchQuery, 50);
    framingStore.targetSearchResult = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    framingStore.targetSearchResult = [];
  }
}

function selectTarget(item) {
  framingStore.searchQuery = item.Name || '';
  framingStore.targetSearchResult = [];
  framingStore.selectedItem = item;
  framingStore.RAangle = item.RA;
  framingStore.DECangle = item.Dec;
  framingStore.RAangleString = degreesToHMS(item.RA);
  framingStore.DECangleString = degreesToDMS(item.Dec);

  // Berechne und speichere auch Alt/Az
  const { altitude, azimuth } = raDecToAltAz(
    item.RA,
    item.Dec,
    appStore.profileInfo?.AstrometrySettings?.Latitude ?? 0,
    appStore.profileInfo?.AstrometrySettings?.Longitude ?? 0
  );
  framingStore.ALTangle = altitude;
  framingStore.AZangle = azimuth;
  framingStore.ALTangleString = altitude.toFixed(3);
  framingStore.AZangleString = azimuth.toFixed(3);
}

let siderealTimeInterval = null;
let isUnmounted = false;

onMounted(async () => {
  framingStore.height = 200;
  framingStore.width = 200;
  framingStore.fov = 2;
  await loadStarData();
  // The component may have been unmounted while loadStarData() was in flight;
  // onUnmounted has already run then, so an interval started here would leak.
  if (isUnmounted) return;
  updateSiderealTime();
  siderealTimeInterval = setInterval(updateSiderealTime, 1000);
  // Container dimensions are set on mount of the framing page via ResizeObserver
  // from the actual stage wrapper — no more window-based init.
});

onUnmounted(() => {
  isUnmounted = true;
  clearInterval(siderealTimeInterval);
});

async function loadStarData() {
  try {
    const response = await fetch('/stars.csv');
    const csvData = await response.text();
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        stars.value = results.data.map((star) => {
          const raDeg = convertRAtoDegrees(star.ra);
          const decDeg = convertDECtoDegrees(star.dec);
          return {
            name: star.name,
            magnitude: parseFloat(star.magnitude),
            ra: star.ra,
            dec: star.dec,
            raDeg,
            decDeg,
          };
        });
        computeVisibleStars();
      },
    });
  } catch (error) {
    console.error('Error loading star data:', error);
  }
}

function convertRAtoDegrees(ra) {
  const matches = ra.match(/(\d+)h\s*(\d+)m\s*([\d.]+)s/);
  if (!matches) return 0;
  return (
    15 *
    ((parseInt(matches[1]) || 0) +
      (parseInt(matches[2]) || 0) / 60 +
      (parseFloat(matches[3]) || 0) / 3600)
  );
}

function convertDECtoDegrees(dec) {
  const matches = dec.match(/([+-]?)(\d+)°\s*(\d+)′\s*([\d.]+)″/);
  if (!matches) return 0;
  const sign = matches[1] === '-' ? -1 : 1;
  return (
    sign *
    ((parseInt(matches[2]) || 0) +
      (parseInt(matches[3]) || 0) / 60 +
      (parseFloat(matches[4]) || 0) / 3600)
  );
}

// When a star is selected, update the displayed values.
// In ALT/AZ mode the values are converted using calculateAltAz.
async function updateRaDec() {
  const star = visibleStars.value.find((s) => s.name === selectedStar.value);
  if (!star) return;

  framingStore.RAangleString = degreesToHMS(star.raDeg);
  framingStore.DECangleString = degreesToDMS(star.decDeg);
  framingStore.RAangle = star.raDeg;
  framingStore.DECangle = star.decDeg;
  framingStore.selectedItem = {
    Name: star.name,
    RA: star.raDeg,
    Dec: star.decDeg,
  };
  try {
    await apiService.setFramingImageSource('SKYATLAS');
    await apiService.setFramingCoordinates(star.raDeg, star.decDeg);
  } catch (error) {
    console.error('Error updating sky atlas:', error);
  }
}

function calculateAltAz(raDeg, decDeg) {
  const { altitude, azimuth } = raDecToAltAz(
    raDeg,
    decDeg,
    appStore.profileInfo?.AstrometrySettings?.Latitude ?? 0,
    appStore.profileInfo?.AstrometrySettings?.Longitude ?? 0
  );
  const direction = getDirection(azimuth);
  return { alt: altitude, az: azimuth, direction: direction };
}

function getDirection(az) {
  if (az >= 337.5 || az < 22.5) {
    return 'N';
  } else if (az >= 22.5 && az < 67.5) {
    return 'NE';
  } else if (az >= 67.5 && az < 112.5) {
    return 'E';
  } else if (az >= 112.5 && az < 157.5) {
    return 'SE';
  } else if (az >= 157.5 && az < 202.5) {
    return 'S';
  } else if (az >= 202.5 && az < 247.5) {
    return 'SW';
  } else if (az >= 247.5 && az < 292.5) {
    return 'W';
  } else {
    return 'NW';
  }
}

function updateSiderealTime() {
  const now = new Date(timeSync.getServerTime());
  const JD = now / 86400000 - now.getTimezoneOffset() / 1440 + 2440587.5;
  const GMST = 18.697374558 + 24.06570982441908 * (JD - 2451545.0);
  currentSiderealTime.value =
    (GMST % 24) * 15 + (appStore.profileInfo?.AstrometrySettings?.Longitude ?? 0) / 15;
}

async function slew() {
  let RA_deg, DEC_deg;
  RA_deg = hmsToDegrees(framingStore.RAangleString);
  DEC_deg = dmsToDegrees(framingStore.DECangleString);
  try {
    await apiService.setFramingCoordinates(RA_deg, DEC_deg);
  } catch (error) {
    console.error('Error during slew:', error);
  }
}
</script>
