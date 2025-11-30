<template>
  <div class="p-4 flex flex-col gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
    <PHD2Profil />
  </div>
  <div v-if="guiderStore.phd2IsConnected" class="flex flex-col gap-1">
    <div class="p-4 flex flex-col gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <!-- Force Calibration Toggle -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-300">
          {{ $t('components.guider.phd2.forceCalibration') }}
        </span>
        <toggleButton
          @click="settingsStore.setPhd2ForceCalibration(!settingsStore.guider.phd2ForceCalibration)"
          :status-value="settingsStore.guider.phd2ForceCalibration"
        />
      </div>
    </div>
    <div class="p-4 flex flex-col gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <SetExposure />
    </div>
    <div class="p-4 flex flex-col gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <SetRaAlgoPara />
    </div>
    <div class="p-4 flex flex-col gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <SetDecAlgoPara />
    </div>
  </div>
</template>

<script setup>
import { useGuiderStore } from '@/store/guiderStore';
import { useSettingsStore } from '@/store/settingsStore';
import SetExposure from '@/components/guider/PHD2/SetExposure.vue';
import SetRaAlgoPara from '@/components/guider/PHD2/SetRaAlgoPara.vue';
import SetDecAlgoPara from '@/components/guider/PHD2/SetDecAlgoPara.vue';
import PHD2Profil from '@/components/guider/PHD2/PHD2Profil.vue';
import toggleButton from '@/components/helpers/toggleButton.vue';

const guiderStore = useGuiderStore();
const settingsStore = useSettingsStore();
</script>
