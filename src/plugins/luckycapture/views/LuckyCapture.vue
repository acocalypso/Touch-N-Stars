<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLuckyCaptureStore } from '../store/luckycaptureStore';
const store = useLuckyCaptureStore();
const { t } = useI18n();
const text = (key) => t(`luckycapture.${key}`);
const form = reactive({
  exposureSeconds: 0.02,
  gain: null,
  offset: null,
  usbLimit: null,
  binning: '1x1',
  bitDepth: null,
  acquisitionMode: 'auto',
  allowExperimentalStreaming: false,
  allowDriverReconnect: false,
  allowStreamDepthReduction: false,
});
const roi = reactive({ x: 0, y: 0, width: 512, height: 512 });
const useRoi = ref(false);
const recording = reactive({
  format: 'ser',
  frameLimit: null,
  durationSeconds: null,
  playbackFps: 25,
  target: '',
  filter: '',
  relativeDirectory: '',
  filenameTemplate: '{date}_{time}_{target}_{camera}_{sequence}',
});
const lock = computed(() => store.active || store.pending);
const supportedControls = computed(() =>
  store.controls.filter((c) =>
    ['exposure', 'gain', 'offset', 'usbLimit', 'bitDepth', 'binning'].includes(c.id)
  )
);
const controlKey = (id) => (id === 'exposure' ? 'exposureSeconds' : id);
const graph = computed(() => {
  const bins = store.histogram?.bins || [];
  const max = Math.max(1, ...bins);
  return bins.map((n, i) => `${i},${80 - (n / max) * 78}`).join(' ');
});
const number = (value, digits = 1) => (Number.isFinite(value) ? value.toFixed(digits) : '—');
async function invoke(action) {
  try {
    await action();
  } catch {
    /* store displays structured error */
  }
}
async function load() {
  await store.open();
  Object.assign(form, store.settings, {
    binning: `${store.settings.binX || 1}x${store.settings.binY || 1}`,
  });
  for (const c of store.controls)
    if (form[controlKey(c.id)] == null && c.currentValue != null)
      form[controlKey(c.id)] = c.currentValue;
  useRoi.value = !!store.settings.roi;
  if (store.settings.roi) Object.assign(roi, store.settings.roi);
}
async function apply() {
  const usb = store.controls.find((c) => c.id === 'usbLimit');
  if (usb && form.usbLimit != null && Number(form.usbLimit) !== usb.currentValue) {
    await store.command('controls/usbLimit', { value: Number(form.usbLimit) }, 'PUT');
    await store.refreshCamera();
  }
  const [binX, binY] = form.binning.split('x').map(Number);
  store.settings = await store.command(
    'settings',
    {
      exposureSeconds: Number(form.exposureSeconds),
      gain: form.gain == null ? null : Number(form.gain),
      offset: form.offset == null ? null : Number(form.offset),
      binX,
      binY,
      bitDepth: store.controls.some((c) => c.id === 'bitDepth' && !c.readOnly)
        ? Number(form.bitDepth)
        : null,
      acquisitionMode: form.acquisitionMode,
      allowExperimentalStreaming: form.allowExperimentalStreaming,
      allowDriverReconnect: form.allowDriverReconnect,
      allowStreamDepthReduction: form.allowStreamDepthReduction,
      roi: useRoi.value ? { ...roi } : null,
    },
    'PUT'
  );
}
async function start(record) {
  if (store.status.state === 'PREVIEWING') await store.command('preview/stop', {});
  await apply();
  if (record)
    await store.command('recording/start', {
      ...recording,
      frameLimit: recording.frameLimit ? Number(recording.frameLimit) : null,
      durationSeconds: recording.durationSeconds ? Number(recording.durationSeconds) : null,
    });
  else await store.command('preview/start', { previewFps: 8 });
}
const drag = ref(null);
const selection = ref(null);
function point(event) {
  const box = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)),
    y: Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)),
  };
}
function selectStart(event) {
  if (lock.value || !store.camera?.roiSupported) return;
  event.currentTarget.setPointerCapture(event.pointerId);
  drag.value = point(event);
  selection.value = null;
}
function selectMove(event) {
  if (!drag.value) return;
  const end = point(event);
  selection.value = {
    x: Math.min(drag.value.x, end.x),
    y: Math.min(drag.value.y, end.y),
    width: Math.abs(end.x - drag.value.x),
    height: Math.abs(end.y - drag.value.y),
  };
}
function selectEnd(event) {
  selectMove(event);
  drag.value = null;
  if (!selection.value || selection.value.width < 0.01 || selection.value.height < 0.01) return;
  const source = store.settings.roi || {
    x: 0,
    y: 0,
    width: store.camera.width,
    height: store.camera.height,
  };
  const s = selection.value;
  roi.x = Math.floor((source.x + source.width * s.x) / 2) * 2;
  roi.y = Math.floor((source.y + source.height * s.y) / 2) * 2;
  roi.width = Math.max(2, Math.floor((source.width * s.width) / 2) * 2);
  roi.height = Math.max(2, Math.floor((source.height * s.height) / 2) * 2);
  useRoi.value = true;
}
onMounted(load);
onUnmounted(() => store.close());
</script>

