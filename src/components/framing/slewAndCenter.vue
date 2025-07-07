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
        <div
          class="flex flex-row justify-center items-center space-x-4 p-2 rounded-lg"
          :class="statusClassRaDec"
        >
          <p class="w-24">{{ $t('components.slewAndCenter.ra') }}</p>
          <input
            type="text"
            v-model="localRAangleString"
            @blur="handleBlurRA"
            @keyup.enter="handleBlurRA"
            class="text-black w-full p-2 border border-gray-300 rounded"
            :placeholder="$t('components.slewAndCenter.ra_placeholder')"
          />
          <p class="w-24">{{ $t('components.slewAndCenter.dec') }}</p>
          <input
            type="text"
            v-model="localDECangleString"
            @blur="handleBlurDEC"
            @keyup.enter="handleBlurDEC"
            class="text-black w-full p-2 border border-gray-300 rounded"
            :placeholder="$t('components.slewAndCenter.dec_placeholder')"
          />
        </div>
        <div
          class="flex flex-row justify-center items-center space-x-4 p-2 rounded-lg"
          :class="statusClassAzAlt"
        >
          <p class="w-24">{{ $t('components.slewAndCenter.alt') }}</p>
          <input
            type="text"
            v-model="localAltAngleString"
            @blur="handleBlurAlt"
            @keyup.enter="handleBlurAlt"
            class="text-black w-full p-2 border border-gray-300 rounded"
            placeholder="12:34:56 / 12.456"
          />
          <p class="w-24">{{ $t('components.slewAndCenter.az') }}</p>
          <input
            type="text"
            v-model="localAzAngleString"
            @blur="handleBlurAz"
            @keyup.enter="handleBlurAz"
            class="text-black w-full p-2 border border-gray-300 rounded"
            placeholder="12:34:56 / 123.456"
          />
        </div>
        <div class="mt-4 flex gap-2 w-full">
          <ButtonSlewCenterRotate
            class="w-full"
            :raAngle="framingStore.RAangle"
            :decAngle="framingStore.DECangle"
          />
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
import { hmsToDegrees, dmsToDegrees, altAzToRaDec, parseAngleInput } from '@/utils/utils';
import setSequenceTarget from '@/components/framing/setSequenceTarget.vue';
import ButtonSlew from '@/components/mount/ButtonSlew.vue';
import ButtonSlewAndCenter from '@/components/mount/ButtonSlewAndCenter.vue';
import ButtonSlewCenterRotate from '../mount/ButtonSlewCenterRotate.vue';

const { t } = useI18n();
const store = apiStore();
const framingStore = useFramingStore();
const props = defineProps({
  RAangleString: String,
  DECangleString: String,
});
const localRAangleString = ref(props.RAangleString);
const localDECangleString = ref(props.DECangleString);
const localAltAngleString = ref();
const localAzAngleString = ref();
const Info = ref(null);
const statusClassRaDec = ref('');
const statusClassAzAlt = ref('');

watch(
  () => framingStore.RAangleString,
  (newValue) => {
    localRAangleString.value = newValue;
    updateRA();
  }
);
watch(
  () => framingStore.DECangleString,
  (newValue) => {
    localDECangleString.value = newValue;
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

function validateAZ(input) {
  const val = parseAngleInput(input);
  return val !== null && val >= 0 && val < 360;
}

function validateALT(input) {
  const val = parseAngleInput(input);
  return val !== null && val >= -90 && val <= 90;
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

function handleBlurAlt() {
  if (!localAltAngleString.value) {
    return; // Nichts tun, wenn der Wert leer ist
  }
  if (validateALT(localAltAngleString.value)) {
    updateAltAz();
  } else {
    alert(t('components.slewAndCenter.errors.invalidAltInput'));
  }
}

function handleBlurAz() {
  if (!localAzAngleString.value) {
    return; // Nichts tun, wenn der Wert leer ist
  }
  if (validateAZ(localAzAngleString.value)) {
    updateAltAz();
  } else {
    alert(t('components.slewAndCenter.errors.invalidAzInput'));
  }
}

function updateRA() {
  framingStore.RAangle = hmsToDegrees(localRAangleString.value);
  statusClassRaDec.value = 'glow-green';
  statusClassAzAlt.value = '';
}

function updateDec() {
  framingStore.DECangle = dmsToDegrees(localDECangleString.value);
  statusClassRaDec.value = 'glow-green';
  statusClassAzAlt.value = '';
}

function updateAltAz() {
  if (!localAltAngleString.value || !localAzAngleString.value) {
    return;
  }

  const alt = parseAngleInput(localAltAngleString.value);
  const az = parseAngleInput(localAzAngleString.value);

  const { ra, dec } = altAzToRaDec(
    alt,
    az,
    store.profileInfo.AstrometrySettings.Latitude,
    store.profileInfo.AstrometrySettings.Longitude
  );

  framingStore.RAangle = ra;
  framingStore.DECangle = dec;

  statusClassRaDec.value = '';
  statusClassAzAlt.value = 'glow-green';

  console.log('→ RA (°):', ra);
  console.log('→ DEC (°):', dec);
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

.glow-green {
  box-shadow: 0 0 10px #00ff00; /* Grüner Schein */
}
.glow-red {
  box-shadow: 0 0 10px rgb(255, 0, 0); /* Roter Schein */
}
</style>
