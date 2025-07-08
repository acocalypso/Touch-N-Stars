<template>
  <div class="container flex items-center justify-center">
    <div class="container max-w-md">
      <h5 class="text-xl text-gray-300 font-bold mb-4">
        {{ $t('components.framing.search.title') }}
      </h5>

      <div class="text-black mx-auto">
        <input
          type="text"
          v-model="searchQuery"
          ref="searchInput"
          @input="fetchTargetSearch"
          class="default-input h-10 w-full"
          :placeholder="$t('components.framing.search.placeholder')"
        />
        <!-- Überprüfe, ob targetSearchResult ein Array ist und Elemente hat -->
        <ul
          v-if="Array.isArray(targetSearchResult) && targetSearchResult.length > 0"
          class="default-select mt-1 z-10"
        >
          <li
            v-for="(item, index) in targetSearchResult"
            :key="index"
            class="p-2 hover:bg-blue-700 cursor-pointer"
            @click="selectTarget(item)"
          >
            {{ item.Name }}
            <span v-if="item['Common names']"> ({{ item['Common names'] }})</span>
            <span v-if="item['M']"> (M {{ item['M'] }})</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, defineExpose } from 'vue';
import apiService from '@/services/apiService';
import { useStellariumStore } from '@/store/stellariumStore';
import { rad2deg } from '@/utils/utils';
import { Capacitor } from '@capacitor/core';

const stellariumStore = useStellariumStore();
const searchQuery = ref('');
const targetSearchResult = ref([]);
const searchInput = ref(null);

const celestialBodies = [
  { Name: 'Sun', Type: 'Star' },
  { Name: 'Mercury', Type: 'Planet' },
  { Name: 'Venus', Type: 'Planet' },
  { Name: 'Moon', Type: 'Moon' },
  { Name: 'Mars', Type: 'Planet' },
  { Name: 'Jupiter', Type: 'Planet' },
  { Name: 'Saturn', Type: 'Planet' },
  { Name: 'Uranus', Type: 'Planet' },
  { Name: 'Neptune', Type: 'Planet' },
  { Name: 'Pluto', Type: 'Planet' },
];

async function fetchTargetSearch() {
  if (searchQuery.value.trim() === '') {
    targetSearchResult.value = [];
    return;
  }
  try {
    const data = await apiService.searchNGC(searchQuery.value, 10);
    let results = Array.isArray(data) ? data : [];

    // Planeten zur Liste hinzufügen, falls sie dem Suchbegriff entsprechen
    const celestialBodiesResults = celestialBodies.filter((body) =>
      body.Name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );

    targetSearchResult.value = [...results, ...celestialBodiesResults];
  } catch (error) {
    console.log('Fehler beim Laden der Vorschläge:', error);
    targetSearchResult.value = [];
  }
}

async function selectTarget(item) {
  // Immediately blur input field to dismiss keyboard on iOS
  if (searchInput.value) {
    searchInput.value.blur();
  }

  // Clear search results immediately to prevent further user interaction
  targetSearchResult.value = [];

  // Platform detection for iOS-specific handling using Capacitor
  const isIOS = Capacitor.getPlatform() === 'ios';

  // Extended delay for iOS to ensure keyboard is fully dismissed
  const delayTime = isIOS ? 300 : 10;

  // Wrap the complex operations in setTimeout to prevent iOS UI thread blocking
  setTimeout(async () => {
    try {
      if (item.Type) {
        console.log('Planet' + item.Name);

        const stel = stellariumStore.stel;
        const planetInfo = stel.getObj(`NAME ${item.Name}`).getInfo('pvo', stel.observer);
        const cirs = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', planetInfo[0]);
        const ra = stel.anp(stel.c2s(cirs)[0]); // RA in Radian
        const dec = stel.anpm(stel.c2s(cirs)[1]); // Dec in Radian
        item.RA = rad2deg(ra);
        item.Dec = rad2deg(dec);
      }

      const stel = stellariumStore.stel;
      const ra_rad = item.RA * stel.D2R;
      const dec_rad = item.Dec * stel.D2R;
      const icrfVec = stel.s2c(ra_rad, dec_rad);
      //stel.getObj('NAME Mars').getInfo('pvo', stel.observer); //!!!Workaround damit die Daten richtig berechnet werden NICHT LÖSCHEN
      const observedVec = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', icrfVec);

      // For iOS, we'll use a two-phase approach to update the UI
      if (isIOS) {
        // Phase 1: Create circle but don't select yet
        const targetCircle = stellariumStore.stel.createObj('circle', {
          id: 'targetCircle',
          pos: observedVec,
          color: [0, 0, 0, 0.1],
          size: [0.05, 0.05], // Größe der Markierung
        });

        // Phase 2: Set selection with additional delay
        setTimeout(() => {
          try {
            targetCircle.pos = observedVec;
            targetCircle.update();
            stel.core.selection = targetCircle;
            stel.pointAndLock(targetCircle);
            console.log('Ausgewähltes Objekt:', item);
          } catch (error) {
            console.error('Error in phase 2 selection:', error);
          }
        }, 200);
      } else {
        // Non-iOS devices use the original approach
        const targetCircle = stellariumStore.stel.createObj('circle', {
          id: 'targetCircle',
          pos: observedVec,
          color: [0, 0, 0, 0.1],
          size: [0.05, 0.05], // Größe der Markierung
        });

        targetCircle.pos = observedVec;
        targetCircle.update();
        stel.core.selection = targetCircle;
        stel.pointAndLock(targetCircle);
        console.log('Ausgewähltes Objekt:', item);
      }
    } catch (error) {
      console.error('Error selecting target:', error);
    }
  }, delayTime);
}

// Funktion zum Fokussieren des Suchfelds, wenn es eingeblendet wird
async function focusSearchInput() {
  // Platform detection for iOS-specific handling using Capacitor
  const isIOS = Capacitor.getPlatform() === 'ios';

  await nextTick();

  if (isIOS) {
    // On iOS, add a delay before focusing to prevent UI issues
    setTimeout(() => {
      searchInput.value?.focus();
    }, 150);
  } else {
    searchInput.value?.focus();
  }
}

// Expose function for parent component
defineExpose({ focusSearchInput });
</script>
