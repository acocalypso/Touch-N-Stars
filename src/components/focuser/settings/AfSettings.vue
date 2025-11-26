<template>
    <div class="p-4 flex flex-col gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
        <SettingInput
          labelKey="AutoFocusInitialOffsetSteps"
          settingKey="AutoFocusInitialOffsetSteps"
          storeKey="AutoFocusInitialOffsetSteps"
          :max="100"
        />
        <SettingInput
          labelKey="AutoFocusStepSize"
          settingKey="AutoFocusStepSize"
          storeKey="AutoFocusStepSize"
        />
        <SettingInput
          labelKey="FocuserSettleTime"
          settingKey="FocuserSettleTime"
          storeKey="FocuserSettleTime"
        />
        <SettingInput
          labelKey="AutoFocusTotalNumberOfAttempts"
          settingKey="AutoFocusTotalNumberOfAttempts"
          storeKey="AutoFocusTotalNumberOfAttempts"
        />
        <SettingInput
          labelKey="AutoFocusNumberOfFramesPerPoint"
          settingKey="AutoFocusNumberOfFramesPerPoint"
          storeKey="AutoFocusNumberOfFramesPerPoint"
        />
        <SettingInput
          labelKey="AutoFocusInnerCropRatio"
          settingKey="AutoFocusInnerCropRatio"
          storeKey="AutoFocusInnerCropRatio"
        />
        <SettingInput
          labelKey="AutoFocusOuterCropRatio"
          settingKey="AutoFocusOuterCropRatio"
          storeKey="AutoFocusOuterCropRatio"
        />
        <SettingInput
          labelKey="AutoFocusUseBrightestStars"
          settingKey="AutoFocusUseBrightestStars"
          storeKey="AutoFocusUseBrightestStars"
        />
        <SettingInput
          labelKey="BacklashIn"
          settingKey="BacklashIn"
          storeKey="BacklashIn"
        />
        <SettingInput
          labelKey="BacklashOut"
          settingKey="BacklashOut"
          storeKey="BacklashOut"
        />
        <SettingInput
          labelKey="AutoFocusBinning"
          settingKey="AutoFocusBinning"
          storeKey="AutoFocusBinning"
        />
        <SettingInput
          labelKey="AutoFocusTimeoutSeconds"
          settingKey="AutoFocusTimeoutSeconds"
          storeKey="AutoFocusTimeoutSeconds"
        />
        <SettingInput
          labelKey="RSquaredThreshold"
          settingKey="RSquaredThreshold"
          storeKey="RSquaredThreshold"
          :min="0"
          :max="1"
          step="0.1"
        />
        <SettingSelect
          labelKey="AutoFocusFitFunction"
          settingKey="AutoFocusCurveFitting"
          storeKey="AutoFocusCurveFitting"
          :options="['TRENDLINES', 'PARABOLIC', 'TRENDPARABOLIC', 'HYPERBOLIC', 'TRENDHYPERBOLIC']"
        />
        <setAutoFocusDisableGuiding />
    </div>
</template>
<script setup >
import SettingInput from '@/components/helpers/settings/SettingInput.vue';
import SettingSelect from '@/components/helpers/settings/SettingSelect.vue';
import setAutoFocusDisableGuiding from './setAutoFocusDisableGuiding.vue';

</script>