<template>
  <div class="container flex items-center justify-center">
    <div class="container max-w-md">
      <h5 class="text-xl font-bold text-white mb-4">{{ $t('components.slewAndCenter.title') }}</h5>

      <div
        v-if="store.profileInfo.FramingAssistantSettings.LastSelectedImageSource !== 'SKYATLAS'"
        class="flex justify-center items-center pb-2"
      >
        <div class="w-full p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p class="text-red-400 text-center font-medium">
            {{ $t('components.slewAndCenter.LastSelectedImageSource_wrong') }}
          </p>
        </div>
      </div>
      <div v-else>
        <div class="flex flex-row justify-center items-center space-x-4">
          <p>{{ $t('components.slewAndCenter.ra') }}</p>
          <input
            type="text"
            v-model="localRAangleString"
            @blur="handleBlurRA"
            @keyup.enter="handleBlurRA"
            class="text-black w-full p-2 border border-gray-300 rounded"
            :placeholder="$t('components.slewAndCenter.ra_placeholder')"
          />
          <p>{{ $t('components.slewAndCenter.dec') }}</p>
          <input
            type="text"
            v-model="localDECangleString"
            @blur="handleBlurDEC"
            @keyup.enter="handleBlurDEC"
            class="text-black w-full p-2 border border-gray-300 rounded"
            :placeholder="$t('components.slewAndCenter.dec_placeholder')"
          />
        </div>
        <div class="mt-4 flex gap-2">
          <ButtonSlew :raAngle="framingStore.RAangle" :decAngle="framingStore.DECangle" />
          <ButtonSlewAndCenter :raAngle="framingStore.RAangle" :decAngle="framingStore.DECangle" />
        </div>
        <div v-if="store.rotatorInfo.Connected && true" class="mt-2">
          <button
            @click="cameraRotate"
            :disabled="
              framingStore.isSlewing ||
              framingStore.isSlewingAndCentering ||
              framingStore.isRotating
            "
            class="default-button-cyan flex items-center justify-center disabled:opacity-50"
          >
            <span v-if="framingStore.isRotating" class="loader mr-2"></span>
            {{ $t('components.slewAndCenter.rotate') }}
          </button>
        </div>
        <div class="w-full">
          <setSequenceTarget class="mt-3" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useI18n } from 'vue-i18n';
import { hmsToDegrees, dmsToDegrees } from '@/utils/utils';
import setSequenceTarget from '@/components/framing/setSequenceTarget.vue';
import ButtonSlew from '@/components/mount/ButtonSlew.vue';
import ButtonSlewAndCenter from '@/components/mount/ButtonSlewAndCenter.vue';

const { t } = useI18n();
const store = apiStore();
const framingStore = useFramingStore();
const props = defineProps({
  RAangleString: String,
  DECangleString: String,
});
const emit = defineEmits(['update:RAangleString', 'update:DECangleString']);
const localRAangleString = ref(props.RAangleString);
const localDECangleString = ref(props.DECangleString);
const Info = ref(null);

watch(
  () => framingStore.RAangleString,
  () => {
    updateRA();
  }
);
watch(
  () => framingStore.DECangleString,
  () => {
    updateDec();
  }
);

function validateRA(raString) {
  const raPattern = /^([01]?[0-9]|2[0-3]):([0-5]?[0-9]):(60(\.0+)?|[0-5]?[0-9](\.\d+)?)$/;
  return raPattern.test(raString);
}

function validateDEC(decString) {
  const decPattern = /^(\+|-)?(90:00:00(\.0+)?|([0-8]?[0-9]):([0-5]?[0-9]):([0-5][0-9](\.\d+)?))$/;
  return decPattern.test(decString);
}

function handleBlurRA() {
  if (!localRAangleString.value) {
    return; // Nichts tun, wenn der Wert leer ist
  }
  if (validateRA(localRAangleString.value)) {
    updateRA();
  } else {
    alert(t('components.slewAndCenter.errors.invalidRAInput'));
  }
}

function handleBlurDEC() {
  if (!localDECangleString.value) {
    return; // Nichts tun, wenn der Wert leer ist
  }
  if (validateDEC(localDECangleString.value)) {
    console.log('Lokal DEC', localDECangleString.value);
    updateDec();
  } else {
    alert(t('components.slewAndCenter.errors.invalidDECInput'));
  }
}

function updateRA() {
  framingStore.RAangle = hmsToDegrees(localRAangleString.value);
}

function updateDec() {
  framingStore.DECangle = dmsToDegrees(localDECangleString.value);
}

async function cameraRotate() {
  framingStore.cameraRotate();
}

async function fetchInfo() {
  try {
    const response = await apiService.framingAction('info');
    if (response.Success) {
      Info.value = response.Response;
    } else {
      console.error(t('components.slewAndCenter.errors.apiResponseError'), response.Error);
    }
  } catch (error) {
    console.error(t('components.slewAndCenter.errors.mountInfoError'), error);
  }
}

let intervalId = null;

function startFetchingInfo() {
  fetchInfo();
  intervalId = setInterval(() => fetchInfo(), 1000);
}

function stopFetchingInfo() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

onMounted(async () => {
  startFetchingInfo();
  await apiService.applicatioTabSwitch('framing');
  await apiService.setFramingImageSource('SKYATLAS');
});

onBeforeUnmount(() => {
  stopFetchingInfo();
});
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
