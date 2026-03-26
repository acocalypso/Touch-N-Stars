<template>
  <div class="flex flex-col gap-2 sm:gap-4">
    <!-- General Settings Container -->
    <div
      v-if="store.isPINS"
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.focuser.settings.general') }}
      </h3>
      <setFocuserMaxStep />
    </div>

    <!-- AutoFocus Settings Container -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.focuser.settings.autofocus') }}
      </h3>
      <setFocuserUseFilterOffset />
      <SettingInput
        labelKey="components.focuser.settings.AutoFocusExposureTime"
        settingKey="FocuserSettings-AutoFocusExposureTime"
        :modelValue="store.profileInfo.FocuserSettings.AutoFocusExposureTime"
        :max="9999"
      />
      <SettingInput
        labelKey="components.focuser.settings.AutoFocusInitialOffsetSteps"
        settingKey="FocuserSettings-AutoFocusInitialOffsetSteps"
        :modelValue="store.profileInfo.FocuserSettings.AutoFocusInitialOffsetSteps"
        :max="10"
      />
      <SettingInput
        labelKey="components.focuser.settings.AutoFocusStepSize"
        settingKey="FocuserSettings-AutoFocusStepSize"
        :modelValue="store.profileInfo.FocuserSettings.AutoFocusStepSize"
        :max="1000"
      />
      <SettingInput
        labelKey="components.focuser.settings.FocuserSettleTime"
        settingKey="FocuserSettings-FocuserSettleTime"
        :modelValue="store.profileInfo.FocuserSettings.FocuserSettleTime"
        :max="1000"
      />
      <SettingInput
        labelKey="components.focuser.settings.AutoFocusTotalNumberOfAttempts"
        settingKey="FocuserSettings-AutoFocusTotalNumberOfAttempts"
        :modelValue="store.profileInfo.FocuserSettings.AutoFocusTotalNumberOfAttempts"
        :max="50"
      />
      <SettingInput
        labelKey="components.focuser.settings.AutoFocusNumberOfFramesPerPoint"
        settingKey="FocuserSettings-AutoFocusNumberOfFramesPerPoint"
        :modelValue="store.profileInfo.FocuserSettings.AutoFocusNumberOfFramesPerPoint"
        :max="50"
      />
    </div>

    <!-- Crop & Stars Container -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.focuser.settings.crop_and_stars') }}
      </h3>
      <SettingInput
        labelKey="components.focuser.settings.AutoFocusInnerCropRatio"
        settingKey="FocuserSettings-AutoFocusInnerCropRatio"
        :modelValue="store.profileInfo.FocuserSettings.AutoFocusInnerCropRatio"
        :min="0.2"
        :max="1"
        step="0.1"
      />
      <SettingInput
        labelKey="components.focuser.settings.AutoFocusOuterCropRatio"
        settingKey="FocuserSettings-AutoFocusOuterCropRatio"
        :modelValue="store.profileInfo.FocuserSettings.AutoFocusOuterCropRatio"
        :min="0.2"
        :max="1"
        step="0.1"
      />
      <SettingInput
        labelKey="components.focuser.settings.AutoFocusUseBrightestStars"
        settingKey="FocuserSettings-AutoFocusUseBrightestStars"
        :modelValue="store.profileInfo.FocuserSettings.AutoFocusUseBrightestStars"
        max="9999"
      />
    </div>

    <!-- Backlash Container -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.focuser.settings.backlash') }}
      </h3>
      <SettingInput
        labelKey="components.focuser.settings.BacklashIn"
        settingKey="FocuserSettings-BacklashIn"
        :modelValue="store.profileInfo.FocuserSettings.BacklashIn"
        max="9999"
      />
      <SettingInput
        labelKey="components.focuser.settings.BacklashOut"
        settingKey="FocuserSettings-BacklashOut"
        :modelValue="store.profileInfo.FocuserSettings.BacklashOut"
        max="9999"
      />
      <SettingSelect
        labelKey="components.focuser.settings.BacklashCompensationModel"
        settingKey="FocuserSettings-BacklashCompensationModel"
        :modelValue="store.profileInfo.FocuserSettings.BacklashCompensationModel"
        :options="['OVERSHOOT', 'ABSOLUTE']"
        translationPrefix="components.focuser.settings."
      />
    </div>

    <!-- Advanced Container -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.focuser.settings.advanced') }}
      </h3>
      <SettingInput
        labelKey="components.focuser.settings.AutoFocusBinning"
        settingKey="FocuserSettings-AutoFocusBinning"
        :modelValue="store.profileInfo.FocuserSettings.AutoFocusBinning"
        max="9"
      />
      <SettingInput
        labelKey="components.focuser.settings.AutoFocusTimeoutSeconds"
        settingKey="FocuserSettings-AutoFocusTimeoutSeconds"
        :modelValue="store.profileInfo.FocuserSettings.AutoFocusTimeoutSeconds"
        :max="9999"
      />
      <SettingInput
        labelKey="components.focuser.settings.RSquaredThreshold"
        settingKey="FocuserSettings-RSquaredThreshold"
        :modelValue="store.profileInfo.FocuserSettings.RSquaredThreshold"
        :min="0"
        :max="1"
        step="0.1"
      />
      <SettingSelect
        labelKey="components.focuser.settings.AutoFocusFitFunction"
        settingKey="FocuserSettings-AutoFocusCurveFitting"
        :modelValue="store.profileInfo.FocuserSettings.AutoFocusCurveFitting"
        :options="['TRENDLINES', 'PARABOLIC', 'TRENDPARABOLIC', 'HYPERBOLIC', 'TRENDHYPERBOLIC']"
        translationPrefix="components.focuser.settings."
      />
      <setAutoFocusDisableGuiding />
    </div>
    <!-- Device specific settings container -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.focuser.settings.deviceSpecific') }}
      </h3>
      <pinsSetMotorSpeedControl
        v-if="store.isPINS && focuserStore.focuserSettings?.HasMotorSpeedControl"
      />
      <pinsSetBeepOnMove v-if="store.isPINS" />
      <pinsSetBeepOnStartup v-if="store.isPINS" />
      <pinsSetStallDetection v-if="store.isPINS" />
      <pinsSetHeating v-if="store.isPINS" />
      <pinsSetHeatingTemperature v-if="store.isPINS" />
      <pinsSetUSBCapacity v-if="store.isPINS" />
      <pinsSetFocuserAlias v-if="store.isPINS" />
      <pinsClearStall v-if="store.isPINS" />
      <pinsResetPosition v-if="store.isPINS" />
    </div>
  </div>
