<template>
  <div class="flex flex-col gap-2 sm:gap-4">
    <!-- Basic Settings Container -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.settings.plate_solver.basic') }}
      </h3>
      <SettingInput
        labelKey="components.settings.plate_solver.ExposureTime"
        settingKey="PlateSolveSettings-ExposureTime"
        :modelValue="store.profileInfo.PlateSolveSettings.ExposureTime"
        :max="600"
      />
      <SettingInput
        labelKey="components.settings.plate_solver.Gain"
        settingKey="PlateSolveSettings-Gain"
        :modelValue="store.profileInfo.PlateSolveSettings.Gain"
        :modelDefaultValue="store.profileInfo.CameraSettings.Gain"
        :min="0"
        :max="600"
      />
    </div>

    <!-- Search Settings Container -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.settings.plate_solver.search') }}
      </h3>
      <SettingInput
        labelKey="components.settings.plate_solver.SearchRadius"
        settingKey="PlateSolveSettings-SearchRadius"
        :modelValue="store.profileInfo.PlateSolveSettings.SearchRadius"
        :max="360"
      />
      <SettingInput
        labelKey="components.settings.plate_solver.Threshold"
        settingKey="PlateSolveSettings-Threshold"
        :modelValue="store.profileInfo.PlateSolveSettings.Threshold"
        :min="0"
        :max="100"
        step="0.1"
      />
      <SettingInput
        labelKey="components.settings.plate_solver.RotationTolerance"
        settingKey="PlateSolveSettings-RotationTolerance"
        :modelValue="store.profileInfo.PlateSolveSettings.RotationTolerance"
        :min="0"
        :max="360"
        step="0.1"
      />
      <SettingInput
        labelKey="components.settings.plate_solver.MaxObjects"
        settingKey="PlateSolveSettings-MaxObjects"
        :modelValue="store.profileInfo.PlateSolveSettings.MaxObjects"
        :max="9999"
      />
    </div>

    <!-- Retry Settings Container -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.settings.plate_solver.retry') }}
      </h3>
      <SettingInput
        labelKey="components.settings.plate_solver.NumberOfAttempts"
        settingKey="PlateSolveSettings-NumberOfAttempts"
        :modelValue="store.profileInfo.PlateSolveSettings.NumberOfAttempts"
        :max="100"
      />
      <SettingInput
        labelKey="components.settings.plate_solver.ReattemptDelay"
        settingKey="PlateSolveSettings-ReattemptDelay"
        :modelValue="store.profileInfo.PlateSolveSettings.ReattemptDelay"
        :max="3600"
      />
      <setPlateSolverBlindFailover />
    </div>
  </div>
</template>

<script setup>
import { apiStore } from '@/store/store';
import SettingInput from '@/components/helpers/settings/UpdatePorfileNumber.vue';
import setPlateSolverBlindFailover from './setPlateSolverBlindFailover.vue';

const store = apiStore();
</script>
