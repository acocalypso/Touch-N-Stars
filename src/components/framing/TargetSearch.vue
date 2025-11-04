<template>
  <div class="container flex items-center justify-center">
    <div class="container max-w-md">
      <h5 class="text-xl font-bold mb-4">
        {{ $t('components.framing.search.title') }}
      </h5>

      <FavTargets
        :showSeqTarget="false"
        class="fixed right-5 z-20"
        style="bottom: calc(env(safe-area-inset-bottom, 0px) + 48px)"
      />
      <!-- Search Input -->
      <div class="text-black mx-auto">
        <div class="flex gap-1">
          <input
            type="text"
            v-model="framingStore.searchQuery"
            @input="fetchTargetSearch"
            class="default-input h-10 w-full"
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
          />
        </div>
        <!-- Search Results -->
        <ul
          v-if="
            Array.isArray(framingStore.targetSearchResult) &&
            framingStore.targetSearchResult.length > 0
          "
          class="default-select"
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
          class="default-select h-10 w-full"
          @change="updateRaDec"
        >
          <option v-for="star in visibleStars" :key="star.name" :value="star">
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
        :coordinates="settingsStore.coordinates"
      />

      <!-- Open Framing Modal Button -->
      <div v-if="framingStore.selectedItem" class="mb-4">
        <button @click="framingStore.showFramingModal = true" class="default-button-cyan">
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

    <!-- Framing Modal -->
    <div
      v-if="framingStore.showFramingModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="framingStore.showFramingModal = false"
    >
      <div
        class="bg-gray-900 rounded-lg p-4 overflow-y-auto max-h-[95vh] border border-gray-700 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50"
        :style="{ minWidth: `${framingStore.containerSize}px` }"
        @click.stop
      >
        <FramingAssistangModal />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import Papa from 'papaparse';
import apiService from '@/services/apiService';
import slewAndCenter from '@/components/framing/slewAndCenter.vue';
import TargetPic from '@/components/framing/TargetPic.vue';
import controlUseNinaCache from '@/components/framing/controlUseNinaCache.vue';
import FramingAssistangModal from '@/components/framing/FramingAssistangModal.vue';
import { useFramingStore } from '@/store/framingStore';
import { useSettingsStore } from '@/store/settingsStore';
import SkyChart from '@/components/framing/SkyChart.vue';
import FavTargets from '@/components/favTargets/FavTargets.vue';
import SaveFavTargets from '@/components/favTargets/SaveFavTargets.vue';
import { raDecToAltAz, degreesToHMS, degreesToDMS } from '@/utils/utils';

const framingStore = useFramingStore();
const settingsStore = useSettingsStore();
const stars = ref([]);
const selectedStar = ref(null);
const currentSiderealTime = ref(0);

// Computed property to filter visible stars and calculate Alt/Az.
const visibleStars = computed(() => {
  return stars.value
    .map((star) => {
      const altAz = calculateAltAz(star.raDeg, star.decDeg);
      return { ...star, altAz };
    })
    .filter((star) => star.altAz.alt > 0)
    .sort((a, b) => parseFloat(b.altAz.alt) - parseFloat(a.altAz.alt));
});

async function fetchTargetSearch() {
  if (framingStore.searchQuery.trim() === '') {
    framingStore.targetSearchResult = [];
    return;
  }
  try {
    const data = await apiService.searchNGC(framingStore.searchQuery, 10);
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
}

onMounted(async () => {
  framingStore.height = 200;
  framingStore.width = 200;
  framingStore.fov = 2;
  await loadStarData();
  updateSiderealTime();
  setInterval(updateSiderealTime, 1000);
  const smallerDimension = Math.min(window.innerWidth, window.innerHeight - 200);
  const roundedDimension = Math.floor(smallerDimension / 100) * 100;
  framingStore.containerSize = roundedDimension;
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
  if (selectedStar.value) {
    framingStore.RAangleString = degreesToHMS(selectedStar.value.raDeg);
    framingStore.DECangleString = degreesToDMS(selectedStar.value.decDeg);
    framingStore.RAangle = selectedStar.value.raDeg;
    framingStore.DECangle = selectedStar.value.decDeg;
    framingStore.selectedItem = {
      Name: selectedStar.value.name,
      RA: selectedStar.value.raDeg,
      Dec: selectedStar.value.decDeg,
    };
    try {
      await apiService.setFramingImageSource('SKYATLAS');
      await apiService.setFramingCoordinates(selectedStar.value.raDeg, selectedStar.value.decDeg);
    } catch (error) {
      console.error('Error updating sky atlas:', error);
    }
  }
}

function calculateAltAz(raDeg, decDeg) {
  const { altitude, azimuth } = raDecToAltAz(
    raDeg,
    decDeg,
    settingsStore.coordinates.latitude,
    settingsStore.coordinates.longitude
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
  const now = new Date();
  const JD = now / 86400000 - now.getTimezoneOffset() / 1440 + 2440587.5;
  const GMST = 18.697374558 + 24.06570982441908 * (JD - 2451545.0);
  currentSiderealTime.value = (GMST % 24) * 15 + settingsStore.coordinates.longitude / 15;
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
