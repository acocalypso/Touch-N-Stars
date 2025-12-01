<template>
  <div class="bahtifocus-view px-4 py-6 lg:px-8">
    <div class="mx-auto flex max-w-6xl flex-col gap-6">
      <header
        class="rounded-2xl border border-gray-700/70 bg-gray-900/80 p-6 shadow-lg backdrop-blur"
      >
        <div class="flex flex-col gap-2">
          <h1 class="text-3xl font-semibold text-white">
            {{ t('plugins.bahtifocus.title') }}
          </h1>
          <p class="text-sm text-gray-300">
            {{ t('plugins.bahtifocus.subtitle') }}
          </p>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <div class="flex flex-col gap-6">
          <section class="rounded-2xl border border-gray-700/70 bg-gray-900/70 p-6 shadow-inner">
            <h2 class="text-lg font-semibold text-white">
              {{ t('plugins.bahtifocus.sections.imageSource') }}
            </h2>
            <p class="mt-1 text-sm text-gray-400">
              {{ t('plugins.bahtifocus.sections.imageSourceHint') }}
            </p>

            <div class="mt-4 flex flex-col gap-4">
              <div class="flex flex-wrap gap-3">
                <label
                  class="relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-cyan-500/60 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
                >
                  <input
                    ref="fileInputRef"
                    type="file"
                    class="hidden"
                    accept=".png,.jpg,.jpeg,.webp,.tif,.tiff,.bmp,.fit,.fits"
                    @change="handleFileChange"
                  />
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.8"
                      d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5-5m0 0 5 5m-5-5v12"
                    />
                  </svg>
                  <span>{{ t('plugins.bahtifocus.image.selectFile') }}</span>
                </label>

                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-lg border border-blue-500/50 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  @click="loadLatestCapturedImage"
                  :disabled="isLoadingCapture"
                >
                  <svg
                    v-if="isLoadingCapture"
                    class="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 0 1 8-8v4l3-3-3-3v2C7.373 4 2 9.373 2 16h4a8 8 0 0 1 8-8z"
                    />
                  </svg>
                  <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="m15 10-3 3-3-3m6-4H9a4 4 0 0 0-4 4v7a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-7a4 4 0 0 0-4-4Z"
                    />
                  </svg>
                  <span>
                    {{
                      isLoadingCapture
                        ? t('plugins.bahtifocus.image.loadingCapture')
                        : t('plugins.bahtifocus.image.useLatestCapture')
                    }}
                  </span>
                </button>

                <select
                  v-if="exampleOptions.length"
                  v-model="selectedExampleKey"
                  class="w-full min-w-[12rem] flex-1 rounded-lg border border-gray-700 bg-gray-950/80 px-3 py-2 text-sm text-gray-200 shadow-inner focus:border-cyan-500 focus:outline-none focus:ring focus:ring-cyan-500/30"
                >
                  <option value="">
                    {{ t('plugins.bahtifocus.image.examplePlaceholder') }}
                  </option>
                  <option v-for="example in exampleOptions" :key="example.key" :value="example.key">
                    {{ example.label }}
                  </option>
                </select>
              </div>

              <div
                v-if="imageState.name"
                class="flex flex-col gap-2 rounded-lg border border-gray-700/80 bg-gray-950/60 p-4 text-sm text-gray-200"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-medium text-white">{{ imageState.name }}</span>
                  <button
                    type="button"
                    class="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-200"
                    @click="clearImage"
                  >
                    {{ t('plugins.bahtifocus.image.clearSelection') }}
                  </button>
                </div>
                <div class="grid gap-2 sm:grid-cols-2">
                  <span class="text-xs text-gray-400">
                    {{ t('plugins.bahtifocus.image.source') }}: {{ imageState.sourceLabel }}
                  </span>
                  <span class="text-xs text-gray-400">
                    {{ t('plugins.bahtifocus.image.size') }}: {{ imageState.sizeLabel }}
                    <template v-if="imageState.wasResized && imageState.originalSizeLabel">
                      (
                      {{
                        t('plugins.bahtifocus.image.originalSize', {
                          size: imageState.originalSizeLabel,
                        })
                      }}
                      )
                    </template>
                  </span>
                  <span class="text-xs text-gray-400">
                    {{ t('plugins.bahtifocus.image.transport') }}: {{ uploadTransportLabel }}
                  </span>
                  <span class="text-xs text-gray-400">
                    {{ t('plugins.bahtifocus.image.mime') }}: {{ imageState.mimeType || 'n/a' }}
                  </span>
                  <span v-if="!imageState.previewAvailable" class="text-xs text-amber-300">
                    {{ t('plugins.bahtifocus.image.previewUnavailable') }}
                  </span>
                </div>
              </div>

              <p v-if="shouldShowImageError" class="text-xs text-red-400">
                {{ errors.image }}
              </p>
            </div>
          </section>

          <section class="rounded-2xl border border-gray-700/70 bg-gray-900/70 p-6 shadow-inner">
            <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-white">
                  {{ t('plugins.bahtifocus.sections.parameters') }}
                </h2>
                <p class="text-sm text-gray-400">
                  {{ t('plugins.bahtifocus.sections.parametersHint') }}
                </p>
              </div>
              <div
                v-if="lastAngles"
                class="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100"
              >
                <p class="font-medium">
                  {{ t('plugins.bahtifocus.previousAngles.savedLabel') }}
                </p>
                <p>{{ lastAngles.map((value) => formatNumber(value, 2)).join('°, ') }}°</p>
              </div>
            </header>

            <form @submit.prevent="handleAnalyze" class="space-y-6">
              <div class="grid gap-4 md:grid-cols-2">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {{ t('plugins.bahtifocus.inputs.focalLength') }}
                  </label>
                  <input
                    v-model="form.focalLength"
                    type="number"
                    step="0.1"
                    min="0"
                    class="default-input"
                    @blur="touchField('focalLength')"
                  />
                  <p
                    v-if="shouldShowError('focalLength', form.focalLength)"
                    class="text-xs text-red-400"
                  >
                    {{ errors.focalLength }}
                  </p>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {{ t('plugins.bahtifocus.inputs.pixelSize') }}
                  </label>
                  <input
                    v-model="form.pixelSize"
                    type="number"
                    step="0.01"
                    min="0"
                    class="default-input"
                    @blur="touchField('pixelSize')"
                  />
                  <p
                    v-if="shouldShowError('pixelSize', form.pixelSize)"
                    class="text-xs text-red-400"
                  >
                    {{ errors.pixelSize }}
                  </p>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {{ t('plugins.bahtifocus.inputs.focalRatio') }}
                  </label>
                  <input
                    v-model="form.focalRatio"
                    type="number"
                    step="0.1"
                    min="0"
                    class="default-input"
                    @blur="touchField('focalRatio')"
                  />
                  <p
                    v-if="shouldShowError('focalRatio', form.focalRatio)"
                    class="text-xs text-red-400"
                  >
                    {{ errors.focalRatio }}
                  </p>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {{ t('plugins.bahtifocus.inputs.apertureDiameter') }}
                  </label>
                  <input
                    v-model="form.apertureDiameter"
                    type="number"
                    step="0.1"
                    min="0"
                    class="default-input"
                    @blur="touchField('apertureDiameter')"
                  />
                  <p
                    v-if="shouldShowError('apertureDiameter', form.apertureDiameter)"
                    class="text-xs text-red-400"
                  >
                    {{ errors.apertureDiameter }}
                  </p>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {{ t('plugins.bahtifocus.inputs.resizeFactor') }}
                  </label>
                  <input
                    v-model="form.resizeFactor"
                    type="number"
                    step="0.1"
                    min="0"
                    class="default-input"
                    @blur="touchField('resizeFactor')"
                  />
                  <p
                    v-if="shouldShowError('resizeFactor', form.resizeFactor)"
                    class="text-xs text-red-400"
                  >
                    {{ errors.resizeFactor }}
                  </p>
                </div>
              </div>

              <div class="space-y-3">
                <label class="flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    v-model="form.cropEnabled"
                    class="h-4 w-4 rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>{{ t('plugins.bahtifocus.crop.enable') }}</span>
                </label>

                <div v-if="form.cropEnabled" class="grid gap-4 md:grid-cols-2">
                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {{ t('plugins.bahtifocus.crop.x') }}
                    </label>
                    <input
                      v-model="form.crop.x"
                      type="number"
                      step="1"
                      min="0"
                      class="default-input"
                      @blur="touchCropField('x')"
                    />
                    <p v-if="shouldShowCropError('x', form.crop.x)" class="text-xs text-red-400">
                      {{ errors.crop.x }}
                    </p>
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {{ t('plugins.bahtifocus.crop.y') }}
                    </label>
                    <input
                      v-model="form.crop.y"
                      type="number"
                      step="1"
                      min="0"
                      class="default-input"
                      @blur="touchCropField('y')"
                    />
                    <p v-if="shouldShowCropError('y', form.crop.y)" class="text-xs text-red-400">
                      {{ errors.crop.y }}
                    </p>
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {{ t('plugins.bahtifocus.crop.width') }}
                    </label>
                    <input
                      v-model="form.crop.width"
                      type="number"
                      step="1"
                      min="1"
                      class="default-input"
                      @blur="touchCropField('width')"
                    />
                    <p
                      v-if="shouldShowCropError('width', form.crop.width)"
                      class="text-xs text-red-400"
                    >
                      {{ errors.crop.width }}
                    </p>
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {{ t('plugins.bahtifocus.crop.height') }}
                    </label>
                    <input
                      v-model="form.crop.height"
                      type="number"
                      step="1"
                      min="1"
                      class="default-input"
                      @blur="touchCropField('height')"
                    />
                    <p
                      v-if="shouldShowCropError('height', form.crop.height)"
                      class="text-xs text-red-400"
                    >
                      {{ errors.crop.height }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-200">
                    {{ t('plugins.bahtifocus.previousAngles.label') }}
                  </label>
                  <button
                    type="button"
                    class="text-xs text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
                    @click="resetAnglesFromStore"
                    v-if="lastAngles"
                  >
                    {{ t('plugins.bahtifocus.previousAngles.reset') }}
                  </button>
                </div>

                <div class="grid gap-4 md:grid-cols-3">
                  <div v-for="index in 3" :key="`angle-${index}`" class="flex flex-col gap-1">
                    <label class="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {{ t('plugins.bahtifocus.previousAngles.input', { index }) }}
                    </label>
                    <input
                      v-model="form.previousAngles[index - 1]"
                      type="number"
                      step="0.01"
                      class="default-input"
                      @blur="touchAngleField(index - 1)"
                    />
                    <p v-if="shouldShowAngleError(index - 1)" class="text-xs text-red-400">
                      {{ errors.previousAngles[index - 1] }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p v-if="analysisDurationMs" class="text-xs text-gray-400">
                  {{
                    t('plugins.bahtifocus.analysis.lastDuration', {
                      seconds: (analysisDurationMs / 1000).toFixed(2),
                    })
                  }}
                </p>
                <div class="flex flex-wrap gap-3">
                  <button
                    type="button"
                    class="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:border-gray-500 hover:bg-gray-800/70"
                    @click="resetFormToDefaults"
                  >
                    {{ t('plugins.bahtifocus.actions.resetForm') }}
                  </button>
                  <button
                    type="submit"
                    class="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-2 text-sm font-semibold text-gray-900 shadow-lg shadow-cyan-500/40 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="isSubmitting"
                  >
                    <svg
                      v-if="isSubmitting"
                      class="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 0 1 8-8v4l3-3-3-3v2C7.373 4 2 9.373 2 16h4a8 8 0 0 1 8-8z"
                      />
                    </svg>
                    <span>
                      {{
                        isSubmitting
                          ? t('plugins.bahtifocus.actions.submitting')
                          : t('plugins.bahtifocus.actions.runAnalysis')
                      }}
                    </span>
                  </button>
                </div>
              </div>

              <p v-if="analysisError" class="text-sm text-red-400">
                {{ analysisError }}
              </p>
            </form>
          </section>

          <section class="rounded-2xl border border-gray-700/70 bg-gray-900/70 p-6 shadow-inner">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-white">
                {{ t('plugins.bahtifocus.overlay.title') }}
              </h2>
              <span v-if="analysisOverlay" class="text-xs text-gray-400">
                {{
                  t('plugins.bahtifocus.overlay.processedSize', {
                    width: analysisOverlay.processedWidth,
                    height: analysisOverlay.processedHeight,
                  })
                }}
              </span>
            </div>

            <div class="relative">
              <div
                v-if="isSubmitting"
                class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-gray-950/70 backdrop-blur-sm"
              >
                <svg class="h-10 w-10 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8v4l3-3-3-3v2C7.373 4 2 9.373 2 16h4a8 8 0 0 1 8-8z"
                  />
                </svg>
              </div>

              <BahtinovOverlay
                :image-src="imageState.previewAvailable ? imageState.previewUrl : ''"
                :overlay="analysisOverlay"
                :fallback-label="t('plugins.bahtifocus.overlay.noImage')"
              />
            </div>
          </section>
        </div>

        <aside class="flex flex-col gap-6">
          <section class="rounded-2xl border border-gray-700/70 bg-gray-900/70 p-6 shadow-lg">
            <h2 class="text-lg font-semibold text-white">
              {{ t('plugins.bahtifocus.results.title') }}
            </h2>

            <div
              v-if="analysisResult && analysisResult.success"
              class="mt-4 space-y-4 text-sm text-gray-200"
            >
              <div class="grid gap-3">
                <div
                  v-for="metric in primaryMetrics"
                  :key="metric.key"
                  class="flex justify-between rounded-lg border border-gray-700/80 bg-gray-950/60 px-3 py-2"
                >
                  <span class="text-gray-300">{{ metric.label }}</span>
                  <span class="font-semibold text-white">{{ metric.value }}</span>
                </div>
              </div>

              <div v-if="lineAngleSummary.length" class="space-y-2">
                <p class="text-xs uppercase tracking-wide text-gray-400">
                  {{ t('plugins.bahtifocus.results.lineAngles') }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="angle in lineAngleSummary"
                    :key="angle.label"
                    class="rounded-md border border-gray-700/70 bg-gray-950/60 px-2 py-1 text-xs text-gray-200"
                  >
                    {{ angle.label }}: {{ angle.value }}
                  </span>
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-xs uppercase tracking-wide text-gray-400">
                  {{ t('plugins.bahtifocus.results.updatedAngles') }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(angle, index) in updatedAngles"
                    :key="`updated-${index}`"
                    class="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100"
                  >
                    θ{{ index + 1 }} = {{ formatNumber(angle, 2) }}°
                  </span>
                </div>
              </div>

              <div class="rounded-lg border border-gray-700/80 bg-gray-950/50 p-3">
                <p class="text-xs uppercase tracking-wide text-gray-400">
                  {{ t('plugins.bahtifocus.results.cropApplied') }}
                </p>
                <p class="mt-1 text-sm text-gray-300">
                  <span v-if="analysisOverlay?.processedCrop">
                    x={{ analysisOverlay.processedCrop.x }}, y={{
                      analysisOverlay.processedCrop.y
                    }}, w={{ analysisOverlay.processedCrop.width }}, h={{
                      analysisOverlay.processedCrop.height
                    }}
                  </span>
                  <span v-else>{{ t('plugins.bahtifocus.results.noCrop') }}</span>
                </p>
              </div>
            </div>

            <p
              v-else-if="analysisResult && !analysisResult.success"
              class="mt-4 text-sm text-red-400"
            >
              {{ analysisResult.error || t('plugins.bahtifocus.results.failure') }}
            </p>

            <p v-else class="mt-4 text-sm text-gray-400">
              {{ t('plugins.bahtifocus.results.placeholder') }}
            </p>
          </section>

          <section class="rounded-2xl border border-gray-700/70 bg-gray-900/70 p-6 shadow-lg">
            <h2 class="text-lg font-semibold text-white">
              {{ t('plugins.bahtifocus.tips.title') }}
            </h2>
            <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-300">
              <li>{{ t('plugins.bahtifocus.tips.tip1') }}</li>
              <li>{{ t('plugins.bahtifocus.tips.tip2') }}</li>
              <li>{{ t('plugins.bahtifocus.tips.tip3') }}</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToastStore } from '@/store/toastStore';
import { useImagetStore } from '@/store/imageStore';
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import BahtinovOverlay from '../components/BahtinovOverlay.vue';

/**
 * @typedef {Object} BahtinovCrop
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} BahtinovMetadata
 * @property {number} focalLength
 * @property {number | null} [focalRatio]
 * @property {number | null} [apertureDiameter]
 * @property {number} pixelSize
 * @property {number | null} [resizeFactor]
 * @property {BahtinovCrop | null} [crop]
 * @property {number[] | null} [previousAngles]
 * @property {string | null} [fileName]
 * @property {string | null} [mimeType]
 * @property {number | null} [imageBytes]
 * @property {number | null} [originalImageBytes]
 * @property {boolean | null} [wasResized]
 * @property {number | null} [imageWidth]
 * @property {number | null} [imageHeight]
 * @property {string | null} [transportMode]
 */

/**
 * @typedef {Object} BahtinovOverlayResponse
 * @property {number} focusErrorPixels
 * @property {number} absoluteFocusError
 * @property {number} criticalFocusThreshold
 * @property {boolean} isWithinCriticalFocus
 * @property {number} maskAngleDegrees
 * @property {number} effectiveResizeFactor
 * @property {number[]} [lineAnglesDegrees]
 * @property {number[]} [updatedAngles]
 * @property {BahtinovCrop | null} [crop]
 */

/**
 * @typedef {Object} BahtinovAnalysisResponse
 * @property {boolean} success
 * @property {string} [error]
 * @property {BahtinovOverlayResponse} [response]
 */

const { t } = useI18n();
const toastStore = useToastStore();
const imageStore = useImagetStore();
const settingsStore = useSettingsStore();
const mainStore = apiStore();

const LAST_ANGLES_STORAGE_KEY = 'bahtifocus:lastAngles';
const LARGE_IMAGE_THRESHOLD_BYTES = 8 * 1024 * 1024;
const RESIZE_MAX_DIMENSION = 2048;
const RESIZE_OUTPUT_TYPE = 'image/jpeg';
const RESIZE_OUTPUT_QUALITY = 0.92;
const RESIZE_COMPATIBLE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/bmp',
  'image/tiff',
]);

const fileInputRef = ref(null);
const selectedExampleKey = ref('');
const exampleOptions = ref([]);
const isLoadingCapture = ref(false);
const analysisLoading = ref(false);
const analysisResult = ref(null);
const analysisError = ref('');
const analysisDurationMs = ref(null);
const showAllErrors = ref(false);
const analysisAbortController = ref(null);

const formTouched = reactive({
  focalLength: false,
  pixelSize: false,
  focalRatio: false,
  apertureDiameter: false,
  resizeFactor: false,
  crop: {
    x: false,
    y: false,
    width: false,
    height: false,
  },
  previousAngles: [false, false, false],
});

const form = reactive({
  focalLength: '',
  focalRatio: '',
  apertureDiameter: '',
  pixelSize: '',
  resizeFactor: '',
  cropEnabled: false,
  crop: {
    x: '',
    y: '',
    width: '',
    height: '',
  },
  previousAngles: ['', '', ''],
});

const errors = reactive({
  focalLength: '',
  focalRatio: '',
  apertureDiameter: '',
  pixelSize: '',
  resizeFactor: '',
  crop: {
    x: '',
    y: '',
    width: '',
    height: '',
  },
  previousAngles: ['', '', ''],
  image: '',
});

const imageState = reactive({
  base64: '',
  dataUrl: '',
  previewUrl: '',
  previewAvailable: false,
  mimeType: '',
  name: '',
  sizeBytes: 0,
  originalSizeBytes: 0,
  blob: null,
  source: '',
  sourceLabel: '',
  sizeLabel: '',
  originalSizeLabel: '',
  wasResized: false,
  width: null,
  height: null,
});

const lastAngles = ref(loadPersistedAngles());

const pluginServerUrl = computed(() => {
  const protocol = settingsStore.backendProtocol || 'http';
  const connection = settingsStore.connection || {};
  const host = connection.ip || window.location.hostname;
  let port = connection.port || window.location.port || '';

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev && Number(port) === 8080) {
    port = '5000';
  }

  if (!port) {
    port = '5000';
  }

  const base = port ? `${protocol}://${host}:${port}` : `${protocol}://${host}`;
  return `${base.replace(/\/$/, '')}/api`;
});

