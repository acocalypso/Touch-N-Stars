<template>
  <!-- Trigger Button — v-bind="$attrs" forwards positioning classes (fixed, right-*, z-*) from parent -->
  <button
    v-bind="$attrs"
    @click="start"
    class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md z-10"
    :title="$t('components.fitsPlatesolve.buttonTitle')"
  >
    <!-- FITS file + crosshair icon -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-6 h-6 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="12" x2="12" y2="16.5" />
      <line x1="9.5" y1="14" x2="14.5" y2="14" />
      <circle cx="12" cy="14" r="3.2" />
    </svg>
  </button>

  <!-- File Browser (FITS files only) -->
  <FileBrowser
    v-model="showBrowser"
    :title="$t('components.fitsPlatesolve.browserTitle')"
    mode="file"
    :fileExtensions="['fits', 'fit', 'fts']"
    @select="onFileSelected"
  />

  <!-- Main Modal -->
  <Teleport to="body">
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-top p-4"
      @click.self="step !== 'solving' && onCancel()"
    >
      <div
        class="bg-[#1a1f2e] border border-[#2e3650] rounded-[10px] w-full max-w-[480px] flex flex-col overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-4 py-3.5 border-b border-[#2e3650] shrink-0"
        >
          <span class="text-sm font-semibold text-slate-200 tracking-wide">{{
            modalTitle
          }}</span>
          <button
            v-if="step !== 'solving'"
            class="text-slate-500 text-sm px-2 py-1 rounded hover:text-slate-200 hover:bg-[#2e3650] transition-colors cursor-pointer bg-transparent border-none"
            @click="onCancel"
          >
            ✕
          </button>
        </div>

        <!-- Loading params -->
        <div
          v-if="step === 'loading_params'"
          class="flex flex-col items-center justify-center gap-3 p-10"
        >
          <span
            class="w-8 h-8 border-2 border-[#2e3650] border-t-cyan-700 rounded-full animate-spin"
          ></span>
          <span class="text-slate-400 text-sm">{{
            $t('components.fitsPlatesolve.loadingParams')
          }}</span>
        </div>

        <!-- Parameter Confirmation Form -->
        <div v-else-if="step === 'confirm'" class="flex flex-col overflow-y-auto">
          <!-- File path display -->
          <div class="px-4 py-2.5 border-b border-[#2e3650] bg-[#0f1420]">
            <span class="text-xs text-slate-500">{{ $t('components.fitsPlatesolve.file') }}</span>
            <p class="text-xs text-slate-400 font-mono truncate mt-0.5">{{ selectedFile }}</p>
          </div>

          <!-- Fields -->
          <div class="px-4 py-4 space-y-3">
            <!-- Focal Length -->
            <div class="flex items-center gap-3">
              <label class="text-xs text-slate-400 w-28 shrink-0">{{
                $t('components.fitsPlatesolve.focalLength')
              }}</label>
              <input
                v-model.number="form.focalLength"
                type="number"
                min="1"
                class="flex-1 bg-[#0f1420] border border-[#2e3650] focus:border-cyan-700 rounded-md text-slate-200 text-xs px-2.5 py-1.5 outline-none transition-colors"
              />
              <span class="text-xs text-slate-500 shrink-0 w-6">mm</span>
            </div>

            <!-- Pixel Size -->
            <div class="flex items-center gap-3">
              <label class="text-xs text-slate-400 w-28 shrink-0">{{
                $t('components.fitsPlatesolve.pixelSize')
              }}</label>
              <input
                v-model.number="form.pixelSize"
                type="number"
                min="0.1"
                step="0.1"
                class="flex-1 bg-[#0f1420] border border-[#2e3650] focus:border-cyan-700 rounded-md text-slate-200 text-xs px-2.5 py-1.5 outline-none transition-colors"
              />
              <span class="text-xs text-slate-500 shrink-0 w-6">µm</span>
            </div>

            <!-- Binning (read-only) -->
            <div class="flex items-center gap-3">
              <label class="text-xs text-slate-400 w-28 shrink-0">{{
                $t('components.fitsPlatesolve.binning')
              }}</label>
              <input
                :value="form.binning"
                type="number"
                readonly
                class="flex-1 bg-[#0f1420] border border-[#2e3650] rounded-md text-slate-500 text-xs px-2.5 py-1.5 outline-none cursor-not-allowed"
              />
              <span class="text-xs text-slate-500 shrink-0 w-6">×</span>
            </div>

            <!-- Separator -->
            <div class="border-t border-[#2e3650] pt-2">
              <p class="text-xs text-slate-600 mb-3">
                {{ $t('components.fitsPlatesolve.coordinatesHint') }}
              </p>
            </div>

            <!-- RA -->
            <div class="flex items-center gap-3">
              <label class="text-xs text-slate-400 w-28 shrink-0">{{
                $t('components.fitsPlatesolve.ra')
              }}</label>
              <input
                v-model="form.raString"
                type="text"
                :placeholder="$t('components.fitsPlatesolve.raPlaceholder')"
                class="flex-1 bg-[#0f1420] border border-[#2e3650] focus:border-cyan-700 rounded-md text-slate-200 text-xs px-2.5 py-1.5 outline-none transition-colors font-mono"
              />
              <span class="text-xs text-slate-500 shrink-0 w-6"></span>
            </div>

            <!-- Dec -->
            <div class="flex items-center gap-3">
              <label class="text-xs text-slate-400 w-28 shrink-0">{{
                $t('components.fitsPlatesolve.dec')
              }}</label>
              <input
                v-model="form.decString"
                type="text"
                :placeholder="$t('components.fitsPlatesolve.decPlaceholder')"
                class="flex-1 bg-[#0f1420] border border-[#2e3650] focus:border-cyan-700 rounded-md text-slate-200 text-xs px-2.5 py-1.5 outline-none transition-colors font-mono"
              />
              <span class="text-xs text-slate-500 shrink-0 w-6"></span>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-2 px-4 py-3 border-t border-[#2e3650] shrink-0">
            <button class="default-button-gray" @click="onCancel">
              {{ $t('common.cancel') }}
            </button>
            <button class="default-button-gray" @click="solve(true)">
              {{ $t('components.fitsPlatesolve.blindSolve') }}
            </button>
            <button
              class="default-button-cyan"
              :disabled="!form.focalLength || !form.pixelSize"
              @click="solve(false)"
            >
              {{ $t('components.fitsPlatesolve.plateSolve') }}
            </button>
          </div>
        </div>

        <!-- Solving -->
        <div
          v-else-if="step === 'solving'"
          class="flex flex-col items-center justify-center gap-3 p-10"
        >
          <span
            class="w-10 h-10 border-2 border-[#2e3650] border-t-cyan-700 rounded-full animate-spin"
          ></span>
          <span class="text-slate-300 text-sm font-medium">{{
            $t('components.fitsPlatesolve.solving')
          }}</span>
          <span class="text-slate-600 text-xs text-center max-w-[280px]">{{
            $t('components.fitsPlatesolve.solvingHint')
          }}</span>
        </div>

        <!-- Result -->
        <div v-else-if="step === 'result'" class="flex flex-col overflow-y-auto">
          <!-- Success banner -->
          <div
            class="flex items-center gap-2.5 px-4 py-3 border-b border-[#2e3650] bg-green-950/30"
          >
            <div class="w-2 h-2 rounded-full bg-green-400 shrink-0"></div>
            <span class="text-green-400 text-sm font-medium">{{
              $t('components.fitsPlatesolve.success')
            }}</span>
          </div>

          <!-- Result details -->
          <div class="px-4 py-4 space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-500">{{
                $t('components.fitsPlatesolve.ra')
              }}</span>
              <span class="text-sm text-cyan-400 font-mono">{{ result?.raString }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-500">{{
                $t('components.fitsPlatesolve.dec')
              }}</span>
              <span class="text-sm text-cyan-400 font-mono">{{ result?.decString }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-500">{{
                $t('components.fitsPlatesolve.rotation')
              }}</span>
              <span class="text-sm text-cyan-400 font-mono"
                >{{ result?.rotation?.toFixed(2) }}°</span
              >
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-500">{{
                $t('components.fitsPlatesolve.pixelScale')
              }}</span>
              <span class="text-sm text-cyan-400 font-mono"
                >{{ result?.pixelScale?.toFixed(3) }}"</span
              >
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between gap-2 px-4 py-3 border-t border-[#2e3650] shrink-0 flex-wrap">
            <button class="default-button-gray" @click="onCancel">
              {{ $t('common.close') }}
            </button>
            <div class="flex items-center gap-2 flex-wrap">
              <SaveFavTargets
                name="FITS Plate Solve"
                :ra="result.ra"
                :dec="result.dec"
                :ra-string="result.raString"
                :dec-string="result.decString"
                :rotation="result.rotation ?? 0"
              />
              <button class="default-button-cyan" @click="useAsTarget">
                {{
                  showSeqTarget
                    ? $t('components.framing.setSequnceTarget')
                    : $t('components.fitsPlatesolve.useAsTarget')
                }}
              </button>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="step === 'error'" class="flex flex-col overflow-y-auto">
          <!-- Error banner -->
          <div
            class="flex items-center gap-2.5 px-4 py-3 border-b border-[#2e3650] bg-red-950/30"
          >
            <div class="w-2 h-2 rounded-full bg-red-400 shrink-0"></div>
            <span class="text-red-400 text-sm font-medium">{{
              $t('components.fitsPlatesolve.error')
            }}</span>
          </div>
          <div class="px-4 py-4">
            <p class="text-slate-400 text-sm leading-relaxed">{{ errorMessage }}</p>
          </div>
          <div class="flex justify-end gap-2 px-4 py-3 border-t border-[#2e3650] shrink-0">
            <button class="default-button-gray" @click="onCancel">
              {{ $t('common.close') }}
            </button>
            <button class="default-button-cyan" @click="start">
              {{ $t('components.fitsPlatesolve.tryAgain') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue';

// Multiple root nodes (button + FileBrowser + Teleport) = fragment → Vue won't auto-inherit attrs.
// We manually forward them to the button so positioning classes from the parent work.
defineOptions({ inheritAttrs: false });
import { useI18n } from 'vue-i18n';
import FileBrowser from '@/components/helpers/fileBrowser.vue';
import SaveFavTargets from '@/components/favTargets/SaveFavTargets.vue';
import { useFramingStore } from '@/store/framingStore';
import { useSequenceStore } from '@/store/sequenceStore';
import { useToastStore } from '@/store/toastStore';
import apiService from '@/services/apiService';

const { t } = useI18n();
const framingStore = useFramingStore();
const sequenceStore = useSequenceStore();
const toastStore = useToastStore();

const props = defineProps({
  showFraming: { type: Boolean, default: true },
  showSeqTarget: { type: Boolean, default: false },
});

const hasSequenceLoaded = computed(
  () =>
    sequenceStore.sequenceIsLoaded &&
    Array.isArray(sequenceStore.sequenceInfo) &&
    sequenceStore.sequenceInfo.length > 0
);

// State machine steps: idle | browsing | loading_params | confirm | solving | result | error
const step = ref('idle');
const showBrowser = ref(false);
const selectedFile = ref('');

const form = ref({
  focalLength: null,
  pixelSize: null,
  binning: 1,
  raString: '',
  decString: '',
  ra: null,
  dec: null,
});

const result = ref(null);
const errorMessage = ref('');

const showModal = computed(() =>
  ['loading_params', 'confirm', 'solving', 'result', 'error'].includes(step.value)
);

const modalTitle = computed(() => {
  switch (step.value) {
    case 'loading_params':
      return t('components.fitsPlatesolve.titleLoading');
    case 'confirm':
      return t('components.fitsPlatesolve.titleConfirm');
    case 'solving':
      return t('components.fitsPlatesolve.titleSolving');
    case 'result':
      return t('components.fitsPlatesolve.titleResult');
    case 'error':
      return t('components.fitsPlatesolve.titleError');
    default:
      return '';
  }
});

function start() {
  result.value = null;
  errorMessage.value = '';
  step.value = 'browsing';
  showBrowser.value = true;
}

async function onFileSelected(path) {
  selectedFile.value = path;
  step.value = 'loading_params';

  try {
    const params = await apiService.getFitsParameters(path);
    if (!params?.Success) {
      throw new Error(params?.Error || t('components.fitsPlatesolve.errorLoadParams'));
    }

    form.value = {
      focalLength: params.FocalLength ?? null,
      pixelSize: params.PixelSize ?? null,
      binning: params.Binning ?? 1,
      raString: params.RaString ?? '',
      decString: params.DecString ?? '',
      ra: params.Ra ?? null,
      dec: params.Dec ?? null,
    };

    if (params.HasWcs) {
      // Already solved — run analyze to get full result data
      await solve(false);
    } else {
      step.value = 'confirm';
    }
  } catch (e) {
    errorMessage.value = e?.message || t('components.fitsPlatesolve.errorLoadParams');
    step.value = 'error';
  }
}

// Parse "HH:MM:SS" sexagesimal string to degrees (RA: multiply by 15)
function parseRaDeg(str) {
  if (str == null || str === '') return null;
  const n = Number(str);
  if (!isNaN(n)) return n;
  const parts = str.split(':').map(Number);
  if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
    return (parts[0] + parts[1] / 60 + parts[2] / 3600) * 15;
  }
  return null;
}

// Parse "+DD:MM:SS" sexagesimal string to degrees
function parseDecDeg(str) {
  if (str == null || str === '') return null;
  const n = Number(str);
  if (!isNaN(n)) return n;
  const sign = str.startsWith('-') ? -1 : 1;
  const abs = str.replace(/^[+-]/, '');
  const parts = abs.split(':').map(Number);
  if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
    return sign * (parts[0] + parts[1] / 60 + parts[2] / 3600);
  }
  return null;
}

async function solve(blind) {
  step.value = 'solving';
  try {
    const body = {
      path: selectedFile.value,
      focalLength: form.value.focalLength,
      pixelSize: form.value.pixelSize,
      binning: form.value.binning,
      blindSolve: blind,
    };

    if (!blind) {
      const raDeg = parseRaDeg(form.value.raString);
      const decDeg = parseDecDeg(form.value.decString);
      if (raDeg != null) body.ra = raDeg;
      if (decDeg != null) body.dec = decDeg;
    }

    const data = await apiService.analyzeFits(body);
    const success = data?.Success ?? data?.success;
    if (!success) {
      throw new Error(data?.Error || data?.error || t('components.fitsPlatesolve.solveFailed'));
    }

    // Normalize PascalCase → camelCase for result display
    result.value = {
      ra: data.Ra ?? data.ra,
      dec: data.Dec ?? data.dec,
      raString: data.RaString ?? data.raString,
      decString: data.DecString ?? data.decString,
      rotation: data.Rotation ?? data.rotation,
      pixelScale: data.PixelScale ?? data.pixelScale,
    };
    // Write all coordinates into framingStore so the existing slew button
    // in slewAndCenter.vue picks them up immediately — no extra click needed.
    framingStore.RAangle = result.value.ra;
    framingStore.DECangle = result.value.dec;
    framingStore.RAangleString = result.value.raString;
    framingStore.DECangleString = result.value.decString;
    framingStore.rotationAngle = result.value.rotation ?? 0;
    framingStore.isMosaicMode = false;
    framingStore.selectedItem = { Name: 'FITS Plate Solve', RA: result.value.ra, Dec: result.value.dec };
    step.value = 'result';
  } catch (e) {
    errorMessage.value = e?.message || t('components.fitsPlatesolve.solveFailed');
    step.value = 'error';
  }
}

async function useAsTarget() {
  if (!result.value) return;

  if (props.showFraming) {
    // framingStore is already populated when the result arrived — nothing extra to do.
    toastStore.showToast({
      type: 'success',
      title: t('components.fitsPlatesolve.targetApplied'),
      message: `${result.value.raString} / ${result.value.decString}`,
    });
  }

  if (props.showSeqTarget) {
    if (!hasSequenceLoaded.value) {
      toastStore.showToast({
        type: 'error',
        title: t('components.fav_target.modal_sequence.titel'),
        message: t('components.fav_target.modal_sequence_error.message'),
      });
      return;
    }
    try {
      await apiService.sequnceTargetSet(
        'FITS Plate Solve',
        result.value.ra,
        result.value.dec,
        result.value.rotation ?? 0,
        0
      );
      toastStore.showToast({
        type: 'success',
        title: t('components.fav_target.modal_sequence.titel'),
        message: t('components.fav_target.modal_sequence_ok.message'),
      });
    } catch (error) {
      toastStore.showToast({
        type: 'error',
        title: t('components.fav_target.modal_sequence.titel'),
        message:
          error?.response?.data?.Message ||
          t('components.fav_target.modal_sequence_error.message'),
      });
      return;
    }
  }

  step.value = 'idle';
}

function onCancel() {
  step.value = 'idle';
  result.value = null;
  errorMessage.value = '';
}
</script>
