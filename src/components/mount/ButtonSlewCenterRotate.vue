<template>
  <div class="border border-gray-500 p-1 mt-2 rounded-lg">
    <div class="flex gap-1">
      <button
        @click="slew"
        :disabled="
          framingStore.isSlewing ||
          framingStore.isSlewingAndCentering ||
          framingStore.isRotating ||
          props.disabled
        "
        class="default-button-cyan px-5"
      >
        <span
          v-if="
            framingStore.isSlewing || framingStore.isSlewingAndCentering || framingStore.isRotating
          "
          class="loader mr-2"
        ></span>
        <p v-if="label">{{ label }}</p>
        <p v-else>{{ $t('components.slewAndCenter.slew') }}</p>
      </button>
      <div class="default-button-red" v-if="store.mountInfo.Slewing">
        <ButtonSlewStop />
      </div>
    </div>
    <div class="flex flex-row gap-2 justify-between">
      <div
        class="flex min-w-36 w-full justify-between items-center border border-gray-500 p-1 mt-2 rounded-lg"
      >
        <label for="DewHeater" class="text-sm mb-1 text-gray-400">
          {{ $t('components.framing.useCenter') }}
        </label>
        <toggleButton
          @click="settingsStore.mount.useCenter = !settingsStore.mount.useCenter"
          :status-value="settingsStore.mount.useCenter"
          class="pr-5 pl-5 justify-center"
        />
      </div>
      <div
        v-if="store.rotatorInfo.Connected"
        class="flex min-w-36 w-full justify-between items-center border border-gray-500 p-1 mt-2 rounded-lg"
      >
        <label for="DewHeater" class="text-sm mb-1 text-gray-400">
          {{ $t('components.framing.useRotate') }}
        </label>
        <toggleButton
          @click="settingsStore.mount.useRotate = !settingsStore.mount.useRotate"
          :status-value="settingsStore.mount.useRotate"
          class="pr-5 pl-5 justify-center"
        />
      </div>
    </div>
  </div>
  <CenterModal ref="centeringModalRef" />
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useI18n } from 'vue-i18n';
import { wait } from '@/utils/utils';
import ButtonSlewStop from '@/components/mount/ButtonSlewStop.vue';
import { handleApiError } from '@/utils/utils';
import toggleButton from '@/components/helpers/toggleButton.vue';
import CenterModal from '@/components/mount/CenterModal.vue';

const store = apiStore();
const framingStore = useFramingStore();
const settingsStore = useSettingsStore();
const { t } = useI18n();
const centeringModalRef = ref(null);

const props = defineProps({
  raAngle: Number,
  decAngle: Number,
  label: String,
  disabled: Boolean,
});
const emit = defineEmits(['finished']);

async function unparkMount() {
  if (store.mountInfo.AtPark) {
    try {
      const response = await apiService.mountAction('unpark');
      if (handleApiError(response, { title: 'Mount error' })) return;
      await wait(2000);
      console.log(t('components.mount.control.unpark'));
    } catch (error) {
      console.log(t('components.mount.control.errors.unpark'));
    }
  }
}

async function slew() {
  await unparkMount(); // Überprüfen und Entparken, falls erforderlich
  const center = settingsStore.mount.useCenter;
  const rotate = settingsStore.mount.useRotate && store.rotatorInfo.Connected;

  if (center){
    centeringModalRef.value?.openModal();
    console.log('First: Slew to the target')
    await framingStore.slewAndCenterRotate(props.raAngle, props.decAngle, false, false);
    console.log('First debug: Slew to the target' , framingStore.slewIsStopt)
    if (framingStore.slewIsStopt) return;
    console.log('Second: center the target')
    await framingStore.slewAndCenterRotate(props.raAngle, props.decAngle, center, rotate);
  }

  await framingStore.slewAndCenterRotate(props.raAngle, props.decAngle, center, rotate);
  emit('finished'); // Emit Event nach Erfolg
}
</script>

<style scoped>
.loader {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