const analysisEndpoint = computed(() => {
  const base = pluginServerUrl.value;
  if (!base) return '';
  return `${base.replace(/\/$/, '')}/bahtinov/analyze`;
});

const analysisOverlay = computed(() => analysisResult.value?.response ?? null);
const isSubmitting = computed(() => analysisLoading.value);

const shouldShowImageError = computed(
  () => Boolean(errors.image) && (showAllErrors.value || isSubmitting.value)
);

const uploadTransportLabel = computed(() => {
  if (!imageState.blob) {
    return t('plugins.bahtifocus.image.transportLegacy');
  }
  return supportsBinaryUploads(imageState.blob)
    ? t('plugins.bahtifocus.image.transportBinary')
    : t('plugins.bahtifocus.image.transportLegacy');
});

const primaryMetrics = computed(() => {
  if (!analysisResult.value?.success || !analysisOverlay.value) return [];
  const overlay = analysisOverlay.value;
  return [
    {
      key: 'focusErrorPixels',
      label: t('plugins.bahtifocus.results.focusErrorPixels'),
      value: formatNumber(overlay.focusErrorPixels, 2),
    },
    {
      key: 'absoluteFocusError',
      label: t('plugins.bahtifocus.results.absoluteFocusError'),
      value: `${formatNumber(overlay.absoluteFocusError, 3)} mm`,
    },
    {
      key: 'criticalFocusThreshold',
      label: t('plugins.bahtifocus.results.criticalFocusThreshold'),
      value: `${formatNumber(overlay.criticalFocusThreshold, 3)} mm`,
    },
    {
      key: 'isWithinCriticalFocus',
      label: t('plugins.bahtifocus.results.isWithinCriticalFocus'),
      value: overlay.isWithinCriticalFocus
        ? t('plugins.bahtifocus.results.focusOk')
        : t('plugins.bahtifocus.results.focusNotOk'),
    },
    {
      key: 'maskAngle',
      label: t('plugins.bahtifocus.results.maskAngle'),
      value: `${formatNumber(overlay.maskAngleDegrees, 2)}°`,
    },
    {
      key: 'effectiveResizeFactor',
      label: t('plugins.bahtifocus.results.effectiveResizeFactor'),
      value: formatNumber(overlay.effectiveResizeFactor, 2),
    },
  ];
});

