<template>
  <Modal :show="show" @close="onClose">
    <template #header>
      <h2 class="text-2xl font-semibold">
        {{ $t('components.guider.phd2.darkLibrary.title') }}
      </h2>
    </template>
    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 w-full min-w-0 max-w-full sm:min-w-[500px]">
        <!-- Info Section -->
        <div class="p-3 sm:p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <p class="text-blue-300 text-sm">
            {{ $t('components.guider.phd2.darkLibrary.info') }}
          </p>
          <p class="text-blue-200 text-xs mt-2">
            {{ $t('components.guider.phd2.darkLibrary.warning') }}
          </p>
        </div>

        <!-- Current Library Status -->
        <div class="bg-gray-700/50 p-3 rounded-lg space-y-2">
          <h3 class="text-sm font-medium text-gray-300 mb-2">
            {{ $t('components.guider.phd2.darkLibrary.status') }}
          </h3>
          <div v-if="info" class="text-sm grid grid-cols-2 gap-x-3 gap-y-1">
            <div class="text-gray-400">
              {{ $t('components.guider.phd2.darkLibrary.exists') }}:
            </div>
            <div :class="info.Exists ? 'text-green-400' : 'text-gray-300'">
              {{ info.Exists ? '✓' : '–' }}
            </div>
            <div class="text-gray-400">
              {{ $t('components.guider.phd2.darkLibrary.loaded') }}:
            </div>
            <div :class="info.Loaded ? 'text-green-400' : 'text-gray-300'">
              {{ info.Loaded ? '✓' : '–' }}
            </div>
            <template v-if="info.Exists">
              <div class="text-gray-400">
                {{ $t('components.guider.phd2.darkLibrary.numDarks') }}:
              </div>
              <div class="text-gray-200">{{ info.NumDarks }}</div>
              <div class="text-gray-400">
                {{ $t('components.guider.phd2.darkLibrary.range') }}:
              </div>
              <div class="text-gray-200">
                {{ (info.MinExposureSec / 1000).toFixed(1) }} –
                {{ (info.MaxExposureSec / 1000).toFixed(1) }} s
              </div>
            </template>
          </div>
          <div v-else class="text-sm text-gray-400">
            {{ $t('components.guider.phd2.darkLibrary.noLibrary') }}
          </div>
        </div>

        <!-- Exposure Configuration -->
        <div class="bg-gray-700/50 p-3 rounded-lg space-y-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-400">
              {{ $t('components.guider.phd2.darkLibrary.minExposure') }}
            </label>
            <select
              v-model.number="minExposureSec"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
            >
              <option v-for="t in phd2ExposureSteps" :key="`min-${t}`" :value="t">
                {{ formatSeconds(t) }} s
              </option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-400">
              {{ $t('components.guider.phd2.darkLibrary.maxExposure') }}
            </label>
            <select
              v-model.number="maxExposureSec"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
            >
              <option v-for="t in phd2ExposureSteps" :key="`max-${t}`" :value="t">
                {{ formatSeconds(t) }} s
              </option>
            </select>
          </div>
          <NumberInputPicker
            v-model="frameCount"
            :label="$t('components.guider.phd2.darkLibrary.frameCount')"
            labelKey="components.guider.phd2.darkLibrary.frameCount"
            :min="1"
            :max="50"
            :step="1"
            :decimalPlaces="0"
            inputId="darkLibFrameCount"
            wrapperClass="w-full"
          />

          <div v-if="rangeInvalid" class="text-xs text-red-400">
            {{ $t('components.guider.phd2.darkLibrary.invalidRange') }}
          </div>
          <div v-else>
            <div class="text-xs text-gray-400 mb-1">
              {{ $t('components.guider.phd2.darkLibrary.previewExposures') }}:
            </div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="t in expTimesMs"
                :key="t"
                class="px-2 py-0.5 text-xs bg-gray-800 text-gray-200 rounded"
              >
                {{ formatSeconds(t / 1000) }} s
              </span>
            </div>
            <div class="text-xs text-gray-400 mt-2">
              {{ $t('components.guider.phd2.darkLibrary.totalFrames') }}:
              <span class="text-gray-200">{{ totalFrames }}</span>
            </div>
          </div>
        </div>

        <!-- Progress -->
        <div
          v-if="isBuilding && buildStatus"
          class="p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30"
        >
          <div class="flex items-center gap-2 mb-2">
            <div class="spinner"></div>
            <span class="text-sm text-cyan-200">
              {{ $t('components.guider.phd2.darkLibrary.building') }}
            </span>
          </div>
          <div class="text-xs text-gray-200 mb-2">
            {{
              $t('components.guider.phd2.darkLibrary.buildProgress', {
                frame: buildStatus.Frame ?? 0,
                total: buildStatus.TotalFrames ?? 0,
                exposure: ((buildStatus.ExposureMs ?? 0) / 1000).toFixed(1),
              })
            }}
          </div>
          <div class="w-full h-2 bg-gray-800 rounded">
            <div
              class="h-2 bg-cyan-500 rounded transition-all"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
        </div>

        <!-- Result -->
        <div v-if="lastResult" class="p-3 sm:p-4 rounded-lg" :class="resultClass">
          <div class="text-sm">
            <div class="font-medium">
              {{
                lastResult.success
                  ? $t('components.guider.phd2.darkLibrary.buildSuccess')
                  : $t('components.guider.phd2.darkLibrary.buildFailed')
              }}
            </div>
            <div v-if="lastResult.error" class="mt-1 text-gray-300">
              {{ lastResult.error }}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col gap-3">
          <!-- Build / Cancel -->
          <button
            @click="isBuilding ? onCancel() : onBuild()"
            :disabled="!isBuilding && (rangeInvalid || expTimesMs.length === 0)"
            :class="[
              'px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-center gap-2',
              isBuilding ? 'default-button-red' : 'default-button-cyan',
            ]"
          >
            <StopIcon v-if="isBuilding" class="w-5 h-5" />
            <span>
              {{
                isBuilding
                  ? $t('components.guider.phd2.darkLibrary.cancel')
                  : $t('components.guider.phd2.darkLibrary.build')
              }}
            </span>
          </button>

          <div class="grid grid-cols-3 gap-2">
            <button
              @click="onLoad"
              :disabled="isBuilding || !info?.Exists || info?.Loaded"
              class="default-button-gray px-2 py-2 text-sm disabled:opacity-50"
            >
              {{ $t('components.guider.phd2.darkLibrary.load') }}
            </button>
            <button
              @click="onUnload"
              :disabled="isBuilding || !info?.Loaded"
              class="default-button-gray px-2 py-2 text-sm disabled:opacity-50"
            >
              {{ $t('components.guider.phd2.darkLibrary.unload') }}
            </button>
            <button
              @click="onDelete"
              :disabled="isBuilding || !info?.Exists"
              :class="confirmDelete ? 'default-button-red' : 'default-button-gray'"
              class="px-2 py-2 text-sm disabled:opacity-50"
            >
              {{
                confirmDelete
                  ? $t('components.guider.phd2.darkLibrary.confirmDelete')
                  : $t('components.guider.phd2.darkLibrary.delete')
              }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { StopIcon } from '@heroicons/vue/24/outline';
import Modal from '@/components/helpers/Modal.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import { useGuiderStore } from '@/store/guiderStore';

const props = defineProps({
  show: Boolean,
});
const emit = defineEmits(['close']);

const guiderStore = useGuiderStore();

const phd2ExposureSteps = [
  0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 6.0, 7.0, 8.0, 9.0,
  10.0, 15.0, 30.0,
];

function formatSeconds(t) {
  return t < 1 ? t.toFixed(2) : t.toFixed(1);
}

const minExposureSec = ref(0.5);
const maxExposureSec = ref(4.0);
const frameCount = ref(5);
const confirmDelete = ref(false);
let confirmDeleteTimer = null;

const info = computed(() => guiderStore.phd2DarkLibraryInfo);
const buildStatus = computed(() => guiderStore.phd2DarkLibraryBuildStatus);
const isBuilding = computed(() => guiderStore.isDarkLibraryBuildActive);
const lastResult = computed(() => guiderStore.phd2DarkLibraryLastResult);

const rangeInvalid = computed(() => minExposureSec.value > maxExposureSec.value);

const expTimesMs = computed(() => {
  if (rangeInvalid.value) return [];
  return phd2ExposureSteps
    .filter((t) => t >= minExposureSec.value && t <= maxExposureSec.value)
    .map((t) => Math.round(t * 1000));
});

const totalFrames = computed(() => expTimesMs.value.length * frameCount.value);

const progressPercent = computed(() => {
  const s = buildStatus.value;
  if (!s || !s.TotalFrames) return 0;
  return Math.min(100, Math.round((s.Frame / s.TotalFrames) * 100));
});

const resultClass = computed(() => {
  if (!lastResult.value) return '';
  return lastResult.value.success
    ? 'bg-green-500/20 border border-green-500/30 text-green-200'
    : 'bg-red-500/20 border border-red-500/30 text-red-200';
});

async function onBuild() {
  if (rangeInvalid.value || expTimesMs.value.length === 0) return;
  try {
    await guiderStore.buildPHD2DarkLibrary(expTimesMs.value, frameCount.value);
  } catch (error) {
    console.error('Build failed to start:', error);
  }
}

async function onCancel() {
  try {
    await guiderStore.cancelPHD2DarkLibraryBuild();
  } catch (error) {
    console.error('Cancel failed:', error);
  }
}

async function onLoad() {
  try {
    await guiderStore.loadPHD2DarkLibrary();
  } catch (error) {
    console.error('Load failed:', error);
  }
}

async function onUnload() {
  try {
    await guiderStore.unloadPHD2DarkLibrary();
  } catch (error) {
    console.error('Unload failed:', error);
  }
}

async function onDelete() {
  if (!confirmDelete.value) {
    confirmDelete.value = true;
    if (confirmDeleteTimer) clearTimeout(confirmDeleteTimer);
    confirmDeleteTimer = setTimeout(() => {
      confirmDelete.value = false;
      confirmDeleteTimer = null;
    }, 3000);
    return;
  }
  if (confirmDeleteTimer) {
    clearTimeout(confirmDeleteTimer);
    confirmDeleteTimer = null;
  }
  confirmDelete.value = false;
  try {
    await guiderStore.deletePHD2DarkLibrary();
  } catch (error) {
    console.error('Delete failed:', error);
  }
}

function onClose() {
  emit('close');
}

watch(
  () => props.show,
  async (val) => {
    if (val) {
      await guiderStore.fetchPHD2DarkLibraryInfo();
      const status = await guiderStore.fetchPHD2DarkLibraryBuildStatus();
      if (status?.Active) {
        guiderStore.startDarkLibraryBuildPolling();
      }
    }
  }
);

onMounted(async () => {
  if (props.show) {
    await guiderStore.fetchPHD2DarkLibraryInfo();
    const status = await guiderStore.fetchPHD2DarkLibraryBuildStatus();
    if (status?.Active) {
      guiderStore.startDarkLibraryBuildPolling();
    }
  }
});

onBeforeUnmount(() => {
  if (confirmDeleteTimer) clearTimeout(confirmDeleteTimer);
});
</script>

<style scoped>
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
