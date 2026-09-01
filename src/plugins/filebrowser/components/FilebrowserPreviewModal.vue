<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-top bg-black/75 backdrop-blur-sm p-4 flex items-center justify-center"
      @click.self="$emit('close')"
    >
      <div
        class="w-full max-w-5xl max-h-[92vh] bg-surface-1 border border-line rounded-card overflow-hidden shadow-xl"
      >
        <div class="flex items-center gap-2 px-3 py-2 border-b border-line">
          <p class="text-sm font-semibold text-content truncate flex-1 min-w-0">{{ fileName }}</p>
          <button
            type="button"
            class="tns-btn-secondary w-auto px-3"
            :disabled="isDownloading"
            :title="$t('plugins.filebrowser.download.action')"
            @click="$emit('download')"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 3v12" />
              <path d="M7 12l5 5 5-5" />
              <path d="M4 21h16" />
            </svg>
          </button>
          <button
            type="button"
            class="tns-btn-secondary w-auto px-3"
            :title="$t('common.close')"
            @click="$emit('close')"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-3 bg-ground max-h-[calc(92vh-64px)] overflow-auto">
          <div
            v-if="loading"
            class="min-h-[300px] flex items-center justify-center text-sm text-content-muted"
          >
            {{ $t('plugins.filebrowser.loading') }}
          </div>

          <div
            v-else-if="error"
            class="min-h-[300px] flex items-center justify-center text-sm text-status-danger text-center px-4"
          >
            {{ error }}
          </div>

          <img
            v-else-if="mode === 'image'"
            :src="url"
            :alt="fileName"
            class="mx-auto max-w-full max-h-[calc(92vh-100px)] object-contain"
            @error="$emit('image-error')"
          />

          <canvas
            v-else
            :ref="setCanvasRef"
            class="mx-auto max-w-full max-h-[calc(92vh-100px)] object-contain"
            style="image-rendering: auto"
          />

          <template v-if="mode === 'fits' && !loading && !error && stats">
            <!-- Render controls: this is the part users actually operate. -->
            <div
              class="mt-3 rounded-control border border-line bg-surface-1 p-3 flex flex-col gap-3"
            >
              <label
                class="flex items-center gap-3 text-sm text-content min-h-touch cursor-pointer"
              >
                <input
                  v-model="autoStretchModel"
                  type="checkbox"
                  class="h-5 w-5 rounded border-line-strong bg-surface-2 text-accent-action"
                />
                <span>{{ $t('plugins.filebrowser.fits.autoStretch') }}</span>
              </label>

              <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                <span class="text-sm text-content-muted sm:w-44 shrink-0">
                  {{ $t('plugins.filebrowser.fits.preStretch') }}
                </span>
                <select v-model="stretchModeModel" :disabled="!autoStretch" class="tns-select">
                  <option value="linear">{{ $t('plugins.filebrowser.fits.modeLinear') }}</option>
                  <option value="sqrt">{{ $t('plugins.filebrowser.fits.modeSqrt') }}</option>
                  <option value="log">{{ $t('plugins.filebrowser.fits.modeLog') }}</option>
                  <option value="asinh">{{ $t('plugins.filebrowser.fits.modeAsinh') }}</option>
                </select>
              </div>

              <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                <span class="text-sm text-content-muted sm:w-44 shrink-0">
                  {{
                    stretchMode === 'linear'
                      ? $t('plugins.filebrowser.fits.clipStrength')
                      : $t('plugins.filebrowser.fits.stretchStrength')
                  }}
                </span>
                <input
                  :value="localStretchStrength"
                  type="range"
                  min="0"
                  max="20"
                  step="0.1"
                  :disabled="!autoStretch"
                  class="w-full"
                  @input="onStretchStrengthInput"
                  @change="commitStretchStrength"
                />
                <span class="text-sm text-content min-w-[48px] text-right tabular-nums">
                  {{ localStretchStrength.toFixed(2) }}
                </span>
              </div>

              <label
                class="flex items-center gap-3 text-sm text-content min-h-touch cursor-pointer"
              >
                <input
                  v-model="autoWhiteBalanceModel"
                  type="checkbox"
                  class="h-5 w-5 rounded border-line-strong bg-surface-2 text-accent-action"
                />
                <span>{{ $t('plugins.filebrowser.fits.autoWhiteBalance') }}</span>
              </label>
            </div>

            <!-- Diagnostics: collapsed by default, this is developer detail. -->
            <details class="mt-3 rounded-control border border-line bg-surface-1">
              <summary
                class="cursor-pointer px-3 py-3 min-h-touch flex items-center text-sm text-content-muted hover:text-content"
              >
                {{ $t('plugins.filebrowser.fits.debugTitle') }}
              </summary>

              <div
                class="grid grid-cols-2 md:grid-cols-4 gap-2 px-3 pb-3 text-xs text-content-muted"
              >
                <div>
                  <span class="text-content-faint"
                    >{{ $t('plugins.filebrowser.fits.pattern') }}:</span
                  >
                  {{ stats.bayerPattern || $t('plugins.filebrowser.fits.none') }}
                </div>
                <div><span class="text-content-faint">BITPIX:</span> {{ stats.bitpix }}</div>
                <div>
                  <span class="text-content-faint">{{ $t('plugins.filebrowser.fits.size') }}:</span>
                  {{ stats.width }} x {{ stats.height }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.stretch') }}:
                  </span>
                  {{ stats.low.toFixed(2) }}..{{ stats.high.toFixed(2) }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.clipBase') }}:
                  </span>
                  {{ stats.clippedLow.toFixed(2) }}..{{ stats.clippedHigh.toFixed(2) }}
                </div>
                <div>
                  <span class="text-content-faint">{{ $t('plugins.filebrowser.fits.min') }}:</span>
                  {{ stats.min.toFixed(2) }}
                </div>
                <div>
                  <span class="text-content-faint">{{ $t('plugins.filebrowser.fits.max') }}:</span>
                  {{ stats.max.toFixed(2) }}
                </div>
                <div>
                  <span class="text-content-faint">{{ $t('plugins.filebrowser.fits.mean') }}:</span>
                  {{ stats.mean.toFixed(2) }}
                </div>
                <div>
                  <span class="text-content-faint">{{ $t('plugins.filebrowser.fits.std') }}:</span>
                  {{ stats.std.toFixed(2) }}
                </div>
                <div>
                  <span class="text-content-faint">{{ $t('plugins.filebrowser.fits.mode') }}:</span>
                  {{ stats.stretchMode }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.autoStretch') }}:
                  </span>
                  {{ stats.autoStretch ? $t('general.yes') : $t('general.no') }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{
                      stats.stretchMode === 'linear'
                        ? $t('plugins.filebrowser.fits.clipStrength')
                        : $t('plugins.filebrowser.fits.stretchStrength')
                    }}:
                  </span>
                  {{ stats.stretchStrength.toFixed(2) }}
                </div>
                <div>
                  <span class="text-content-faint">{{ $t('plugins.filebrowser.fits.prep') }}:</span>
                  {{ perf.prepareMs.toFixed(1) }} ms
                </div>
                <div>
                  <span class="text-content-faint"
                    >{{ $t('plugins.filebrowser.fits.parse') }}:</span
                  >
                  {{ perf.parseMs.toFixed(1) }} ms
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.decode') }}:
                  </span>
                  {{ perf.decodeMs.toFixed(1) }} ms
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.debayer') }}:
                  </span>
                  {{ perf.demosaicMs.toFixed(1) }} ms
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.render') }}:
                  </span>
                  {{ perf.renderMs.toFixed(1) }} ms
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.renders') }}:
                  </span>
                  {{ perf.renderCount }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.queued') }}:
                  </span>
                  {{ perf.queueSkips }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.reason') }}:
                  </span>
                  {{ perf.lastReason }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.autoWhiteBalance') }}:
                  </span>
                  {{ stats.autoWhiteBalance ? $t('general.yes') : $t('general.no') }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.wbGains') }}:
                  </span>
                  R {{ stats.whiteBalanceGains.r.toFixed(2) }} G
                  {{ stats.whiteBalanceGains.g.toFixed(2) }} B
                  {{ stats.whiteBalanceGains.b.toFixed(2) }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.headerSource') }}:
                  </span>
                  {{ stats.headerSource }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.inferred') }}:
                  </span>
                  {{ formatInferredFields(stats.inferredHeaderFields) }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.decodedPixels') }}:
                  </span>
                  {{ stats.decodablePixelCount }} / {{ stats.width * stats.height }}
                </div>
                <div>
                  <span class="text-content-faint">
                    {{ $t('plugins.filebrowser.fits.truncated') }}:
                  </span>
                  {{ stats.truncated ? $t('general.yes') : $t('general.no') }}
                </div>
                <div>
                  <span class="text-content-faint"
                    >{{ $t('plugins.filebrowser.fits.curve') }}:</span
                  >
                  {{
                    `${stats.curveSamples.p10.toFixed(3)}/${stats.curveSamples.p50.toFixed(3)}/${stats.curveSamples.p90.toFixed(3)}`
                  }}
                </div>
              </div>

              <div v-if="headerEntries.length" class="px-3 pb-3">
                <p class="text-xs text-content-faint mb-1">
                  {{ $t('plugins.filebrowser.fits.header') }}
                </p>
                <div class="max-h-48 overflow-auto rounded-control border border-line bg-surface-2">
                  <div
                    v-for="entry in headerEntries"
                    :key="entry.key"
                    class="grid grid-cols-[120px_1fr] gap-2 px-2 py-1 border-b border-line last:border-b-0 text-xs"
                  >
                    <span class="text-content-faint">{{ entry.key }}</span>
                    <span class="text-content break-all select-text">{{ entry.value }}</span>
                  </div>
                </div>
              </div>
            </details>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  mode: { type: String, default: 'image' },
  url: { type: String, default: '' },
  fileName: { type: String, default: '' },
  isDownloading: { type: Boolean, default: false },
  stats: { type: Object, default: null },
  perf: {
    type: Object,
    default: () => ({
      prepareMs: 0,
      parseMs: 0,
      decodeMs: 0,
      demosaicMs: 0,
      renderMs: 0,
      renderCount: 0,
      queueSkips: 0,
      lastReason: 'idle',
    }),
  },
  headerEntries: { type: Array, default: () => [] },
  autoStretch: { type: Boolean, default: false },
  stretchMode: { type: String, default: 'asinh' },
  stretchStrength: { type: Number, default: 0 },
  autoWhiteBalance: { type: Boolean, default: true },
});

const emit = defineEmits([
  'close',
  'download',
  'image-error',
  'update:autoStretch',
  'update:stretchMode',
  'update:stretchStrength',
  'update:autoWhiteBalance',
  'set-canvas-ref',
]);

const autoStretchModel = computed({
  get: () => props.autoStretch,
  set: (value) => emit('update:autoStretch', value),
});

const stretchModeModel = computed({
  get: () => props.stretchMode,
  set: (value) => emit('update:stretchMode', value),
});

const localStretchStrength = ref(props.stretchStrength);

watch(
  () => props.stretchStrength,
  (value) => {
    const numeric = Number(value);
    localStretchStrength.value = Number.isFinite(numeric) ? numeric : 0;
  }
);

function onStretchStrengthInput(event) {
  const value = Number(event?.target?.value);
  localStretchStrength.value = Number.isFinite(value) ? value : 0;
}

function commitStretchStrength() {
  emit('update:stretchStrength', localStretchStrength.value);
}

const autoWhiteBalanceModel = computed({
  get: () => props.autoWhiteBalance,
  set: (value) => emit('update:autoWhiteBalance', value),
});

function setCanvasRef(el) {
  emit('set-canvas-ref', el);
}

function formatInferredFields(fields) {
  if (!Array.isArray(fields) || !fields.length) {
    return 'none';
  }

  return fields.join(', ');
}
</script>