const lineAngleSummary = computed(() => {
  const overlay = analysisOverlay.value;
  if (!overlay?.lineAnglesDegrees) return [];
  return overlay.lineAnglesDegrees.map((value, index) => ({
    label: `θ${index + 1}`,
    value: `${formatNumber(value, 2)}°`,
  }));
});

const updatedAngles = computed(() => analysisOverlay.value?.updatedAngles ?? []);

function touchField(field) {
  if (field in formTouched) {
    formTouched[field] = true;
  }
}

function touchCropField(field) {
  formTouched.crop[field] = true;
}

function touchAngleField(index) {
  formTouched.previousAngles[index] = true;
}

function shouldShowError(field, value) {
  if (!errors[field]) return false;
  const fieldTouched = formTouched[field];
  const hasValue = typeof value === 'string' ? value.trim() !== '' : value != null;
  return Boolean(errors[field] && (fieldTouched || hasValue || showAllErrors.value));
}

function shouldShowCropError(field, value) {
  if (!errors.crop[field]) return false;
  const touched = formTouched.crop[field];
  const hasValue = typeof value === 'string' ? value.trim() !== '' : value != null;
  return Boolean(errors.crop[field] && (touched || hasValue || showAllErrors.value));
}

function shouldShowAngleError(index) {
  if (!errors.previousAngles[index]) return false;
  const value = form.previousAngles[index];
  const touched = formTouched.previousAngles[index];
  const hasValue = typeof value === 'string' ? value.trim() !== '' : value != null;
  return Boolean(errors.previousAngles[index] && (touched || hasValue || showAllErrors.value));
}

