<template>
  <div v-if="isSV241Pro" class="flex flex-col border border-gray-500 p-1 md:p-2 rounded-lg mt-2">
    <div class="flex flex-row items-center justify-between w-full">
      <label for="preConnectDelay" class="text-xs md:text-sm text-gray-200 mr-2">
        {{ $t('components.switch.sv241pro.preConnectDelay') }}
      </label>
      <input
        id="preConnectDelay"
        v-model.number="preConnectDelay"
        @change="setPreConnectDelay"
        type="number"
        min="0"
        class="tns-input text-xs md:text-sm w-48"
        :class="statusClassPre"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

const props = defineProps({
  selectedDevice: { type: String, default: '' },
  selectedDeviceObj: { type: Object, default: null },
});

const store = apiStore();

const isSV241Pro = computed(() => {
  const candidates = [
    props.selectedDevice,
    props.selectedDeviceObj?.DisplayName,
    props.selectedDeviceObj?.Name,
    props.selectedDeviceObj?.Id,
  ]
    .filter(Boolean)
    .map((s) => s.toLowerCase());
  return candidates.some((s) => s.includes('svbony') && s.includes('powerbox'));
});

const preConnectDelay = ref(0);
const statusClassPre = ref('');

function initializeSettings() {
  const settings = store.profileInfo?.SwitchSettings;
  if (!settings) return;
  preConnectDelay.value = settings.IndiPreConnectDelay ?? 0;
}

async function setPreConnectDelay() {
  try {
    await apiService.profileChangeValue(
      'SwitchSettings-IndiPreConnectDelay',
      preConnectDelay.value
    );
    statusClassPre.value = 'glow-green';
  } catch {
    statusClassPre.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassPre.value = '';
    }, 2000);
  }
}

onMounted(async () => {
  await store.fetchProfilInfos();
  initializeSettings();
});
</script>
