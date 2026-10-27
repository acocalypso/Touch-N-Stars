<template>
  <div class="flex flex-col gap-4">
    <SegmentTabs v-model="activeTab" :tabs="tabs" />

    <!-- Optional leading tab, e.g. the Hocus Focus essentials -->
    <slot v-if="activeTab === 'simple'" name="simple" />

    <!-- General Settings Container -->
    <div v-if="activeTab === 'general'" class="tns-card flex flex-col gap-3">
      <setFocuserMaxStep />
    </div>

    <!-- AutoFocus Settings Container -->
    <div v-if="activeTab === 'autofocus'" class="tns-card flex flex-col gap-3">
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
        :max="100000"
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
    <div v-if="activeTab === 'crop_and_stars'" class="tns-card flex flex-col gap-3">
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
    <div v-if="activeTab === 'backlash'" class="tns-card flex flex-col gap-3">
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
    <div v-if="activeTab === 'advanced'" class="tns-card flex flex-col gap-3">
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
      <ProfileToggle
        class="rounded-control border border-line p-1"
        labelKey="components.focuser.settings.AutoFocusDisableGuiding"
        settingKey="FocuserSettings-AutoFocusDisableGuiding"
      />
    </div>
    <!-- Device specific settings container -->
    <div v-if="activeTab === 'deviceSpecific'" class="tns-card flex flex-col gap-3">
      <pinsSetMotorSpeedControl
        v-if="store.isPINS && focuserStore.focuserSettings?.HasMotorSpeedControl"
      />
      <template v-if="store.isPINS">
        <PinsSettingToggle
          v-for="setting in ['BeepOnMove', 'BeepOnStartup', 'StallDetection', 'Heating']"
          :key="setting"
          device="focuser"
          :settingName="setting"
          :labelKey="`components.focuser.settings.${setting}`"
        />
      </template>
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
import ProfileToggle from '@/components/helpers/settings/ProfileToggle.vue';
import setFocuserUseFilterOffset from './settings/setFocuserUseFilterOffset.vue';
import setFocuserMaxStep from './settings/setFocuserMaxStep.vue';
import pinsSetMotorSpeedControl from './settingsPins/pinsSetMotorSpeedControl.vue';
import PinsSettingToggle from '@/components/helpers/settings/PinsSettingToggle.vue';
import pinsSetHeatingTemperature from './settingsPins/pinsSetHeatingTemperature.vue';
import pinsSetUSBCapacity from './settingsPins/pinsSetUSBCapacity.vue';
import pinsSetFocuserAlias from './settingsPins/pinsSetFocuserAlias.vue';
import pinsClearStall from './settingsPins/pinsClearStall.vue';
import pinsResetPosition from './settingsPins/pinsResetPosition.vue';
import SegmentTabs from '@/components/helpers/SegmentTabs.vue';
import { useFocuserStore } from '@/store/focuserStore';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  // Label of a leading tab that renders the `simple` slot; no such tab without it
  simpleLabel: { type: String, default: '' },
});

const { t } = useI18n();
const store = apiStore();
const focuserStore = useFocuserStore();

const hasDeviceSettings = computed(() => focuserStore.focuserSettings != null);

const tabs = computed(() => [
  ...(props.simpleLabel ? [{ value: 'simple', label: props.simpleLabel }] : []),
  ...[
    // General holds only the max step, which hides itself on focusers that cannot set it
    ...(store.isPINS && store.focuserInfo.CanSetMaxStep ? ['general'] : []),
    'autofocus',
    'crop_and_stars',
    'backlash',
    'advanced',
    ...(store.isPINS && hasDeviceSettings.value ? ['deviceSpecific'] : []),
  ].map((value) => ({ value, label: t(`components.focuser.settings.${value}`) })),
]);
const activeTab = ref(tabs.value[0].value);

// A tab can vanish (PINS check resolves, device settings or Hocus Focus go away): fall back to
// the first one instead of showing nothing.
watch(tabs, (list) => {
  if (!list.some((tab) => tab.value === activeTab.value)) activeTab.value = list[0].value;
});
// The leading tab is the recommended start; open it once it shows up after the async HF probe.
watch(
  () => props.simpleLabel,
  (label, previous) => {
    if (label && !previous) activeTab.value = 'simple';
  }
);
</script>