function formatNumber(value, fractionDigits = 2) {
  if (!Number.isFinite(Number(value))) return '–';
  return Number(value).toFixed(fractionDigits);
}

async function handleFileChange(event) {
  const [file] = event.target.files || [];
  event.target.value = '';
  if (!file) return;
  try {
    await setImageFromBlob(file, file.name, 'upload');
    selectedExampleKey.value = '';
  } catch (error) {
    handleError(error, t('plugins.bahtifocus.errors.readFile'));
  }
}

async function loadLatestCapturedImage() {
  if (isLoadingCapture.value) return;
  try {
    isLoadingCapture.value = true;
    if (!imageStore.imageData) {
      await imageStore.getImage();
    }
    if (!imageStore.imageData) {
      throw new Error('No image available');
    }
    const response = await fetch(imageStore.imageData);
    if (!response.ok) throw new Error('Failed to load image');
    const blob = await response.blob();
    const inferredName = t('plugins.bahtifocus.image.capturedName');
    await setImageFromBlob(blob, inferredName, 'capture');
    selectedExampleKey.value = '';
  } catch (error) {
    handleError(error, t('plugins.bahtifocus.errors.captureLoad'));
  } finally {
    isLoadingCapture.value = false;
  }
}

function clearImage() {
  imageState.base64 = '';
  imageState.dataUrl = '';
  imageState.previewUrl = '';
  imageState.previewAvailable = false;
  imageState.mimeType = '';
  imageState.name = '';
  imageState.sizeBytes = 0;
  imageState.originalSizeBytes = 0;
  imageState.blob = null;
  imageState.originalSizeLabel = '';
  imageState.wasResized = false;
  imageState.width = null;
  imageState.height = null;
  imageState.source = '';
  imageState.sourceLabel = '';
  imageState.sizeLabel = '';
}

