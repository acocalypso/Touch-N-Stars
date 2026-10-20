<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { luckyCaptureRequest } from '../services/luckycapture';
import { useLuckyCaptureStore } from '../store/luckycaptureStore';
const store = useLuckyCaptureStore();
const emit = defineEmits(['changed', 'select-roi', 'busy', 'status']);
const { t, te } = useI18n();
const errorLabel = (code) => {
  const key = `luckycaptureFocus.error_${String(code).split(':')[0]}`;
  return te(key) ? t(key) : code;
};
const text = (key) => t(`luckycaptureFocus.${key}`);
const supported = computed(() => store.capabilities?.focusApiVersion >= 2);
const status = ref(null);
const metrics = ref(null);
const pending = ref(false);
const error = ref('');
const source = ref('real');
const simulation = reactive({
  target: 'moon',
  source: 'procedural',
  actuator: 'virtual',
  seed: 42,
  fps: 20,
  seeing: 0.2,
  noise: 0.002,
  drift: 0,
  transparency: 1,
  defocusScale: 0.025,
  idealFocusPosition: 25000,
  width: 512,
  height: 512,
  bitDepth: 16,
  pixelFormat: 'Mono',
  targetScale: 0.65,
  focusCoupled: true,
  loop: true,
  playbackSpeed: 1,
  fixtureId: null,
  virtualFault: 'none',
});
const config = reactive({
  enabled: false,
  profile: 'moon',
  metric: 'auto',
  roi: null,
  sampleFps: 20,
  maxPixels: 65536,
  framesPerPoint: 50,
  points: 7,
  step: 25,
  maxDisplacement: 150,
  flushMilliseconds: 750,
  pointTimeoutSeconds: 30,
  bestFraction: 0.25,
  maximumSpread: 0.5,
  minimumPeakProminence: 0.03,
});
const fixtures = ref([]);
const replayPaused = ref(false);
async function toggleReplay() {
  await call('simulation/replay/control', { paused: !replayPaused.value });
  replayPaused.value = !replayPaused.value;
}
const roiDraft = reactive({ x: 0, y: 0, width: 128, height: 128 });
const step = ref(25);
const absolute = ref(25000);
const minimum = ref(24900);
const maximum = ref(25100);
const motionAck = ref(false);
const solarAck = ref(false);
let lease = '';
let timer;
let ticks = 0;
let closed = false;
let polling = false;
const captureActive = computed(() => store.active);
const recording = computed(() =>
  ['RECORDING', 'STARTING', 'STOPPING', 'FINALIZING'].includes(store.status.state)
);
const physical = computed(() => status.value?.device?.physical);
const moving = computed(
  () =>
    pending.value ||
    status.value?.busy ||
    status.value?.device?.moving ||
    status.value?.device?.settling
);
const canMove = computed(
  () =>
    supported.value &&
    status.value?.device?.connected &&
    !moving.value &&
    !recording.value &&
    (!physical.value || status.value?.armed)
);
const solar = computed(() => config.profile.startsWith('solar'));
const points = computed(() => status.value?.job?.points || []);
const latest = computed(() => metrics.value?.latest);
const plot = (values) => {
  if (values.length < 2) return '';
  const low = Math.min(...values.map((p) => p[1]));
  const high = Math.max(...values.map((p) => p[1]));
  const start = Math.min(...values.map((p) => p[0]));
  const end = Math.max(...values.map((p) => p[0]));
  return values
    .map(
      ([x, y]) =>
        `${8 + ((x - start) / Math.max(1, end - start)) * 304},${92 - ((y - low) / Math.max(1e-9, high - low)) * 84}`
    )
    .join(' ');
};
const curve = computed(() => plot(points.value.map((p) => [p.position, p.score])));
const trend = computed(() =>
  plot((metrics.value?.history || []).slice(-60).map((p, i) => [i, p.score]))
);
async function call(path, data, method = 'POST') {
  return await luckyCaptureRequest(path, data, method);
}
async function perform(action) {
  if (pending.value) return;
  pending.value = true;
  error.value = '';
  try {
    await action();
    await refresh();
  } catch (failure) {
    error.value = failure?.response?.data?.code
      ? errorLabel(failure.response.data.code)
      : failure.message;
  } finally {
    pending.value = false;
  }
}
async function refresh() {
  if (!supported.value || closed || polling) return;
  polling = true;
  try {
    if (lease && ticks++ % 8 === 0) await call('focus/heartbeat', { leaseToken: lease });
    const [focus, measured] = await Promise.all([
      call('focus/status', undefined, 'GET'),
      call('focus/metrics', undefined, 'GET'),
    ]);
    if (closed) return;
    status.value = focus;
    if (!pending.value) source.value = focus.sourceKind;
    metrics.value = measured;
    emit('busy', Boolean(focus.busy));
    emit('status', focus);
    if (!focus.armed) lease = '';
  } catch (failure) {
    error.value = failure?.response?.data?.code
      ? errorLabel(failure.response.data.code)
      : failure.message;
  } finally {
    polling = false;
  }
}
async function load() {
  if (!supported.value) return;
  const [focusSettings, simSettings, media] = await Promise.all([
    call('focus/settings', undefined, 'GET'),
    call('simulation/settings', undefined, 'GET'),
    call('simulation/sources', undefined, 'GET'),
  ]);
  Object.assign(config, focusSettings);
  Object.assign(simulation, simSettings);
  fixtures.value = media.fixtures;
  await refresh();
  source.value = status.value?.sourceKind || 'real';
  if (status.value?.device?.connected) {
    absolute.value = status.value.device.position;
    minimum.value = Math.max(0, absolute.value - 100);
    maximum.value = absolute.value + 100;
  }
}
async function selectSource() {
  await call('simulation/select', { sourceKind: source.value });
  lease = '';
  motionAck.value = false;
  solarAck.value = false;
  await load();
  emit('changed');
}
async function applySimulation() {
  await call('simulation/settings', { ...simulation }, 'PUT');
  lease = '';
  motionAck.value = false;
  await load();
  emit('changed');
}
async function applyFocus() {
  await call('focus/settings', { ...config }, 'PUT');
}
async function setRoi(roi) {
  await perform(async () => {
    config.roi = roi;
    Object.assign(roiDraft, roi);
    await applyFocus();
  });
}
defineExpose({ setRoi });
watch(
  supported,
  (ready) => {
    if (ready) perform(load);
  },
  { immediate: true }
);
onMounted(() => {
  timer = setInterval(refresh, 500);
});
onUnmounted(() => {
  closed = true;
  clearInterval(timer);
  emit('busy', false);
  if (supported.value) call('focus/stop', {}).catch(() => {});
  lease = '';
});
</script>

