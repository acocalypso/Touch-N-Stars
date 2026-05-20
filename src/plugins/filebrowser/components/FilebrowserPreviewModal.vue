<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-top bg-black/75 backdrop-blur-sm p-4 flex items-center justify-center"
      @click.self="$emit('close')"
    >
      <div
        class="w-full max-w-5xl max-h-[92vh] bg-[#1a1f2e] border border-[#2e3650] rounded-lg overflow-hidden shadow-xl"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-[#2e3650]">
          <p class="text-sm font-semibold text-slate-200 truncate pr-4">{{ fileName }}</p>
          <button
            class="text-slate-500 text-sm px-2 py-1 rounded hover:text-slate-200 hover:bg-[#2e3650] transition-colors"
            @click="$emit('close')"
          >
            ✕
          </button>
        </div>

        <div class="p-3 bg-[#0f1420] max-h-[calc(92vh-56px)] overflow-auto">
          <div
            v-if="loading"
            class="min-h-[300px] flex items-center justify-center text-sm text-slate-400"
          >
            {{ $t('plugins.filebrowser.loading') }}
          </div>

          <div
            v-else-if="error"
            class="min-h-[300px] flex items-center justify-center text-sm text-red-400 text-center px-4"
          >
            {{ error }}
          </div>

          <img
            v-else-if="mode === 'image'"
            :src="url"
            :alt="fileName"
            class="mx-auto max-w-full max-h-[calc(92vh-92px)] object-contain"
            @error="$emit('image-error')"
          />

          <canvas
            v-else
            :ref="setCanvasRef"
            class="mx-auto max-w-full max-h-[calc(92vh-92px)] object-contain"
            style="image-rendering: auto"
          />

          <div
            v-if="mode === 'fits' && !loading && !error && stats"
            class="mt-3 rounded-md border border-[#2e3650] bg-[#111827] p-3 text-xs text-slate-300"
          >
            <div class="text-[11px] uppercase tracking-wide text-slate-400 mb-2">FITS Debug</div>
            <div class="mb-3 rounded border border-[#2e3650] bg-[#0b1220] p-2">
              <div class="grid grid-cols-1 md:grid-cols-[150px_1fr_auto] gap-2 items-center">
                <label class="text-slate-400">Auto stretch</label>
                <label class="flex items-center gap-2 text-slate-200">
                  <input
                    v-model="autoStretchModel"
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-500"
                  />
                  <span>{{ autoStretch ? 'enabled' : 'disabled' }}</span>
                </label>
                <span class="text-slate-500">stretch</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-[150px_1fr_auto] gap-2 items-center">
                <label class="text-slate-400">Pre-stretch</label>
                <select
                  v-model="stretchModeModel"
                  :disabled="!autoStretch"
                  class="h-8 rounded border border-gray-600 bg-gray-800 px-2 text-xs text-slate-100"
                >
                  <option value="linear">Linear</option>
                  <option value="sqrt">Sqrt</option>
                  <option value="log">Log</option>
                  <option value="asinh">Asinh</option>
                </select>
                <span class="text-slate-500">mode</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-[150px_1fr_auto] gap-2 items-center mt-2">
                <label class="text-slate-400">
                  {{ stretchMode === 'linear' ? 'Clip strength' : 'Stretch strength' }}
                </label>
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
                <span class="text-slate-300 min-w-[40px] text-right">
                  {{ localStretchStrength.toFixed(2) }}
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-[150px_1fr_auto] gap-2 items-center mt-2">
                <label class="text-slate-400">Auto white balance</label>
                <label class="flex items-center gap-2 text-slate-200">
                  <input
                    v-model="autoWhiteBalanceModel"
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-500"
                  />
                  <span>{{ autoWhiteBalance ? 'enabled' : 'disabled' }}</span>
                </label>
                <span class="text-slate-500">awb</span>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <span class="text-slate-500">Pattern:</span>
                {{ stats.bayerPattern || 'none' }}
              </div>
              <div><span class="text-slate-500">BITPIX:</span> {{ stats.bitpix }}</div>
              <div>
                <span class="text-slate-500">Size:</span> {{ stats.width }} x {{ stats.height }}
              </div>
              <div>
                <span class="text-slate-500">Stretch:</span> {{ stats.low.toFixed(2) }}..{{
                  stats.high.toFixed(2)
                }}
              </div>
              <div>
                <span class="text-slate-500">Clip base:</span>
                {{ stats.clippedLow.toFixed(2) }}..{{ stats.clippedHigh.toFixed(2) }}
              </div>
              <div><span class="text-slate-500">Min:</span> {{ stats.min.toFixed(2) }}</div>
              <div><span class="text-slate-500">Max:</span> {{ stats.max.toFixed(2) }}</div>
              <div><span class="text-slate-500">Mean:</span> {{ stats.mean.toFixed(2) }}</div>
              <div><span class="text-slate-500">Std:</span> {{ stats.std.toFixed(2) }}</div>
              <div><span class="text-slate-500">Mode:</span> {{ stats.stretchMode }}</div>
              <div>
                <span class="text-slate-500">Auto stretch:</span>
                {{ stats.autoStretch ? 'on' : 'off' }}
              </div>
              <div>
                <span class="text-slate-500">
                  {{ stats.stretchMode === 'linear' ? 'Clip strength:' : 'Strength:' }}
                </span>
                {{ stats.stretchStrength.toFixed(2) }}
              </div>
              <div>
                <span class="text-slate-500">Prep:</span> {{ perf.prepareMs.toFixed(1) }} ms
              </div>
              <div><span class="text-slate-500">Parse:</span> {{ perf.parseMs.toFixed(1) }} ms</div>
              <div>
                <span class="text-slate-500">Decode:</span> {{ perf.decodeMs.toFixed(1) }} ms
              </div>
              <div>
                <span class="text-slate-500">Debayer:</span> {{ perf.demosaicMs.toFixed(1) }} ms
              </div>
              <div>
                <span class="text-slate-500">Render:</span> {{ perf.renderMs.toFixed(1) }} ms
              </div>
              <div><span class="text-slate-500">Renders:</span> {{ perf.renderCount }}</div>
              <div><span class="text-slate-500">Queued:</span> {{ perf.queueSkips }}</div>
              <div><span class="text-slate-500">Reason:</span> {{ perf.lastReason }}</div>
              <div>
                <span class="text-slate-500">Auto WB:</span>
                {{ stats.autoWhiteBalance ? 'on' : 'off' }}
              </div>
              <div>
                <span class="text-slate-500">WB gains:</span>
                R {{ stats.whiteBalanceGains.r.toFixed(2) }} G
                {{ stats.whiteBalanceGains.g.toFixed(2) }} B
                {{ stats.whiteBalanceGains.b.toFixed(2) }}
              </div>
              <div><span class="text-slate-500">Header source:</span> {{ stats.headerSource }}</div>
              <div>
                <span class="text-slate-500">Inferred:</span>
                {{ formatInferredFields(stats.inferredHeaderFields) }}
              </div>
              <div>
                <span class="text-slate-500">Decoded pixels:</span>
                {{ stats.decodablePixelCount }} / {{ stats.width * stats.height }}
              </div>
              <div>
                <span class="text-slate-500">Truncated:</span> {{ stats.truncated ? 'yes' : 'no' }}
              </div>
              <div>
                <span class="text-slate-500">Curve 10/50/90:</span>
                {{
                  `${stats.curveSamples.p10.toFixed(3)}/${stats.curveSamples.p50.toFixed(3)}/${stats.curveSamples.p90.toFixed(3)}`
                }}
              </div>
            </div>

            <details v-if="headerEntries.length" class="mt-3">
              <summary class="cursor-pointer text-slate-300 hover:text-white">
                Header (top keys)
              </summary>
              <div class="mt-2 max-h-48 overflow-auto rounded border border-[#2e3650] bg-[#0b1220]">
                <div
                  v-for="entry in headerEntries"
                  :key="entry.key"
                  class="grid grid-cols-[120px_1fr] gap-2 px-2 py-1 border-b border-[#1f2937] last:border-b-0"
                >
                  <span class="text-slate-400">{{ entry.key }}</span>
                  <span class="text-slate-200 break-all">{{ entry.value }}</span>
                </div>
              </div>
            </details>
          </div>
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
