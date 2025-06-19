<template>
  <div class="flex flex-col gap-1 border border-gray-500 p-2 rounded-lg">
    <div class="flex flex-row items-center justify-between w-full">
      <label for="toggle_Pos" class="text-gray-300">
        {{ $t('components.tppa.settings.StartFromCurrentPosition') }}
      </label>
      <div>
        <toggleButton
          @click="togglePosition"
          :status-value="tppaStore.settings.StartFromCurrentPosition"
          class="pr-5 pl-5 justify-center"
        />
      </div>
    </div>
    <div
      v-show="tppaStore.settings.StartFromCurrentPosition"
      class="flex flex-row items-center justify-between w-full"
    >
      <label for="toggle_Pos" class="text-gray-300">
        {{ $t('components.tppa.settings.DirectionEast') }}
      </label>
      <div>
        <toggleButton
          @click="toggleDirection"
          :status-value="tppaStore.settings.EastDirection"
          class="pr-5 pl-5 justify-center"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTppaStore } from '@/store/tppaStore';
import toggleButton from '../helpers/toggleButton.vue';

const tppaStore = useTppaStore();

function togglePosition() {
  if (tppaStore.settings.StartFromCurrentPosition) {
    tppaStore.settings.StartFromCurrentPosition = false;
    console.log('StartCurrentPosition off');
  } else {
    tppaStore.settings.StartFromCurrentPosition = true;
    console.log('StartCurrentPosition on');
  }
}

function toggleDirection() {
  if (tppaStore.settings.EastDirection) {
    tppaStore.settings.EastDirection = false;
    console.log('EastDirection off');
  } else {
    tppaStore.settings.EastDirection = true;
    console.log('EastDirection on');
  }
}
</script>
