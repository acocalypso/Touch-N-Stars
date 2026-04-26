<template>
  <div class="flex flex-col gap-2 sm:gap-4">
    <!-- PHD2 Profile -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.guider.phd2.profile') }}
      </h3>
      <PHD2Profil />
    </div>

    <template v-if="guiderStore.phd2IsConnected">
      <!-- Calibration Settings -->
      <div
        class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
      >
        <h3 class="font-bold text-base text-cyan-400">
          {{ $t('components.guider.phd2.calibration') }}
        </h3>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-300">
            {{ $t('components.guider.phd2.forceCalibration') }}
          </span>
          <toggleButton
            @click="
              settingsStore.setPhd2ForceCalibration(!settingsStore.guider.phd2ForceCalibration)
            "
            :status-value="settingsStore.guider.phd2ForceCalibration"
          />
        </div>
      </div>

      <!-- Exposure Settings -->
      <div
        class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
      >
        <h3 class="font-bold text-base text-cyan-400">
          {{ $t('components.guider.phd2.exposure') }}
        </h3>
        <SetExposure />
      </div>

      <!-- RA Algorithm -->
      <div
        class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
      >
        <h3 class="font-bold text-base text-cyan-400">
          {{ $t('components.guider.phd2.raAlgorithm') }}
        </h3>
        <SetRaAlgoPara />
      </div>

      <!-- DEC Algorithm -->
      <div
        class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
      >
        <h3 class="font-bold text-base text-cyan-400">
          {{ $t('components.guider.phd2.decAlgorithm') }}
        </h3>
        <SetDecAlgoPara />
      </div>
    </template>

    <template v-if="store.isPINS">
      <!-- Shared Parameters (always visible) -->
      <div
        class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
      >
        <h3 class="font-bold text-base text-cyan-400">
          {{ $t('components.guider.phd2.shared_prarmeters') }}
        </h3>
        <Phd2ReverseDecAfterFlip />
        <Phd2UseMultipleStars />
      </div>
      <!-- Camera Settings -->
      <div
        class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
      >
        <h3 class="font-bold text-base text-cyan-400">
          {{ $t('components.guider.phd2.camera') }}
        </h3>
        <Phd2CameraGain />
        <Phd2CameraBinning />
      </div>

      <!-- Calibration Settings -->
      <div
        class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
      >
        <h3 class="font-bold text-base text-cyan-400">
          {{ $t('components.guider.phd2.calibration') }}
        </h3>
        <Phd2FocalLength />
        <Phd2CalibrationStep />
        <Phd2RestoreCalibration />
      </div>

      <!-- Guide Algorithm Settings -->
      <div
        class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
      >
        <h3 class="font-bold text-base text-cyan-400">
          {{ $t('components.guider.phd2.guideAlgorithm') }}
        </h3>
        <Phd2GuideAlgorithmRA />
        <Phd2GuideAlgorithmDEC />
      </div>
    </template>
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
import Phd2FocalLength from '@/components/guider/PHD2/pins/Phd2FocalLength.vue';
import Phd2CalibrationStep from '@/components/guider/PHD2/pins/Phd2CalibrationStep.vue';
import Phd2ReverseDecAfterFlip from '@/components/guider/PHD2/pins/Phd2ReverseDecAfterFlip.vue';
import Phd2UseMultipleStars from '@/components/guider/PHD2/pins/Phd2UseMultipleStars.vue';
import Phd2GuideAlgorithmRA from '@/components/guider/PHD2/pins/Phd2GuideAlgorithmRA.vue';
import Phd2GuideAlgorithmDEC from '@/components/guider/PHD2/pins/Phd2GuideAlgorithmDEC.vue';
import Phd2CameraGain from '@/components/guider/PHD2/pins/Phd2CameraGain.vue';
import Phd2CameraBinning from '@/components/guider/PHD2/pins/Phd2CameraBinning.vue';
import Phd2RestoreCalibration from '@/components/guider/PHD2/pins/Phd2RestoreCalibration.vue';
import { apiStore } from '@/store/store';

const guiderStore = useGuiderStore();
const settingsStore = useSettingsStore();
const store = apiStore();
</script>
