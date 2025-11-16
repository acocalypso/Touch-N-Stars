<template>
  <div v-if="!store.rotatorInfo.Connected" class="text-red-500">
    <p>{{ $t('components.rotator.please_connect_rotator') }}</p>
  </div>
  <div v-else class="gap-2">
    <StatusBool
      :isEnabled="store.rotatorInfo.Connected"
      :enabledText="$t('components.rotator.connected')"
      :disabledText="$t('components.rotator.disconnected')"
    />
    <StatusString
      :isEnabled="
        store.rotatorInfo.MechanicalPosition !== undefined &&
        store.rotatorInfo.MechanicalPosition !== null
      "
      :Name="$t('components.rotator.currentPosition')"
      :Value="
        store.rotatorInfo.MechanicalPosition !== undefined &&
        store.rotatorInfo.MechanicalPosition !== null
          ? store.rotatorInfo.MechanicalPosition.toFixed(1) + '°'
          : ''
      "
    />
    <StatusBool
      :isEnabled="store.rotatorInfo.IsMoving"
      :enabledText="$t('components.rotator.moving')"
      :disabledText="$t('components.rotator.stationary')"
    />
    <StatusString
      :isEnabled="store.rotatorInfo.StepSize !== undefined && store.rotatorInfo.StepSize !== null"
      :Name="$t('components.rotator.stepSize')"
      :Value="
        store.rotatorInfo.StepSize !== undefined && store.rotatorInfo.StepSize !== null
          ? store.rotatorInfo.StepSize.toFixed(2)
          : ''
      "
    />
  </div>
</template>

<script setup>
//import { computed } from 'vue';
import StatusBool from '@/components/helpers/StatusBool.vue';
import StatusString from '@/components/helpers/StatusString.vue';
import { apiStore } from '@/store/store';
const store = apiStore();
</script>
