<template>
  <div>
    <!-- Modal Overlay -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <div
        class="bg-gray-800 text-white p-4 rounded-lg min-w-[400px] max-w-4xl max-h-[80vh] min-h-48 overflow-y-auto"
      >
        <div class="flex justify-end items-center">
          <button @click="isModalOpen = false" class="text-white hover:text-gray-300">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <div>
          <h2 class="text-xl font-bold mb-4">{{ $t('components.slewAndCenter.title') }}</h2>
          <ul>
            <li
              v-for="(msg, index) in lastCenterMessages.slice().reverse()"
              :key="index"
              :style="{ color: msg.color }"
            >
              <div v-if="!centeringDone" class="flex items-center gap-2">
                <span class="spinner"></span>
                <span>{{ msg.message }}</span>
              </div>
              <div v-else class="flex items-center gap-2">
                <span>{{ formatTime(msg.timestamp) }} -</span>
                <span>{{ msg.message }}</span>
              </div>
            </li>
          </ul>
          <div v-if="centeringSeparation.distance" class="mt-2">
            <p class="text-gray-400 text-sm">
              {{ $t('components.slewAndCenter.slew_modal.deviation_target') }}
              {{ centeringSeparation.distance }}
            </p>
          </div>
        </div>
        <div class="flex items-center justify-center w-full mt-4">
          <ButtonSlewStop class="p-2" @click="isModalOpen = flase" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { useLogStore } from '@/store/logStore';
import { useI18n } from 'vue-i18n';
import { formatTime } from '@/utils/utils';
import ButtonSlewStop from '@/components/mount/ButtonSlewStop.vue';
import { apiStore } from '@/store/store';

const { t } = useI18n();
const logStore = useLogStore();
const store = apiStore();
const isModalOpen = ref(false);
let lastProcessedTimestamp = new Date();
const lastCenterMessages = ref([]);
const centeringDone = ref(false);
const centeringSeparation = ref({ distance: null });

function openModal() {
  isModalOpen.value = true;
  lastCenterMessages.value = [
    {
      timestamp: new Date().toISOString(),
      message: t('components.slewAndCenter.slew_modal.is_slewing'),
      color: 'inherit',
    },
  ];
}

defineExpose({ openModal });

watch(
  () => logStore.LogsInfo.logs,
  (newLogs) => {
    if (!newLogs || newLogs.length === 0) return;

    // Sortiere aufsteigend nach Timestamp:
    const sortedLogs = [...newLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    for (const entry of sortedLogs) {
      let message;
      let color = 'inherit';

      if (
        entry.message.includes('Centering Solver - Scope Position:') &&
        centeringDone.value === true
      ) {
        const regex =
          /RA:\s([\d:]+);\sDec:\s([\d°'\s"]+);\sEpoch:\s(\w+);.*?Solved: RA:\s([\d:]+);\sDec:\s([\d°'\s"]+);\sEpoch:\s(\w+); Separation RA:\s([-\d:]+);\sDec:\s([-\d°'\s"]+);.*?Distance:\s([\d°'\s"]+);.*?Bearing:\s([-\d°'\s"]+);.*?Threshold:\s(\d+)/;
        const match = entry.message.match(regex);
        if (match) {
          const centeringData = {
            initialRA: match[1],
            initialDec: match[2],
            initialEpoch: match[3],
            solvedRA: match[4],
            solvedDec: match[5],
            solvedEpoch: match[6],
            separationRA: match[7],
            separationDec: match[8],
            distance: match[9],
            bearing: match[10],
            threshold: match[11],
          };
          centeringSeparation.value = centeringData;
        }
      }

      // Nur neue Einträge
      if (lastProcessedTimestamp && new Date(entry.timestamp) <= new Date(lastProcessedTimestamp)) {
        continue;
      }

      if (
        entry.message.includes('Slewing from framing assistant to ') ||
        entry.message.includes('Slewing from RA')
      ) {
        message = t('components.slewAndCenter.slew_modal.is_slewing');
        centeringSeparation.value.distance = null;
        centeringDone.value = false;
      } else if (entry.message.includes('Centering from framing assistant to RA:')) {
        message = t('components.slewAndCenter.slew_modal.is_centering');
        centeringSeparation.value.distance = null;
      } else if (entry.message.includes('Platesolving with parameters')) {
        message = t('components.slewAndCenter.slew_modal.is_platesolving');
      } else if (entry.message.includes('Platesolve failed')) {
        message = t('components.slewAndCenter.slew_modal.plate_solve_error');
        color = 'red';
      } else if (
        entry.message.includes('Cancelling centering after') ||
        entry.message.includes('Instruction failed after')
      ) {
        message = t('components.slewAndCenter.slew_modal.center_error');
        color = 'red';
        centeringDone.value = true;
      } else if (entry.message.includes('Finishing Category: , Item: Center')) {
        message = t('components.slewAndCenter.slew_modal.center_successful');
        color = 'green';
        centeringDone.value = true;
      } else if (entry.message.includes('Centering Solver - Scope Position:')) {
        const regex =
          /RA:\s([\d:]+);\sDec:\s([\d°'\s"]+);\sEpoch:\s(\w+);.*?Solved: RA:\s([\d:]+);\sDec:\s([\d°'\s"]+);\sEpoch:\s(\w+); Separation RA:\s([-\d:]+);\sDec:\s([-\d°'\s"]+);.*?Distance:\s([\d°'\s"]+);.*?Bearing:\s([-\d°'\s"]+);.*?Threshold:\s(\d+)/;
        const match = entry.message.match(regex);
        if (match) {
          const centeringData = {
            initialRA: match[1],
            initialDec: match[2],
            initialEpoch: match[3],
            solvedRA: match[4],
            solvedDec: match[5],
            solvedEpoch: match[6],
            separationRA: match[7],
            separationDec: match[8],
            distance: match[9],
            bearing: match[10],
            threshold: match[11],
          };
          centeringSeparation.value = centeringData;
          console.log('Centering distance ', centeringData.distance);
          message = t('components.slewAndCenter.slew_modal.center_Repeat');

          const distanceMatch = centeringData.distance.match(/(\d+)°\s*(\d+)'\s*(\d+)"/);
          if (distanceMatch) {
            const degrees = parseInt(distanceMatch[1]);
            const arcminutes = parseInt(distanceMatch[2]);
            const arcseconds = parseInt(distanceMatch[3]);
            const totalArcseconds = degrees * 3600 + arcminutes * 60 + arcseconds;

            console.log('distance arcseconds:', totalArcseconds);

            if (totalArcseconds < store.profileInfo.PlateSolveSettings.Threshold * 60) {
              message = t('components.slewAndCenter.slew_modal.center_successful');
              color = 'green';
              centeringDone.value = true;
            }
          }
        }
      } else if (entry.message.includes('Starting Exposure')) {
        message = t('components.slewAndCenter.slew_modal.exposure_running');
      } else {
        continue;
      }

      // Speichere Einträge (max. 1)
      lastCenterMessages.value.push({
        timestamp: entry.timestamp,
        message,
        color,
      });

      if (lastCenterMessages.value.length > 1) {
        lastCenterMessages.value.shift();
      }
      lastProcessedTimestamp = entry.timestamp;
    }
  },
  { deep: true }
);
</script>
<style scoped>
.spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid #bbb;
  border-top-color: #333;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