<template>
  <main class="lc">
    <header>
      <div>
        <h1>LuckyCapture</h1>
        <p>{{ store.camera?.name || text('noCamera') }} · {{ store.status.state || '—' }}</p>
      </div>
      <button :disabled="store.pending" @click="invoke(load)">{{ text('refresh') }}</button>
    </header>
    <p v-if="store.error" class="error" role="alert">{{ store.error }}</p>
    <p v-if="!store.available" class="notice">{{ text('unavailable') }}</p>
    <p v-else-if="!store.camera?.connected" class="notice">{{ text('connectEquipment') }}</p>
    <p v-if="store.available && !store.streamConnected" class="notice">
      {{ text('reconnecting') }}
    </p>
    <div class="layout">
      <section class="visual">
        <div
          class="preview"
          @pointerdown="selectStart"
          @pointermove="selectMove"
          @pointerup="selectEnd"
          @pointercancel="drag = null"
        >
          <img
            v-if="store.previewUrl"
            :src="store.previewUrl"
            :alt="text('preview')"
            draggable="false"
          />
          <p v-else>{{ text('startPreview') }}</p>
          <div
            v-if="selection"
            class="selection"
            :style="{
              left: selection.x * 100 + '%',
              top: selection.y * 100 + '%',
              width: selection.width * 100 + '%',
              height: selection.height * 100 + '%',
            }"
          />
        </div>
        <p class="hint">{{ text('roiHint') }}</p>
        <svg class="histogram" viewBox="0 0 255 82" role="img" :aria-label="text('histogram')">
          <polyline :points="graph" fill="none" stroke="currentColor" stroke-width="1" />
        </svg>
        <dl v-if="store.histogram" class="stats">
          <div
            v-for="key in ['min', 'max', 'mean', 'median', 'p95', 'saturationPercentage']"
            :key="key"
          >
            <dt>{{ text(key) }}</dt>
            <dd>{{ number(store.histogram[key]) }}</dd>
          </div>
        </dl>
        <dl class="stats">
          <div
            v-for="key in [
              'acquiredFrames',
              'writtenFrames',
              'pluginDroppedFrames',
              'previewSkippedFrames',
              'currentAcquisitionFps',
              'averageAcquisitionFps',
              'writtenFps',
              'elapsedSeconds',
              'queueDepth',
            ]"
            :key="key"
          >
            <dt>{{ text(key) }}</dt>
            <dd>{{ number(store.status[key]) }}</dd>
          </div>
          <div>
            <dt>{{ text('disk') }}</dt>
            <dd>{{ number(store.status.freeDiskBytes / 1073741824) }} GiB</dd>
          </div>
        </dl>
        <progress
          v-if="store.status.targetFrames || store.status.targetDurationSeconds"
          :value="store.status.frameProgress ?? store.status.timeProgress ?? 0"
          max="1"
        />
        <p v-if="store.status.outputFilename" class="filename">{{ store.status.outputPath }}</p>
        <p v-if="store.status.stopReason">
          {{ text('stopReason') }}: {{ store.status.stopReason }}
        </p>
        <p v-if="store.status.lastError || store.status.sidecarError" class="error">
          {{ store.status.lastError || store.status.sidecarError }}
        </p>
      </section>
      <section class="controls">
        <fieldset :disabled="lock || !store.camera?.connected">
          <legend>{{ text('cameraControls') }}</legend>
          <label
            >{{ text('acquisitionMode') }}
            <select v-model="form.acquisitionMode">
              <option value="auto">{{ text('automaticStream') }}</option>
              <option value="exposures">{{ text('repeatedExposures') }}</option>
              <option v-if="store.capabilities?.stream?.previewOnly" value="preview">
                {{ text('cameraPreview') }}
              </option>
            </select>
          </label>
          <template
            v-if="
              store.capabilities?.stream?.available && !store.capabilities.stream.hardwareValidated
            "
          >
            <label
              ><input v-model="form.allowExperimentalStreaming" type="checkbox" />{{
                text('experimentalStream')
              }}</label
            >
            <label v-if="store.capabilities.stream.requiresDriverReconnect"
              ><input v-model="form.allowDriverReconnect" type="checkbox" />{{
                text('driverReconnect')
              }}</label
            >
            <label v-if="store.capabilities.stream.backend === 'INDI'"
              ><input v-model="form.allowStreamDepthReduction" type="checkbox" />{{
                text('streamDepthReduction')
              }}</label
            >
          </template>
          <label v-for="c in supportedControls" :key="c.id"
            >{{ text(c.id) }} <span v-if="c.unit">({{ c.unit }})</span>
            <output v-if="c.readOnly">{{ c.currentValue }}</output>
            <select
              v-else-if="c.type === 'enum' || c.options?.length"
              v-model="form[controlKey(c.id)]"
            >
              <option v-for="option in c.options" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
            <input
              v-else
              v-model.number="form[controlKey(c.id)]"
              type="number"
              :min="c.min"
              :max="c.max"
              :step="c.step || 'any'"
            />
          </label>
          <template v-if="store.camera?.roiSupported"
            ><label class="check"
              ><input v-model="useRoi" type="checkbox" /> {{ text('roi') }}</label
            >
            <div v-if="useRoi" class="roi-fields">
              <label v-for="key in ['x', 'y', 'width', 'height']" :key="key"
                >{{ key
                }}<input
                  v-model.number="roi[key]"
                  type="number"
                  :min="key === 'width' || key === 'height' ? 2 : 0"
                  step="2"
              /></label>
            </div>
          </template>
          <button @click="invoke(apply)">{{ text('apply') }}</button>
        </fieldset>
        <fieldset :disabled="lock">
          <legend>{{ text('recording') }}</legend>
          <label
            >{{ text('format')
            }}<select v-model="recording.format">
              <option value="ser">SER · raw</option>
              <option value="avi" :disabled="!store.capabilities.avi">AVI · FFV1</option>
            </select></label
          >
          <label
            v-for="key in ['target', 'filter', 'relativeDirectory', 'filenameTemplate']"
            :key="key"
            >{{ text(key) }}<input v-model="recording[key]" type="text"
          /></label>
          <label v-for="key in ['frameLimit', 'durationSeconds', 'playbackFps']" :key="key"
            >{{ text(key)
            }}<input
              v-model.number="recording[key]"
              type="number"
              min="1"
              :step="key === 'durationSeconds' ? 'any' : 1"
          /></label>
        </fieldset>
        <div class="actions">
          <button
            v-if="!store.active"
            :disabled="store.pending || !store.camera?.connected || !store.available"
            @click="invoke(() => start(false))"
          >
            {{ text('preview') }}
          </button>
          <button
            v-if="!store.active || store.status.state === 'PREVIEWING'"
            class="record"
            :disabled="store.pending || !store.camera?.connected || !store.available"
            @click="invoke(() => start(true))"
          >
            {{ text('record') }}
          </button>
          <button
            v-if="store.active"
            class="record"
            :disabled="store.pending"
            @click="invoke(() => store.command('recording/stop', {}))"
          >
            {{ text('stop') }}
          </button>
        </div>
        <button
          :disabled="store.pending || !store.previewUrl"
          @click="invoke(() => store.command('snapshot', recording))"
        >
          {{ text('snapshot') }}
        </button>
        <p v-if="store.snapshotPath" class="filename">{{ store.snapshotPath }}</p>
        <p class="hint">{{ text('rawNote') }}</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.lc {
  max-width: 1200px;
  margin: auto;
  padding: 1rem;
  color: var(--color-text, inherit);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
h1 {
  font-size: 1.6rem;
  font-weight: 600;
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(260px, 1fr);
  gap: 1.25rem;
}
.preview {
  position: relative;
  background: #080b10;
  min-height: 180px;
  display: grid;
  place-items: center;
  touch-action: none;
  user-select: none;
}
.preview img {
  width: 100%;
  display: block;
}
.selection {
  position: absolute;
  border: 2px solid #ffb850;
  background: #ffb85022;
  pointer-events: none;
}
.histogram {
  width: 100%;
  height: 100px;
  background: #080b10;
  color: #67d3ad;
  margin-top: 1rem;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin: 1rem 0;
  font-variant-numeric: tabular-nums;
}
dt,
.hint {
  font-size: 0.8rem;
  opacity: 0.75;
}
dd {
  font-size: 1.1rem;
}
fieldset {
  border: 1px solid #7775;
  border-radius: 0.5rem;
  padding: 0.8rem;
  margin-bottom: 1rem;
}
legend {
  padding: 0 0.4rem;
  font-weight: 600;
}
label {
  display: block;
  margin-bottom: 0.65rem;
  font-size: 0.85rem;
}
input:not([type='checkbox']),
select,
output {
  display: block;
  width: 100%;
  min-height: 40px;
  padding: 0.45rem;
  background: #7771;
  border: 1px solid #7776;
  border-radius: 0.3rem;
  color: inherit;
}
select option {
  background: #161b22;
  color: #eee;
}
.check {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.roi-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}
button {
  border: 1px solid #7776;
  border-radius: 0.4rem;
  padding: 0.6rem 1rem;
  min-height: 44px;
}
button:disabled {
  opacity: 0.45;
}
.actions {
  display: flex;
  gap: 0.7rem;
}
.record {
  background: #b34132;
  color: white;
}
.error {
  color: #ff978a;
  padding: 0.6rem;
  border: 1px solid #ff978a55;
  margin-bottom: 1rem;
}
.notice {
  padding: 0.7rem;
  background: #7772;
  margin-bottom: 1rem;
}
progress {
  width: 100%;
}
.filename {
  overflow-wrap: anywhere;
  font-size: 0.8rem;
}
@media (max-width: 760px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
