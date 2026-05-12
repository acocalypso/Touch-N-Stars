<template>
  <div v-if="isSV241Pro" class="flex flex-col border border-gray-500 p-1 md:p-2 rounded-lg mt-2">
    <!-- Pre Connect Delay -->
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
        class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
        :class="statusClassPre"
      />
    </div>

    <!-- Post Connect Delay -->
    <div class="flex flex-row items-center justify-between w-full mt-2 md:mt-3">
      <label for="postConnectDelay" class="text-xs md:text-sm text-gray-200 mr-2">
        {{ $t('components.switch.sv241pro.postConnectDelay') }}
      </label>
      <input
        id="postConnectDelay"
        v-model.number="postConnectDelay"
        @change="setPostConnectDelay"
        type="number"
        min="0"
        class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
        :class="statusClassPost"
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
});

const store = apiStore();

const isSV241Pro = computed(() => {
  const name = props.selectedDevice.toLowerCase();
  return name.includes('svbony') && name.includes('powerbox');
});

const preConnectDelay = ref(0);
const postConnectDelay = ref(0);
const statusClassPre = ref('');
const statusClassPost = ref('');

function initializeSettings() {
  const settings = store.profileInfo?.SwitchSettings;
  if (!settings) return;
  preConnectDelay.value = settings.IndiPreConnectDelay ?? 0;
  postConnectDelay.value = settings.IndiPostConnectDelay ?? 0;
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

async function setPostConnectDelay() {
  try {
    await apiService.profileChangeValue(
      'SwitchSettings-IndiPostConnectDelay',
      postConnectDelay.value
    );
    statusClassPost.value = 'glow-green';
  } catch {
    statusClassPost.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassPost.value = '';
    }, 2000);
  }
}

onMounted(async () => {
  await store.fetchProfilInfos();
  initializeSettings();
});
</script>