<template>
  <details class="focus-panel" open>
    <summary>{{ text('title') }}</summary>
    <p v-if="!supported" role="status">{{ text('unsupported') }}</p>
    <div v-else class="focus-body">
      <p v-if="error" role="alert" class="focus-error">{{ error }}</p>
      <p v-if="source === 'simulated'" class="simulation-note" role="status">
        {{ text('simulation') }} · {{ text('syntheticNotice') }}
      </p>
      <button
        v-if="source === 'simulated' && simulation.source !== 'procedural' && captureActive"
        :disabled="moving || recording"
        @click="perform(toggleReplay)"
      >
        {{ text(replayPaused ? 'resumeReplay' : 'pauseReplay') }}
      </button>
      <p v-if="physical" class="physical-note" role="status">{{ text('physicalWarning') }}</p>
      <div class="focus-grid">
        <label
          >{{ text('source')
          }}<select
            v-model="source"
            :disabled="captureActive || moving"
            @change="perform(selectSource)"
          >
            <option value="real">{{ text('realCamera') }}</option>
            <option value="simulated">{{ text('simulation') }}</option>
          </select></label
        >
        <label
          >{{ text('profile')
          }}<select v-model="config.profile" :disabled="moving" @change="perform(applyFocus)">
            <option value="moon">{{ text('moon') }}</option>
            <option value="planet">{{ text('planet') }}</option>
            <option value="saturn">{{ text('saturn') }}</option>
            <option value="solar-white">{{ text('sunWhite') }}</option>
            <option value="solar-ha">{{ text('sunHa') }}</option>
          </select></label
        >
      </div>
      <p class="help">{{ text('advice') }}</p>
      <div v-if="solar" class="solar-warning" role="note">
        <strong>{{ text('solarTitle') }}</strong>
        <p>{{ text('solarWarning') }}</p>
        <label v-if="source === 'real'"
          ><input v-model="solarAck" type="checkbox" />{{ text('solarAck') }}</label
        >
      </div>
      <details v-if="source === 'simulated'" :open="!captureActive">
        <summary>{{ text('simulationSettings') }}</summary>
        <fieldset :disabled="captureActive || moving">
          <legend>{{ text('simulationSettings') }}</legend>
          <div class="focus-grid">
            <label
              >{{ text('target')
              }}<select v-model="simulation.target">
                <option value="moon">{{ text('moon') }}</option>
                <option value="sun-white">{{ text('sunWhite') }}</option>
                <option value="sun-ha">{{ text('sunHa') }}</option>
                <option value="jupiter">Jupiter</option>
                <option value="saturn">{{ text('saturn') }}</option>
              </select></label
            >
            <label
              >{{ text('actuator')
              }}<select v-model="simulation.actuator">
                <option value="virtual">{{ text('virtualFocuser') }}</option>
                <option value="physical" :disabled="!status?.physicalFocuserConnected">
                  {{ text('pinsFocuser') }}
                </option>
              </select></label
            >
            <label
              >{{ text('media')
              }}<select v-model="simulation.source">
                <option value="procedural">{{ text('procedural') }}</option>
                <option value="ser">SER</option>
                <option value="image">PNG / TIFF</option>
              </select></label
            >
            <label v-if="simulation.source !== 'procedural'"
              >{{ text('fixture')
              }}<select v-model="simulation.fixtureId">
                <option :value="null">{{ text('chooseFixture') }}</option>
                <option v-for="file in fixtures" :key="file.id" :value="file.id">
                  {{ file.name }}
                </option>
              </select></label
            >
            <label
              >{{ text('ideal')
              }}<input v-model.number="simulation.idealFocusPosition" type="number" min="0"
            /></label>
            <label
              >{{ text('fps')
              }}<input v-model.number="simulation.fps" type="number" min="1" max="60"
            /></label>
            <label
              >{{ text('seed') }}<input v-model.number="simulation.seed" type="number"
            /></label>
            <label
              >{{ text('seeing')
              }}<input v-model.number="simulation.seeing" type="number" min="0" max="5" step="0.1"
            /></label>
            <label
              >{{ text('defocus')
              }}<input
                v-model.number="simulation.defocusScale"
                type="number"
                min="0"
                max="0.2"
                step="0.005"
            /></label>
          </div>
          <details>
            <summary>{{ text('advancedSimulation') }}</summary>
            <label v-if="simulation.actuator === 'virtual'"
              >{{ text('virtualFault') }}
              <select v-model="simulation.virtualFault">
                <option value="none">{{ text('faultNone') }}</option>
                <option value="disconnect">{{ text('faultDisconnect') }}</option>
                <option value="stall">{{ text('faultStall') }}</option>
                <option value="readback">{{ text('faultReadback') }}</option>
              </select>
            </label>

            <div class="focus-grid">
              <label
                >{{ text('width')
                }}<input v-model.number="simulation.width" type="number" min="64" max="1024"
              /></label>
              <label
                >{{ text('height')
                }}<input v-model.number="simulation.height" type="number" min="64" max="1024"
              /></label>
              <label
                >{{ text('depth')
                }}<select v-model.number="simulation.bitDepth">
                  <option :value="8">8</option>
                  <option :value="16">16</option>
                </select></label
              >
              <label
                >{{ text('format')
                }}<select v-model="simulation.pixelFormat">
                  <option
                    v-for="format in ['Mono', 'RGGB', 'GRBG', 'GBRG', 'BGGR', 'RGB', 'BGR']"
                    :key="format"
                  >
                    {{ format }}
                  </option>
                </select></label
              >
              <label
                >{{ text('noise')
                }}<input
                  v-model.number="simulation.noise"
                  type="number"
                  min="0"
                  max="0.1"
                  step="0.001"
              /></label>
              <label
                >{{ text('transparency')
                }}<input
                  v-model.number="simulation.transparency"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
              /></label>
              <label
                >{{ text('drift')
                }}<input
                  v-model.number="simulation.drift"
                  type="number"
                  min="-10"
                  max="10"
                  step="0.1"
              /></label>
              <label
                >{{ text('scale')
                }}<input
                  v-model.number="simulation.targetScale"
                  type="number"
                  min="0.2"
                  max="0.9"
                  step="0.05"
              /></label>
              <label><input v-model="simulation.loop" type="checkbox" />{{ text('loop') }}</label>
              <label
                ><input v-model="simulation.focusCoupled" type="checkbox" />{{
                  text('coupled')
                }}</label
              >
              <label
                >{{ text('speed')
                }}<input
                  v-model.number="simulation.playbackSpeed"
                  type="number"
                  min="0.1"
                  max="4"
                  step="0.1"
              /></label>
            </div>
          </details>
          <p class="help">{{ text('mediaAdvice') }}</p>
          <button @click="perform(applySimulation)">{{ text('applySimulation') }}</button>
        </fieldset>
      </details>
      <fieldset :disabled="moving || recording">
        <legend>{{ text('manualFocus') }}</legend>
        <p>
          {{ status?.device?.name || text('disconnected') }} · {{ text('position') }}:
          <strong>{{ status?.device?.position ?? '\u2014' }}</strong> ·
          {{
            status?.device?.moving
              ? text('moving')
              : status?.device?.settling
                ? text('settling')
                : text('idle')
          }}
        </p>
        <template v-if="physical">
          <div class="focus-grid">
            <label
              >{{ text('minimum') }}<input v-model.number="minimum" type="number" min="0" /></label
            ><label
              >{{ text('maximum') }}<input v-model.number="maximum" type="number" min="0"
            /></label>
          </div>
          <label><input v-model="motionAck" type="checkbox" />{{ text('motionAck') }}</label>
          <button
            :disabled="
              !motionAck || (solar && source === 'real' && !solarAck) || !status?.device?.connected
            "
            @click="
              perform(async () => {
                const armed = await call('focus/arm', {
                  minimum,
                  maximum,
                  acknowledgeRealMotion: motionAck,
                  solarAcknowledged: solarAck,
                });
                lease = armed.leaseToken;
              })
            "
          >
            {{ status?.armed ? text('rearm') : text('arm') }}
          </button>
        </template>
        <div class="focus-grid">
          <label
            >{{ text('step')
            }}<input v-model.number="step" type="number" min="1" max="1000" /></label
          ><label
            >{{ text('absolute') }}<input v-model.number="absolute" type="number" min="0"
          /></label>
        </div>
        <div class="focus-actions">
          <button
            :disabled="!canMove"
            @click="perform(() => call('focus/move-relative', { steps: -step, leaseToken: lease }))"
          >
            {{ text('inward') }}</button
          ><button
            :disabled="!canMove"
            @click="perform(() => call('focus/move-relative', { steps: step, leaseToken: lease }))"
          >
            {{ text('outward') }}</button
          ><button
            :disabled="!canMove"
            @click="
              perform(() => call('focus/move-absolute', { position: absolute, leaseToken: lease }))
            "
          >
            {{ text('move') }}
          </button>
        </div>
      </fieldset>
      <button
        class="focus-stop"
        @click="
          perform(async () => {
            await call('focus/stop', {});
            lease = '';
            motionAck = false;
          })
        "
      >
        {{ text('stop') }}
      </button>
      <fieldset :disabled="moving">
        <legend>{{ text('analysis') }}</legend>
        <label
          ><input v-model="config.enabled" type="checkbox" @change="perform(applyFocus)" />{{
            text('enable')
          }}</label
        >
        <p class="metric" role="status">
          {{ text('score') }}:
          <strong>{{ latest?.valid ? latest.score.toFixed(3) : '\u2014' }}</strong>
          <span>{{ latest?.method }}</span>
        </p>
        <p v-if="latest && !latest.valid" role="status">
          {{ text('quality') }}: {{ latest.flags.map((flag) => text(`flag_${flag}`)).join(', ') }}
        </p>
        <p class="help">{{ text('scoreHelp') }}</p>
        <svg
          v-if="trend"
          class="focus-plot"
          viewBox="0 0 320 100"
          role="img"
          :aria-label="text('trend')"
        >
          <polyline :points="trend" />
        </svg>
        <div class="focus-actions">
          <button :disabled="!store.previewUrl || status?.busy" @click="emit('select-roi')">
            {{ text('selectRoi') }}</button
          ><button
            :disabled="!config.roi"
            @click="
              perform(async () => {
                config.roi = null;
                await applyFocus();
              })
            "
          >
            {{ text('resetRoi') }}
          </button>
        </div>
        <p v-if="config.roi" class="help">
          {{ text('roi') }}: {{ config.roi.x }}, {{ config.roi.y }} · {{ config.roi.width }} ·
          {{ config.roi.height }}
        </p>
        <details>
          <summary>{{ text('roi') }}</summary>
          <div class="focus-grid">
            <label v-for="key in ['x', 'y', 'width', 'height']" :key="key"
              >{{ text(key)
              }}<input
                v-model.number="roiDraft[key]"
                type="number"
                :min="key === 'width' || key === 'height' ? 16 : 0"
                step="2"
            /></label>
          </div>
          <button @click="setRoi({ ...roiDraft })">{{ text('applyRoi') }}</button>
        </details>
        <details>
          <summary>{{ text('scanSettings') }}</summary>
          <div class="focus-grid">
            <label
              >{{ text('metric')
              }}<select v-model="config.metric">
                <option value="auto">{{ text('automatic') }}</option>
                <option value="tenengrad">Tenengrad</option>
                <option value="hsm">HSM</option>
              </select></label
            >
            <label
              >{{ text('samples')
              }}<input v-model.number="config.framesPerPoint" type="number" min="5" max="500"
            /></label>
            <label
              >{{ text('points')
              }}<input v-model.number="config.points" type="number" min="5" max="9" step="2"
            /></label>
            <label
              >{{ text('scanStep')
              }}<input v-model.number="config.step" type="number" min="1" max="1000"
            /></label>
            <label
              >{{ text('span')
              }}<input v-model.number="config.maxDisplacement" type="number" min="2" max="5000"
            /></label>
            <label
              >{{ text('flush')
              }}<input
                v-model.number="config.flushMilliseconds"
                type="number"
                min="100"
                max="10000"
                step="50"
            /></label>
            <label
              >{{ text('sampleFps')
              }}<input v-model.number="config.sampleFps" type="number" min="1" max="30"
            /></label>
            <label
              >{{ text('timeout')
              }}<input v-model.number="config.pointTimeoutSeconds" type="number" min="2" max="120"
            /></label>
            <label
              >{{ text('bestFraction')
              }}<input
                v-model.number="config.bestFraction"
                type="number"
                min="0.1"
                max="1"
                step="0.05"
            /></label>
            <label
              >{{ text('spread')
              }}<input
                v-model.number="config.maximumSpread"
                type="number"
                min="0.01"
                max="2"
                step="0.05"
            /></label>
          </div>
          <button @click="perform(applyFocus)">{{ text('applyFocus') }}</button>
        </details>
      </fieldset>
      <div class="focus-actions">
        <button
          :disabled="
            !canMove ||
            !config.enabled ||
            store.status.state !== 'PREVIEWING' ||
            (source === 'simulated' &&
              simulation.source !== 'procedural' &&
              !simulation.focusCoupled)
          "
          @click="perform(() => call('focus/autofocus/start', { leaseToken: lease }))"
        >
          {{ text('autofocus') }}</button
        ><button
          :disabled="!status?.busy"
          @click="perform(() => call('focus/autofocus/cancel', {}))"
        >
          {{ text('cancel') }}
        </button>
      </div>
      <p role="status">
        {{ text('job') }}: {{ text(`state_${status?.job?.state || 'IDLE'}`) }}
        <span v-if="status?.job?.error">· {{ errorLabel(status.job.error) }}</span>
      </p>
      <p v-if="status?.job?.bestPosition != null">
        {{ text('best') }}: {{ status.job.bestPosition }} · {{ text('position') }}:
        {{ status.job.finalPosition }}
      </p>
      <svg
        v-if="curve"
        class="focus-plot"
        viewBox="0 0 320 100"
        role="img"
        :aria-label="text('curve')"
      >
        <polyline :points="curve" />
      </svg>
      <ul v-if="points.length" class="focus-results">
        <li v-for="point in points" :key="point.position">
          {{ point.position }}: {{ point.score.toFixed(3) }} · {{ point.framesAccepted }}/{{
            point.framesRequested
          }}
          · {{ text('spread') }} {{ point.seeingSpread.toFixed(2) }}
        </li>
      </ul>
    </div>
  </details>