function handleError(error, fallbackMessage) {
  const message = error?.message || fallbackMessage;
  toastStore.showToast({
    type: 'error',
    title: t('plugins.bahtifocus.errors.title'),
    message,
    autoClose: true,
  });
  console.error('[Bahtifocus] Error:', error);
}

async function setImageFromBlob(blob, name, source) {
  const normalized = await prepareImageForUpload(blob, name);
  const processedBlob = normalized.blob;
  const dataUrl = await blobToDataUrl(processedBlob);
  const [, base64] = dataUrl.split(',', 2);
  if (!base64) {
    throw new Error('Unable to extract base64 image data');
  }

  imageState.base64 = base64.trim();
  imageState.dataUrl = dataUrl;
  imageState.blob = processedBlob;
  imageState.name = name || 'image';
  imageState.mimeType = normalized.mime || processedBlob.type || inferMimeType(name);
  imageState.sizeBytes = processedBlob.size;
  imageState.sizeLabel = formatBytes(processedBlob.size);
  imageState.originalSizeBytes = blob.size;
  imageState.originalSizeLabel = formatBytes(blob.size);
  imageState.wasResized = normalized.resized;
  imageState.width = normalized.width ?? null;
  imageState.height = normalized.height ?? null;
  imageState.source = source;
  imageState.sourceLabel = sourceLabelFor(source);
  imageState.previewAvailable = isPreviewable(imageState.mimeType);
  imageState.previewUrl = imageState.previewAvailable ? dataUrl : '';

  if (normalized.resized && normalized.width && normalized.height) {
    toastStore.showToast({
      type: 'info',
      title: t('plugins.bahtifocus.image.resizedTitle'),
      message: t('plugins.bahtifocus.image.resizedMessage', {
        width: normalized.width,
        height: normalized.height,
        size: imageState.sizeLabel,
        originalSize: imageState.originalSizeLabel,
      }),
      autoClose: true,
    });
  }
}

