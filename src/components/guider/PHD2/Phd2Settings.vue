<template>
  <div class="flex flex-col gap-2 sm:gap-4">
    <!-- Dark Library Build Banner -->
    <div
      v-if="store.isPINS && guiderStore.isDarkLibraryBuildActive"
      class="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/40"
    >
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-yellow-200">
            {{ $t('components.guider.phd2.darkLibrary.buildActive') }}
          </div>
          <div class="text-xs text-yellow-100/80">
            {{ $t('components.guider.phd2.darkLibrary.buildActiveMessage') }}
          </div>
          <div v-if="guiderStore.phd2DarkLibraryBuildStatus" class="text-xs text-gray-200 mt-1">
            {{
              $t('components.guider.phd2.darkLibrary.buildProgress', {
                frame: guiderStore.phd2DarkLibraryBuildStatus.Frame ?? 0,
                total: guiderStore.phd2DarkLibraryBuildStatus.TotalFrames ?? 0,
                exposure: ((guiderStore.phd2DarkLibraryBuildStatus.ExposureMs ?? 0) / 1000).toFixed(
                  1
                ),
              })
            }}
          </div>
        </div>
        <button
          @click="guiderStore.cancelPHD2DarkLibraryBuild()"
          class="default-button-red px-3 py-1 text-xs"
        >
          {{ $t('components.guider.phd2.darkLibrary.cancel') }}
        </button>
      </div>
    </div>

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

    <!-- Image Display Settings -->
    <div
      v-if="showImageDisplay"
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.guider.phd2.imageDisplay') }}
      </h3>
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-300">
            {{ $t('components.guider.phd2.imageGamma') }}
          </span>
          <span class="text-sm text-gray-400">
            {{ settingsStore.guider.phd2ImageGamma.toFixed(2) }}
          </span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          :value="settingsStore.guider.phd2ImageGamma"
          @input="settingsStore.setPhd2ImageGamma(parseFloat($event.target.value))"
          class="w-full accent-cyan-400"
        />
        <div class="flex justify-between text-xs text-gray-500">
          <span>{{ $t('components.guider.phd2.imageGammaHint') }}</span>
        </div>
      </div>
    </div>

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

      <!-- Mount Settings -->
      <div
        class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
      >
        <h3 class="font-bold text-base text-cyan-400">
          {{ $t('components.guider.phd2.mountSettings') }}
        </h3>
        <MountGuideRate />
      </div>

      <!-- Dark Library -->
      <div
        class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
      >
        <h3 class="font-bold text-base text-cyan-400">
          {{ $t('components.guider.phd2.darkLibrary.title') }}
        </h3>
        <Phd2DarkLibrary />
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
import Phd2DarkLibrary from '@/components/guider/PHD2/pins/Phd2DarkLibrary.vue';
import MountGuideRate from '@/components/guider/PHD2/pins/MountGuideRate.vue';
import { computed } from 'vue';
import { apiStore } from '@/store/store';

const guiderStore = useGuiderStore();
const settingsStore = useSettingsStore();
const store = apiStore();

const showImageDisplay = computed(
  () => store.isPINS || store.checkVersionNewerOrEqual(store.currentTnsPluginVersion, '1.2.7.3')
);
</script>