</template>

<style scoped>
.focus-panel {
  border: 1px solid #526078;
  border-radius: 14px;
  padding: 12px;
  margin: 12px 0;
  color: inherit;
  background: var(--background, #0d1421);
}
summary {
  cursor: pointer;
  padding: 8px 0;
  font-weight: 600;
  min-height: 44px;
}
.focus-body {
  display: grid;
  gap: 12px;
  min-width: 0;
}
.focus-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
fieldset {
  min-width: 0;
  border: 1px solid #4a5870;
  border-radius: 10px;
  padding: 12px;
  display: grid;
  gap: 12px;
}
legend {
  font-weight: 600;
  padding: 0 5px;
}
label {
  display: grid;
  gap: 5px;
  font-size: 14px;
  min-width: 0;
}
label:has(input[type='checkbox']) {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
input:not([type='checkbox']),
select,
button {
  width: 100%;
  min-height: 48px;
  box-sizing: border-box;
  border-radius: 9px;
  border: 1px solid #64748b;
  background: #141d2c;
  color: #e8edf7;
  font-size: 16px;
  padding: 8px;
}
input[type='checkbox'] {
  min-width: 22px;
  min-height: 22px;
}
button {
  cursor: pointer;
}
button:disabled,
fieldset:disabled {
  opacity: 0.55;
}
.focus-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.focus-actions button {
  flex: 1 1 120px;
}
.help,
.focus-results {
  font-size: 13px;
  color: #bac7db;
}
.metric strong {
  font-size: 22px;
  font-variant-numeric: tabular-nums;
}
.focus-error,
.solar-warning,
.physical-note {
  padding: 10px;
  border: 1px solid #e3a342;
  border-radius: 8px;
  color: #ffdc9d;
}
.simulation-note {
  padding: 10px;
  background: #213456;
  border-radius: 8px;
  font-weight: 600;
}
.focus-stop {
  border-color: #ffbd65;
}
.focus-plot {
  width: 100%;
  height: 90px;
  border: 1px solid #42506a;
  background: #080d16;
  border-radius: 8px;
}
.focus-plot polyline {
  fill: none;
  stroke: #6ee7b7;
  stroke-width: 2;
}
.focus-results {
  display: flex;
  gap: 8px 20px;
  flex-wrap: wrap;
}
@media (max-width: 380px) {
  .focus-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