function inferMimeType(name = '') {
  const extension = name.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'tif':
    case 'tiff':
      return 'image/tiff';
    case 'bmp':
      return 'image/bmp';
    case 'fit':
    case 'fits':
      return 'application/fits';
    default:
      return 'application/octet-stream';
  }
}

function isPreviewable(mimeType) {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'].includes(mimeType);
}

function sourceLabelFor(source) {
  if (source === 'capture') {
    return t('plugins.bahtifocus.image.sourceCaptured');
  }
  if (source === 'example') {
    return t('plugins.bahtifocus.image.sourceExample');
  }
  if (source === 'upload') {
    return t('plugins.bahtifocus.image.sourceUpload');
  }
  return '—';
}

async function blobToDataUrl(blob) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(blob);
  });
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(1)} ${units[exponent]}`;
}

async function prepareImageForUpload(blob, name) {
  const mime = (blob.type || inferMimeType(name)).toLowerCase();
  const baseMime = mime.split(';')[0];
  const isResizeCandidate =
    blob.size > LARGE_IMAGE_THRESHOLD_BYTES && RESIZE_COMPATIBLE_MIME_TYPES.has(baseMime);

  if (!isResizeCandidate) {
    return { blob, mime: baseMime, resized: false };
  }

  try {
    const image = await loadImageElementFromBlob(blob);
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    const longestEdge = Math.max(naturalWidth, naturalHeight);

    if (!longestEdge) {
      return { blob, mime, resized: false };
    }

    const scale = RESIZE_MAX_DIMENSION / longestEdge;
    if (scale >= 1) {
      return { blob, mime: baseMime, resized: false };
    }

    const targetWidth = Math.max(1, Math.round(naturalWidth * scale));
    const targetHeight = Math.max(1, Math.round(naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      return { blob, mime: baseMime, resized: false };
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);
    const resizedBlob = await canvasToBlob(canvas, RESIZE_OUTPUT_TYPE, RESIZE_OUTPUT_QUALITY);

    if (!resizedBlob || resizedBlob.size >= blob.size) {
      return { blob, mime: baseMime, resized: false };
    }

    return {
      blob: resizedBlob,
      mime: RESIZE_OUTPUT_TYPE,
      resized: true,
      width: targetWidth,
      height: targetHeight,
    };
  } catch (error) {
    console.warn('[Bahtifocus] Failed to resize image', error);
    return { blob, mime: baseMime, resized: false };
  }
}

async function loadImageElementFromBlob(blob) {
  const objectUrl = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to read image for resizing'));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function canvasToBlob(canvas, type, quality) {
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Canvas conversion failed'));
          return;
        }
        resolve(result);
      },
      type,
      quality
    );
  });
}

async function submitBahtinovAnalysis(metadata, controller) {
  const endpoint = analysisEndpoint.value;
  if (!endpoint) {
    throw new Error(t('plugins.bahtifocus.errors.missingServer'));
  }

  const blob = imageState.blob;
  if (!blob) {
    throw new Error(t('plugins.bahtifocus.validation.imageRequired'));
  }

  if (supportsBinaryUploads(blob)) {
    metadata.transportMode = 'binary';
    metadata.imageBytes = blob.size;
    const metadataHeader = JSON.stringify(metadata);
    const contentType = imageState.mimeType || blob.type || inferMimeType(imageState.name);
    const binaryPayload = await blob.arrayBuffer();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'X-Bahtinov-Metadata': metadataHeader,
      },
      body: binaryPayload,
      signal: controller.signal,
      keepalive: false,
    });

    const responseType = response.headers.get('content-type') || '';
    if (
      response.status === 404 ||
      response.status === 415 ||
      response.status === 501 ||
      responseType.includes('text/html')
    ) {
      console.warn(
        '[Bahtifocus] Binary endpoint not available, retrying with legacy JSON payload.'
      );
      metadata.transportMode = 'legacy-json';
      return await submitLegacyAnalysis(metadata, controller);
    }

    return await parseBahtinovResponse(response);
  }

  console.warn('[Bahtifocus] Binary uploads not supported, falling back to legacy JSON payload.');
  metadata.transportMode = 'legacy-json';
  return await submitLegacyAnalysis(metadata, controller);
}

async function submitLegacyAnalysis(metadata, controller) {
  const endpoint = analysisEndpoint.value;
  if (!endpoint) {
    throw new Error(t('plugins.bahtifocus.errors.missingServer'));
  }
  if (!imageState.base64) {
    throw new Error(t('plugins.bahtifocus.validation.imageRequired'));
  }

  const payload = {
    ...metadata,
    imageBase64: imageState.base64,
    mimeType: imageState.mimeType || undefined,
    fileName: imageState.name || undefined,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
    keepalive: false,
  });

  return await parseBahtinovResponse(response);
}

function supportsBinaryUploads(blob) {
  return (
    typeof Blob !== 'undefined' &&
    typeof Headers !== 'undefined' &&
    blob &&
    typeof blob.arrayBuffer === 'function' &&
    typeof fetch === 'function'
  );
}

function normalizeAnalysisPayload(value) {
  if (!value || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeAnalysisPayload(entry));
  }

  const normalized = {};
  for (const [originalKey, originalValue] of Object.entries(value)) {
    const key = originalKey.charAt(0).toLowerCase() + originalKey.slice(1);
    normalized[key] = normalizeAnalysisPayload(originalValue);
  }

  return normalized;
}

async function parseBahtinovResponse(response) {
  let data = null;
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          data = { success: false, error: text };
        }
      }
    }
  } catch (parseError) {
    console.warn('[Bahtifocus] Failed to parse analyzer response', parseError);
  }

  if (!data) {
    data = { success: response.ok };
  }

  const normalized = normalizeAnalysisPayload(data);
  const result = {
    success: normalized.success ?? response.ok,
    error: normalized.error ?? null,
    response: normalized.response ?? null,
    statusCode: normalized.statusCode ?? response.status,
    raw: normalized,
  };

  if (!result.success) {
    result.success = false;
    if (!result.error) {
      result.error = response.statusText || 'Request failed';
    }
  }

  return result;
}

function runValidation() {
  errors.focalLength = '';
  errors.focalRatio = '';
  errors.apertureDiameter = '';
  errors.pixelSize = '';
  errors.resizeFactor = '';
  errors.crop.x = '';
  errors.crop.y = '';
  errors.crop.width = '';
  errors.crop.height = '';
  errors.previousAngles = ['', '', ''];
  errors.image = '';

  const parsed = {
    focalLength: parsePositive(form.focalLength),
    focalRatio: parsePositiveOptional(form.focalRatio),
    apertureDiameter: parsePositiveOptional(form.apertureDiameter),
    pixelSize: parsePositive(form.pixelSize),
    resizeFactor: parsePositiveOptional(form.resizeFactor),
    crop: null,
    previousAngles: null,
  };

  let valid = true;

  if (!parsed.focalLength) {
    errors.focalLength = t('plugins.bahtifocus.validation.requiredPositive');
    valid = false;
  }

  if (!parsed.pixelSize) {
    errors.pixelSize = t('plugins.bahtifocus.validation.requiredPositive');
    valid = false;
  }

  const ratioProvided = parsed.focalRatio != null;
  const apertureProvided = parsed.apertureDiameter != null;

  if (form.focalRatio && !ratioProvided) {
    errors.focalRatio = t('plugins.bahtifocus.validation.invalidPositive');
    valid = false;
  }

  if (form.apertureDiameter && !apertureProvided) {
    errors.apertureDiameter = t('plugins.bahtifocus.validation.invalidPositive');
    valid = false;
  }

  if (!ratioProvided && !apertureProvided) {
    errors.focalRatio = t('plugins.bahtifocus.validation.ratioOrAperture');
    errors.apertureDiameter = t('plugins.bahtifocus.validation.ratioOrAperture');
    valid = false;
  }

  if (form.resizeFactor && !parsed.resizeFactor) {
    errors.resizeFactor = t('plugins.bahtifocus.validation.invalidPositive');
    valid = false;
  }

  if (form.cropEnabled) {
    const cropParsed = {
      x: parseNonNegative(form.crop.x),
      y: parseNonNegative(form.crop.y),
      width: parsePositive(form.crop.width),
      height: parsePositive(form.crop.height),
    };

    if (cropParsed.x == null) {
      errors.crop.x = t('plugins.bahtifocus.validation.invalidNonNegative');
      valid = false;
    }
    if (cropParsed.y == null) {
      errors.crop.y = t('plugins.bahtifocus.validation.invalidNonNegative');
      valid = false;
    }
    if (cropParsed.width == null) {
      errors.crop.width = t('plugins.bahtifocus.validation.requiredPositive');
      valid = false;
    }
    if (cropParsed.height == null) {
      errors.crop.height = t('plugins.bahtifocus.validation.requiredPositive');
      valid = false;
    }

    parsed.crop = valid
      ? {
          x: cropParsed.x,
          y: cropParsed.y,
          width: cropParsed.width,
          height: cropParsed.height,
        }
      : null;
  } else {
    parsed.crop = null;
  }

  const trimmedAngles = form.previousAngles.map((value) => value.toString().trim());
  const anyAngleProvided = trimmedAngles.some((value) => value !== '');
  if (anyAngleProvided) {
    const parsedAngles = trimmedAngles.map((value, index) => {
      const number = Number(value);
      if (value === '') {
        errors.previousAngles[index] = t('plugins.bahtifocus.validation.allAnglesRequired');
        return null;
      }
      if (!Number.isFinite(number)) {
        errors.previousAngles[index] = t('plugins.bahtifocus.validation.invalidNumber');
        return null;
      }
      return number;
    });
    if (parsedAngles.every((value) => Number.isFinite(value))) {
      parsed.previousAngles = parsedAngles;
    } else {
      valid = false;
    }
  } else {
    parsed.previousAngles = lastAngles.value ?? null;
  }

  if (!imageState.blob && !imageState.base64) {
    errors.image = t('plugins.bahtifocus.validation.imageRequired');
    valid = false;
  }

  return { valid, parsed };
}

function parsePositive(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return number;
}

function parsePositiveOptional(value) {
  const trimmed = value?.toString().trim();
  if (!trimmed) return null;
  return parsePositive(trimmed);
}

function parseNonNegative(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return number;
}

async function handleAnalyze() {
  const { valid, parsed } = runValidation();
  if (!valid) {
    showAllErrors.value = true;
    toastStore.showToast({
      type: 'warning',
      title: t('plugins.bahtifocus.validation.title'),
      message: t('plugins.bahtifocus.validation.fixErrors'),
      autoClose: true,
    });
    return;
  }

  showAllErrors.value = false;
  analysisLoading.value = true;
  analysisError.value = '';
  const previousController = analysisAbortController.value;
  if (previousController) {
    previousController.abort();
  }
  const controller = new AbortController();
  analysisAbortController.value = controller;
  const started = performance.now();

  try {
    if (localStorage.getItem('USE_MOCK_API') === 'true') {
      throw new Error(t('plugins.bahtifocus.errors.mockMode'));
    }

    const metadata = buildBahtinovMetadata(parsed);
    const response = await submitBahtinovAnalysis(metadata, controller);

    if (!response?.success) {
      analysisError.value = response?.error || t('plugins.bahtifocus.errors.analysisFailed');
      analysisResult.value = response;
      return;
    }

    analysisResult.value = response;
    if (Array.isArray(response.response?.updatedAngles)) {
      lastAngles.value = response.response.updatedAngles;
      persistAngles(lastAngles.value);
      form.previousAngles = response.response.updatedAngles.map((value) => value.toFixed(2));
    }

    toastStore.showToast({
      type: 'success',
      title: t('plugins.bahtifocus.results.successTitle'),
      message: t('plugins.bahtifocus.results.successMessage'),
      autoClose: true,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return;
    }
    if (error?.response?.status === 400) {
      analysisError.value =
        error.response?.data?.error ||
        error.response?.data?.message ||
        t('plugins.bahtifocus.errors.badRequest');
    } else {
      analysisError.value = error?.message || t('plugins.bahtifocus.errors.analysisFailed');
    }
    analysisResult.value = null;
    handleError(error, analysisError.value);
  } finally {
    const isCurrent = analysisAbortController.value === controller;
    if (isCurrent) {
      analysisAbortController.value = null;
      analysisLoading.value = false;
      analysisDurationMs.value = performance.now() - started;
    }
  }
}

function buildBahtinovMetadata(parsed) {
  const blob = imageState.blob;
  return {
    focalLength: parsed.focalLength,
    focalRatio: parsed.focalRatio ?? null,
    apertureDiameter: parsed.apertureDiameter ?? null,
    pixelSize: parsed.pixelSize,
    resizeFactor: parsed.resizeFactor ?? null,
    crop: parsed.crop ?? null,
    previousAngles: parsed.previousAngles ?? null,
    fileName: imageState.name || null,
    mimeType: imageState.mimeType || (imageState.name ? inferMimeType(imageState.name) : null),
    imageBytes: imageState.sizeBytes || (blob ? blob.size : null) || null,
    originalImageBytes: imageState.originalSizeBytes || null,
    wasResized: imageState.wasResized ?? null,
    imageWidth: imageState.width ?? null,
    imageHeight: imageState.height ?? null,
    transportMode: supportsBinaryUploads(blob) ? 'binary' : 'legacy-json',
  };
}

function resetFormToDefaults() {
  applyDefaults();
  showAllErrors.value = false;
  runValidation();
}

function resetAnglesFromStore() {
  if (!lastAngles.value) return;
  form.previousAngles = lastAngles.value.map((value) => value.toFixed(2));
}

function persistAngles(angles) {
  if (!Array.isArray(angles) || angles.length !== 3) return;
  localStorage.setItem(LAST_ANGLES_STORAGE_KEY, JSON.stringify(angles));
}

function loadPersistedAngles() {
  try {
    const stored = localStorage.getItem(LAST_ANGLES_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length !== 3) return null;
    if (!parsed.every((value) => Number.isFinite(value))) return null;
    return parsed;
  } catch (error) {
    console.warn('[Bahtifocus] Failed to parse persisted angles', error);
    return null;
  }
}

function applyDefaults() {
  const profile = mainStore.profileInfo;
  form.focalLength = toStringSafe(profile?.TelescopeSettings?.FocalLength);
  form.pixelSize = toStringSafe(profile?.CameraSettings?.PixelSize);
  form.focalRatio = toStringSafe(profile?.TelescopeSettings?.FocalRatio);
  form.apertureDiameter = toStringSafe(profile?.TelescopeSettings?.Aperture);
  form.resizeFactor = '';
  form.cropEnabled = false;
  form.crop.x = '';
  form.crop.y = '';
  form.crop.width = '';
  form.crop.height = '';
  if (lastAngles.value) {
    form.previousAngles = lastAngles.value.map((value) => value.toFixed(2));
  } else {
    form.previousAngles = ['', '', ''];
  }
}

function toStringSafe(value) {
  if (!Number.isFinite(Number(value))) return '';
  return String(value);
}

async function loadExampleAsset(key) {
  const example = exampleOptions.value.find((entry) => entry.key === key);
  if (!example) return;
  try {
    const response = await fetch(example.url);
    if (!response.ok) throw new Error('Failed to load example image');
    const blob = await response.blob();
    await setImageFromBlob(blob, example.label, 'example');
  } catch (error) {
    handleError(error, t('plugins.bahtifocus.errors.exampleLoad'));
  }
}

watch(
  () => selectedExampleKey.value,
  (value) => {
    if (value) {
      loadExampleAsset(value);
    }
  }
);

watch(
  () => ({
    focalLength: form.focalLength,
    focalRatio: form.focalRatio,
    apertureDiameter: form.apertureDiameter,
    pixelSize: form.pixelSize,
    resizeFactor: form.resizeFactor,
    cropEnabled: form.cropEnabled,
    crop: { ...form.crop },
    previousAngles: [...form.previousAngles],
    image: imageState.blob ? imageState.blob.size : imageState.base64,
    imageMime: imageState.mimeType,
  }),
  () => runValidation(),
  { deep: true }
);

onMounted(() => {
  applyDefaults();
  populateExampleOptions();
  runValidation();
});

onBeforeUnmount(() => {
  if (analysisAbortController.value) {
    analysisAbortController.value.abort();
  }
});

function populateExampleOptions() {
  try {
    const context = require.context('../image', false, /\.(png|jpe?g|webp|bmp|tiff?|fit|fits)$/i);
    exampleOptions.value = context
      .keys()
      .map((key) => ({
        key,
        label: key.replace('./', ''),
        url: context(key),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.warn('[Bahtifocus] No example images available', error);
    exampleOptions.value = [];
  }
}
</script>

<style scoped lang="postcss">
.default-input {
  @apply rounded-lg border border-gray-700 bg-gray-950/80 px-3 py-2 text-sm text-gray-200 shadow-inner focus:border-cyan-500 focus:outline-none focus:ring focus:ring-cyan-500/30;
}

.bahtifocus-view {
  min-height: calc(100vh - 4rem);
}
</style>