</template>

<script setup>
import { apiStore } from '@/store/store';
import SettingInput from '@/components/helpers/settings/UpdatePorfileNumber.vue';
import SettingSelect from '@/components/helpers/settings/SettingProfilSelect.vue';
import setAutoFocusDisableGuiding from './settings/setAutoFocusDisableGuiding.vue';
import setFocuserUseFilterOffset from './settings/setFocuserUseFilterOffset.vue';
import setFocuserMaxStep from './settings/setFocuserMaxStep.vue';
import pinsSetMotorSpeedControl from './settingsPins/pinsSetMotorSpeedControl.vue';
import pinsSetBeepOnMove from './settingsPins/pinsSetBeepOnMove.vue';
import pinsSetBeepOnStartup from './settingsPins/pinsSetBeepOnStartup.vue';
import pinsSetStallDetection from './settingsPins/pinsSetStallDetection.vue';
import pinsSetHeating from './settingsPins/pinsSetHeating.vue';
import pinsSetHeatingTemperature from './settingsPins/pinsSetHeatingTemperature.vue';
import pinsSetUSBCapacity from './settingsPins/pinsSetUSBCapacity.vue';
import pinsSetFocuserAlias from './settingsPins/pinsSetFocuserAlias.vue';
import pinsClearStall from './settingsPins/pinsClearStall.vue';
import pinsResetPosition from './settingsPins/pinsResetPosition.vue';
import { useFocuserStore } from '@/store/focuserStore';

const store = apiStore();
const focuserStore = useFocuserStore();
</script>
