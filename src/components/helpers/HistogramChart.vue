<template>
  <div class="tns-card p-3 text-content">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-1.5 mb-2">
      <button type="button" :class="btnClass(false)" :disabled="!ready" @click="onAuto">
        {{ t('components.helpers.histogram.auto') }}
      </button>
      <button type="button" :class="btnClass(false)" :disabled="!ready" @click="onLinear">
        {{ t('components.helpers.histogram.linear') }}
      </button>
      <button type="button" :class="btnClass(false)" :disabled="!ready" @click="onReset">
        {{ t('components.helpers.histogram.reset') }}
      </button>

      <template v-if="isColor">
        <span class="w-px h-6 bg-line-strong mx-0.5" aria-hidden="true"></span>
        <button
          type="button"
          :class="btnClass(entry.linked)"
          :disabled="!ready"
          :title="t('components.helpers.histogram.linkedHint')"
          @click="toggleLinked"
        >
          {{ t('components.helpers.histogram.linked') }}
        </button>
        <template v-if="!entry.linked">
          <button
            v-for="(label, c) in CHANNEL_LABELS"
            :key="label"
            type="button"
            :class="[btnClass(activeChannel === c), CHANNEL_TEXT[c]]"
            @click="activeChannel = c"
          >
            {{ label }}
          </button>
        </template>
      </template>

      <span class="flex-1"></span>
      <button type="button" :class="btnClass(logScale)" @click="logScale = !logScale">
        {{ t('components.helpers.histogram.log') }}
      </button>
      <button type="button" :class="btnClass(fullRange)" @click="fullRange = !fullRange">
        {{ t('components.helpers.histogram.fullRange') }}
      </button>
    </div>

    <!-- Chart with draggable black / midtone / white points -->
    <div
      ref="wrapperElement"
      class="relative rounded border border-line-strong bg-surface-1 overflow-hidden touch-none select-none"
      :style="{ height }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <canvas ref="canvasElement" class="absolute inset-0 w-full h-full"></canvas>

      <template v-if="ready">
        <div
          v-for="thumb in thumbs"
          :key="thumb.key"
          class="absolute top-0 h-full pointer-events-none"
          :style="{ left: `${thumb.pct}%` }"
        >
          <div
            class="absolute top-0 h-full -translate-x-1/2 border-l-2"
            :class="[thumb.border, thumb.outside ? 'border-dashed opacity-60' : '']"
          ></div>
          <span
            class="absolute top-0.5 -translate-x-1/2 text-[10px] font-bold leading-none px-0.5 rounded bg-surface-1/80"
            :class="thumb.text"
            >{{ thumb.label }}</span
          >
        </div>
      </template>

      <div
        v-if="!ready"
        class="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-content-faint"
      >
        <svg
          v-if="status === 'loading'"
          class="w-5 h-5 mr-2 animate-spin text-accent"
          xmlns="http://www.w3.org/2000/svg"
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
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span>{{ statusText }}</span>
      </div>
    </div>

    <!-- Axis range and point values in ADU -->
    <div
      v-if="ready"
      class="mt-1 flex items-center justify-between gap-2 text-[10px] font-mono text-content-faint"
    >
      <span>{{ view.lo }}</span>
      <span class="truncate">
        <span class="text-red-400 font-bold" :title="t('components.helpers.histogram.blackPoint')"
          >S</span
        >
        {{ toAdu(editLevels.black) }}
        <span
          class="text-green-400 font-bold ml-2"
          :title="t('components.helpers.histogram.midtones')"
          >M</span
        >
        {{ toAdu(midpointPosition) }}
        <span
          class="text-content font-bold ml-2"
          :title="t('components.helpers.histogram.whitePoint')"
          >W</span
        >
        {{ toAdu(editLevels.white) }}
      </span>
      <span>{{ view.hi - 1 }}</span>
    </div>

    <!-- Exact statistics of the full-resolution raw data -->
    <div v-if="ready" class="mt-2 overflow-x-auto">
      <table class="w-full text-xs font-mono tabular-nums">
        <thead>
          <tr class="text-content-faint text-left">
            <th v-if="isColor" class="font-normal pr-2"></th>
            <th class="font-normal pr-2">{{ t('components.helpers.histogram.mean') }}</th>
            <th class="font-normal pr-2">{{ t('components.helpers.histogram.median') }}</th>
            <th class="font-normal pr-2">{{ t('components.helpers.histogram.mad') }}</th>
            <th class="font-normal pr-2">{{ t('components.helpers.histogram.min') }}</th>
            <th class="font-normal pr-2">{{ t('components.helpers.histogram.max') }}</th>
            <th class="font-normal">{{ t('components.helpers.histogram.clipped') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(s, c) in entry.stats" :key="c">
            <td v-if="isColor" class="pr-2 font-bold" :class="CHANNEL_TEXT[c]">
              {{ CHANNEL_LABELS[c] }}
            </td>
            <td class="pr-2">{{ s.mean.toFixed(1) }}</td>
            <td class="pr-2">{{ s.median }}</td>
            <td class="pr-2">{{ s.mad }}</td>
            <td class="pr-2">{{ s.min }}</td>
            <td class="pr-2">{{ s.max }}</td>
            <td class="whitespace-nowrap">{{ percent(s.clipLow) }} / {{ percent(s.clipHigh) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="mt-1 text-[10px] text-content-faint">
        {{
          t('components.helpers.histogram.sourceInfo', {
            width: entry.meta.sourceWidth,
            height: entry.meta.sourceHeight,
            bitDepth: entry.meta.bitDepth,
          })
        }}
      </div>
    </div>

    <!-- Star analysis comes from NINA and needs a saved image -->
    <div
      v-if="extraStats?.Stars || extraStats?.HFR"
      class="mt-1 flex gap-3 text-xs font-mono text-content-faint"
    >
      <span v-if="extraStats.Stars">
        {{ t('components.helpers.histogram.stars') }}
        <span class="text-content">{{ extraStats.Stars }}</span>
      </span>
      <span v-if="extraStats.HFR">
        {{ t('components.helpers.histogram.hfr') }}
        <span class="text-content">{{ Number(extraStats.HFR).toFixed(2) }}</span>
      </span>
    </div>
    <div v-else-if="!saveEnabled" class="mt-2 flex items-center justify-between gap-2">
      <span class="text-xs text-content-faint italic">
        {{ t('components.helpers.histogram.noSaveHint') }}
      </span>
      <button type="button" :class="btnClass(false)" @click="emit('toggle-save')">
        {{ t('components.helpers.histogram.enableSave') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHistogramStore } from '@/store/histogramStore';
import { maxAdu, mtf } from '@/utils/rawImage/stretch';
import { autoViewRange, binColumns, fullViewRange } from '@/utils/rawImage/histogramView';

const { t } = useI18n();
const histogramStore = useHistogramStore();

const props = defineProps({
  // Key of the image in the histogram store (the URL the view shows).
  imageUrl: {
    type: String,
    default: null,
  },
  height: {
    type: String,
    default: '120px',
  },
  // { Stars, HFR } from NINA's star analysis, optional.
  extraStats: {
    type: Object,
    default: null,
  },
  // Whether NINA saves snapshots; only star analysis depends on it.
  saveEnabled: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['toggle-save']);

const CHANNEL_LABELS = ['R', 'G', 'B'];
const CHANNEL_TEXT = ['text-red-400', 'text-green-400', 'text-blue-400'];
const CHANNEL_FILL = ['rgba(239,68,68,0.55)', 'rgba(34,197,94,0.55)', 'rgba(59,130,246,0.55)'];
const MONO_FILL = 'rgba(34,211,238,0.7)';
const HIT_RADIUS_PX = 24;

const canvasElement = ref(null);
const wrapperElement = ref(null);
const logScale = ref(true);
const fullRange = ref(false);
const activeChannel = ref(0);
const dragging = ref(null); // 'black' | 'mid' | 'white'

const entry = computed(() => histogramStore.getEntry(props.imageUrl));
const status = computed(() => entry.value?.status ?? 'loading');
const ready = computed(() => status.value === 'ready');
const isColor = computed(() => ready.value && entry.value.meta.channels === 3);
const bitDepth = computed(() => entry.value?.meta?.bitDepth ?? 16);

const statusText = computed(() => {
  const key = {
    loading: 'loading',
    unsupported: 'unsupported',
    'no-image': 'noImage',
    'file-not-found': 'fileNotFound',
    'history-mismatch': 'fileNotFound',
    'livestack-save-disabled': 'livestackSaveDisabled',
    'livestack-rgb-unsupported': 'livestackRgbUnsupported',
  }[status.value];
  return t(`components.helpers.histogram.${key ?? 'error'}`);
});

// The levels the sliders edit: the shared ones when linked, else the selected channel's.
const editIndex = computed(() => {
  const levels = entry.value?.levels ?? [];
  return levels.length > 1 ? Math.min(activeChannel.value, levels.length - 1) : 0;
});
const editLevels = computed(
  () => entry.value?.levels?.[editIndex.value] ?? { black: 0, mid: 0.5, white: 1 }
);
// Position (normalised) that the midtone balance maps to 50 % grey.
const midpointPosition = computed(() => {
  const { black, mid, white } = editLevels.value;
  return black + mid * (white - black);
});

const view = computed(() => {
  if (!ready.value) return fullViewRange(16);
  return fullRange.value
    ? fullViewRange(bitDepth.value)
    : autoViewRange(entry.value.cums, entry.value.stats, bitDepth.value);
});

const toAdu = (normalised) => Math.round(normalised * maxAdu(bitDepth.value));
const fromAdu = (adu) => adu / maxAdu(bitDepth.value);
const percent = (fraction) =>
  `${(fraction * 100).toFixed(fraction > 0 && fraction < 0.001 ? 3 : 2)}%`;

const aduToPct = (adu) => ((adu - view.value.lo) / (view.value.hi - view.value.lo)) * 100;

const thumbs = computed(() => {
  const make = (key, label, normalised, border, text) => {
    const pct = aduToPct(toAdu(normalised));
    return {
      key,
      label,
      pct: Math.min(100, Math.max(0, pct)),
      outside: pct < 0 || pct > 100,
      border,
      text,
    };
  };
  return [
    make('black', 'S', editLevels.value.black, 'border-red-500', 'text-red-400'),
    make('mid', 'M', midpointPosition.value, 'border-green-400', 'text-green-400'),
    make('white', 'W', editLevels.value.white, 'border-gray-200', 'text-content'),
  ];
});

const btnClass = (active) => [
  'tns-btn-secondary w-auto! min-w-0! min-h-9! px-2.5! text-xs!',
  active ? 'bg-accent-action! text-white! border-transparent!' : '',
];

// ----------------------------------------------------------------- drawing

const draw = () => {
  const canvas = canvasElement.value;
  const wrapper = wrapperElement.value;
  if (!canvas || !wrapper) return;
  const rect = wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!ready.value) return;

  const width = canvas.width;
  const height = canvas.height;
  const top = 14 * dpr; // room for the thumb labels
  const plotHeight = height - top;
  const { lo, hi } = view.value;
  const cums = entry.value.cums;

  // Linked colour: draw each channel moved by its background offset, so the curves sit on
  // top of each other exactly as the shared levels see them.
  const offsets = entry.value.linked ? entry.value.offsets : [];
  const columns = cums.map((cum, c) => {
    const shift = offsets[c] ?? 0;
    return binColumns(cum, lo + shift, hi + shift, width);
  });
  const scale = (v) => (logScale.value ? Math.log10(1 + v) : v);
  let peak = 0;
  columns.forEach((col) => col.forEach((v) => (peak = Math.max(peak, scale(v)))));
  if (peak <= 0) return;

  ctx.globalCompositeOperation = cums.length > 1 ? 'lighter' : 'source-over';
  columns.forEach((col, c) => {
    ctx.fillStyle = cums.length > 1 ? CHANNEL_FILL[c] : MONO_FILL;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x < width; x++) {
      ctx.lineTo(x, height - (scale(col[x]) / peak) * plotHeight);
      ctx.lineTo(x + 1, height - (scale(col[x]) / peak) * plotHeight);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';

  // Transfer curve of the edited levels: where each input value ends up on screen.
  const { black, mid, white } = editLevels.value;
  const range = Math.max(white - black, 1e-9);
  ctx.strokeStyle = 'rgba(250,204,21,0.8)';
  ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const value = fromAdu(lo + ((hi - lo) * x) / width);
    const y = mtf(mid, Math.min(1, Math.max(0, (value - black) / range)));
    const py = height - y * plotHeight;
    if (x === 0) ctx.moveTo(x, py);
    else ctx.lineTo(x, py);
  }
  ctx.stroke();
};

let frame = 0;
const scheduleDraw = () => {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    draw();
  });
};

watch([entry, () => entry.value?.levels, view, logScale, editIndex], scheduleDraw, {
  deep: true,
});

let resizeObserver = null;
onMounted(() => {
  scheduleDraw();
  if (typeof ResizeObserver !== 'undefined' && wrapperElement.value) {
    resizeObserver = new ResizeObserver(scheduleDraw);
    resizeObserver.observe(wrapperElement.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (frame) cancelAnimationFrame(frame);
});

// ----------------------------------------------------------------- dragging

const pointerToNormalised = (clientX) => {
  const rect = wrapperElement.value.getBoundingClientRect();
  const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const { lo, hi } = view.value;
  return fromAdu(lo + fraction * (hi - lo));
};

const onPointerDown = (event) => {
  if (!ready.value || (event.pointerType === 'mouse' && event.button !== 0)) return;
  const rect = wrapperElement.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  let best = null;
  let bestDistance = HIT_RADIUS_PX;
  // Midtone first: on equal distance the first match wins, so the midtone point stays
  // reachable even when black and white are dragged close to it.
  const order = ['mid', 'black', 'white'];
  [...thumbs.value]
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
    .forEach((thumb) => {
      const distance = Math.abs((thumb.pct / 100) * rect.width - x);
      if (distance < bestDistance) {
        best = thumb.key;
        bestDistance = distance;
      }
    });
  if (!best) return;
  dragging.value = best;
  wrapperElement.value.setPointerCapture?.(event.pointerId);
  event.preventDefault();
};

const onPointerMove = (event) => {
  if (!dragging.value) return;
  const value = pointerToNormalised(event.clientX);
  const current = { ...editLevels.value };
  const minGap = 1 / maxAdu(bitDepth.value);

  if (dragging.value === 'black') {
    current.black = Math.min(value, current.white - minGap);
  } else if (dragging.value === 'white') {
    current.white = Math.max(value, current.black + minGap);
  } else {
    const fraction = (value - current.black) / (current.white - current.black);
    current.mid = Math.min(0.999, Math.max(0.001, fraction));
  }

  const levels = entry.value.levels.map((l, i) => (i === editIndex.value ? current : { ...l }));
  histogramStore.setLevels(props.imageUrl, levels);
};

const onPointerUp = (event) => {
  if (!dragging.value) return;
  dragging.value = null;
  wrapperElement.value?.releasePointerCapture?.(event.pointerId);
};

// ----------------------------------------------------------------- actions

const onAuto = () => histogramStore.autoStretch(props.imageUrl);
const onLinear = () => histogramStore.linearStretch(props.imageUrl);
const onReset = () => histogramStore.resetStretch(props.imageUrl);
const toggleLinked = () => {
  activeChannel.value = 0;
  histogramStore.setLinked(props.imageUrl, !entry.value.linked);
};
</script>
