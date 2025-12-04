<template>
  <div class="flex flex-col gap-2 sm:gap-4">
    <!-- Basic Settings Container -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.mount.settings.meridian_flip.basic') }}
      </h3>
      <SettingInput
        labelKey="components.mount.settings.meridian_flip.MinutesAfterMeridian"
        settingKey="MeridianFlipSettings-MinutesAfterMeridian"
        :modelValue="store.profileInfo.MeridianFlipSettings.MinutesAfterMeridian"
        :max="600"
      />
      <SettingInput
        labelKey="components.mount.settings.meridian_flip.MaxMinutesAfterMeridian"
        settingKey="MeridianFlipSettings-MaxMinutesAfterMeridian"
        :modelValue="store.profileInfo.MeridianFlipSettings.MaxMinutesAfterMeridian"
        :max="600"
      />
      <SettingInput
        labelKey="components.mount.settings.meridian_flip.PauseTimeBeforeMeridian"
        settingKey="MeridianFlipSettings-PauseTimeBeforeMeridian"
        :modelValue="store.profileInfo.MeridianFlipSettings.PauseTimeBeforeMeridian"
        :max="600"
      />
    </div>

    <!-- Behavior Container -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.mount.settings.meridian_flip.behavior') }}
      </h3>
      <SettingInput
        labelKey="components.mount.settings.meridian_flip.SettleTime"
        settingKey="MeridianFlipSettings-SettleTime"
        :modelValue="store.profileInfo.MeridianFlipSettings.SettleTime"
        :max="600"
      />
      <setMeridianFlipRecenter />
      <setMeridianFlipUseSideOfPier />
    </div>

    <!-- Post-Flip Actions Container -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.mount.settings.meridian_flip.post_flip_actions') }}
      </h3>
      <setMeridianFlipAutoFocus />
      <setMeridianFlipRotateImage />
    </div>
  </div>
</template>

<script setup>
import { apiStore } from '@/store/store';
import SettingInput from '@/components/helpers/settings/UpdatePorfileNumber.vue';
import setMeridianFlipRecenter from './setMeridianFlipRecenter.vue';
import setMeridianFlipUseSideOfPier from './setMeridianFlipUseSideOfPier.vue';
import setMeridianFlipAutoFocus from './setMeridianFlipAutoFocus.vue';
import setMeridianFlipRotateImage from './setMeridianFlipRotateImage.vue';

const store = apiStore();
</script>
