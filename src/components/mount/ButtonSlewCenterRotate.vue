<template>
  <div class="">
    <div class="flex gap-0 border border-gray-600 rounded-lg overflow-hidden">
      <button
        @click="store.mountInfo.Slewing ? framingStore.slewStop() : slew()"
        :disabled="
          (!store.mountInfo.Slewing &&
            (framingStore.isSlewing ||
              framingStore.isSlewingAndCentering ||
              framingStore.isRotating ||
              props.disabled)) ||
          !store.mountInfo.Connected
        "
        :class="[
          'px-5 flex-1 w-full rounded-none',
          store.mountInfo.Slewing ? 'default-button-red' : 'default-button-cyan',
        ]"
      >
        <span
          v-if="
            framingStore.isSlewing || framingStore.isSlewingAndCentering || framingStore.isRotating
          "
          class="loader mr-2"
        ></span>
        <StopCircleIcon v-if="store.mountInfo.Slewing" class="w-6 h-6" />
        <p v-else-if="label">{{ label }}</p>
        <p
          v-else-if="
            settingsStore.mount.useCenter &&
            settingsStore.mount.useRotate &&
            store.rotatorInfo.Connected
          "
        >
          {{ $t('components.slewAndCenter.slew_and_center') }} &
          {{ $t('components.framing.useRotate') }}
        </p>
        <p v-else-if="settingsStore.mount.useCenter">
          {{ $t('components.slewAndCenter.slew_and_center') }}
        </p>
        <p v-else>{{ $t('components.slewAndCenter.slew') }}</p>
      </button>
      <button
        @click="openSettings"
        :disabled="
          framingStore.isSlewing ||
          framingStore.isSlewingAndCentering ||
          framingStore.isRotating ||
          props.disabled
        "
        :class="[
          'text-gray-300 hover:text-white transition-colors duration-200 px-3 w-10 h-10 rounded-none border-l',
          showPulse ? 'feature-highlight' : 'bg-gray-700 hover:bg-gray-600 border-gray-500',
        ]"
        title="Settings"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </div>
  </div>

  <!-- Settings Modal -->
  <Modal :show="showSettingsModal" @close="showSettingsModal = false" :zIndex="'z-40'">
    <template #header>
      <h2 class="text-xl font-bold">{{ $t('components.settings.title') }}</h2>
    </template>
    <template #body>
      <div class="space-y-4">
        <div
          class="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600/30"
        >
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-cyan-400"></div>
            <span class="text-sm font-medium">{{ $t('components.framing.useCenter') }}</span>
          </div>
          <div class="ml-6">
            <toggleButton
              @click="settingsStore.mount.useCenter = !settingsStore.mount.useCenter"
              :status-value="settingsStore.mount.useCenter"
            />
          </div>
        </div>

        <div
          class="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600/30"
        >
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-purple-400"></div>
            <span class="text-sm font-medium">{{ $t('components.framing.useRotate') }}</span>
          </div>
          <div class="ml-6">
            <toggleButton
              @click="settingsStore.mount.useRotate = !settingsStore.mount.useRotate"
              :status-value="settingsStore.mount.useRotate"
              :disabled="!store.rotatorInfo.Connected"
            />
          </div>
        </div>

        <div class="border-t border-gray-600/30 pt-4">
          <SettingInput
            labelKey="components.mount.settings.telescope_settle_time"
            settingKey="TelescopeSettings-SettleTime"
            :modelValue="store.profileInfo.TelescopeSettings.SettleTime"
            :max="600"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useI18n } from 'vue-i18n';
import { wait } from '@/utils/utils';
import toggleButton from '@/components/helpers/toggleButton.vue';
import Modal from '@/components/helpers/Modal.vue';
import SettingInput from '@/components/helpers/settings/UpdatePorfileNumber.vue';
import { StopCircleIcon } from '@heroicons/vue/24/outline';

const store = apiStore();
const framingStore = useFramingStore();
const settingsStore = useSettingsStore();
const { t } = useI18n();
const showSettingsModal = ref(false);
const showPulse = ref(false);

onMounted(() => {
  showPulse.value = !settingsStore.mount.settingsVisited;
});

function openSettings() {
  showSettingsModal.value = true;
  showPulse.value = false;
  settingsStore.mount.settingsVisited = true;
}

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
      if (!response.Success) return;
      await wait(2000);
      console.log(t('components.mount.control.unpark'));
    } catch (error) {
      console.log(t('components.mount.control.errors.unpark'));
    }
  }
}

async function slew() {
  try {
    await unparkMount(); // Überprüfen und Entparken, falls erforderlich
    const center = settingsStore.mount.useCenter;
    const rotate = settingsStore.mount.useRotate && store.rotatorInfo.Connected;
    if (center || rotate) {
      if (framingStore.slewIsStopt) return;
      await framingStore.slewAndCenterRotate(props.raAngle, props.decAngle, center, rotate);
    } else {
      console.log('Slew without centering or rotating');
      await framingStore.slewAndCenterRotate(props.raAngle, props.decAngle, false, false);
    }
    emit('finished'); // Emit Event nach Erfolg
  } catch (error) {
    console.error('Slew error:', error);
  }
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
