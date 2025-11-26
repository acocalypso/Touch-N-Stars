<template>
  <div class="p-4 flex flex-col gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
    <SettingInput
      labelKey="components.focuser.settings.AutoFocusInitialOffsetSteps"
      settingKey="FocuserSettings-AutoFocusInitialOffsetSteps"
      :modelValue="store.profileInfo.FocuserSettings.AutoFocusInitialOffsetSteps"
      :max="100"
    />
    <SettingInput
      labelKey="components.focuser.settings.AutoFocusStepSize"
      settingKey="FocuserSettings-AutoFocusStepSize"
      :modelValue="store.profileInfo.FocuserSettings.AutoFocusStepSize"
    />
    <SettingInput
      labelKey="components.focuser.settings.FocuserSettleTime"
      settingKey="FocuserSettings-FocuserSettleTime"
      :modelValue="store.profileInfo.FocuserSettings.FocuserSettleTime"
    />
    <SettingInput
      labelKey="components.focuser.settings.AutoFocusTotalNumberOfAttempts"
      settingKey="FocuserSettings-AutoFocusTotalNumberOfAttempts"
      :modelValue="store.profileInfo.FocuserSettings.AutoFocusTotalNumberOfAttempts"
    />
    <SettingInput
      labelKey="components.focuser.settings.AutoFocusNumberOfFramesPerPoint"
      settingKey="FocuserSettings-AutoFocusNumberOfFramesPerPoint"
      :modelValue="store.profileInfo.FocuserSettings.AutoFocusNumberOfFramesPerPoint"
    />
    <SettingInput
      labelKey="components.focuser.settings.AutoFocusInnerCropRatio"
      settingKey="FocuserSettings-AutoFocusInnerCropRatio"
      :modelValue="store.profileInfo.FocuserSettings.AutoFocusInnerCropRatio"
    />
    <SettingInput
      labelKey="components.focuser.settings.AutoFocusOuterCropRatio"
      settingKey="FocuserSettings-AutoFocusOuterCropRatio"
      :modelValue="store.profileInfo.FocuserSettings.AutoFocusOuterCropRatio"
    />
    <SettingInput
      labelKey="components.focuser.settings.AutoFocusUseBrightestStars"
      settingKey="FocuserSettings-AutoFocusUseBrightestStars"
      :modelValue="store.profileInfo.FocuserSettings.AutoFocusUseBrightestStars"
    />
    <SettingInput
      labelKey="components.focuser.settings.BacklashIn"
      settingKey="FocuserSettings-BacklashIn"
      :modelValue="store.profileInfo.FocuserSettings.BacklashIn"
    />
    <SettingInput
      labelKey="components.focuser.settings.BacklashOut"
      settingKey="FocuserSettings-BacklashOut"
      :modelValue="store.profileInfo.FocuserSettings.BacklashOut"
    />
    <SettingInput
      labelKey="components.focuser.settings.AutoFocusBinning"
      settingKey="FocuserSettings-AutoFocusBinning"
      :modelValue="store.profileInfo.FocuserSettings.AutoFocusBinning"
    />
    <SettingInput
      labelKey="components.focuser.settings.AutoFocusTimeoutSeconds"
      settingKey="FocuserSettings-AutoFocusTimeoutSeconds"
      :modelValue="store.profileInfo.FocuserSettings.AutoFocusTimeoutSeconds"
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
    />
    <SettingSelect
      labelKey="components.focuser.settings.BacklashCompensationModel"
      settingKey="FocuserSettings-BacklashCompensationModel"
      :modelValue="store.profileInfo.FocuserSettings.BacklashCompensationModel"
      :options="['OVERSHOOT', 'ABSOLUTE']"
    />
    <setAutoFocusDisableGuiding />
  </div>
</template>
<script setup>
import { apiStore } from '@/store/store';
import SettingInput from '@/components/helpers/settings/SettingInput.vue';
import SettingSelect from '@/components/helpers/settings/SettingSelect.vue';
import setAutoFocusDisableGuiding from './setAutoFocusDisableGuiding.vue';

const store = apiStore();
</script>
