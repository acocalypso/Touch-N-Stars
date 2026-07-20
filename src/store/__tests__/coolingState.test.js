import test from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals, freshPinia } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

// Import AFTER the globals exist: the stores' transitive imports touch
// browser APIs at module load.
const { nextTick } = await import('vue');
const { apiStore } = await import('@/store/store');
const { useCameraStore } = await import('@/store/cameraStore');

function setup(cameraInfo = {}) {
  freshPinia();
  const store = apiStore();
  const cameraStore = useCameraStore();
  store.cameraInfo = {
    Connected: true,
    CanSetTemperature: true,
    CoolerOn: false,
    AtTargetTemp: false,
    Temperature: 15,
    TemperatureSetPoint: 15,
    ...cameraInfo,
  };
  return { store, cameraStore };
}

// --- real state via TempChangeRunning (PINS / newer ninaAPI) -----------------

test('TempChangeRunning=true with the setpoint below temperature reads as cooling', () => {
  const { cameraStore } = setup({
    CoolerOn: true,
    TempChangeRunning: true,
    TargetTemp: -10,
    TemperatureSetPoint: 10,
    Temperature: 15,
  });
  assert.equal(cameraStore.isRampRunning, true);
  assert.equal(cameraStore.coolingState, 'cooling');
});

test('warming is detected although TargetTemp still holds the stale cool-down target', () => {
  // Regression: TargetTemp keeps the cool-down target (-10) during a warm-up
  // ramp, so direction must come from the moving setpoint, not TargetTemp.
  const { cameraStore } = setup({
    CoolerOn: true,
    TempChangeRunning: true,
    TargetTemp: -10,
    TemperatureSetPoint: -8,
    Temperature: -10,
  });
  assert.equal(cameraStore.coolingState, 'warming');
});

test('the setpoint trend flips the direction latch (external warm-up)', async () => {
  const { store, cameraStore } = setup({
    CoolerOn: true,
    TempChangeRunning: true,
    TargetTemp: -10,
    TemperatureSetPoint: -10,
    Temperature: -10,
  });
  store.cameraInfo = { ...store.cameraInfo, TemperatureSetPoint: -9, Temperature: -9.8 };
  await nextTick();
  assert.equal(cameraStore.coolingState, 'warming');
});

test('a user-set direction latch wins over the instant setpoint guess', () => {
  const { cameraStore } = setup({
    CoolerOn: true,
    TempChangeRunning: true,
    TemperatureSetPoint: 10,
    Temperature: 15,
  });
  cameraStore.rampDirection = 'warming';
  assert.equal(cameraStore.coolingState, 'warming');
});

test('TempChangeRunning=false wins over a temperature delta (holding)', () => {
  // Real state says "no ramp" even though temps differ - must NOT guess.
  const { cameraStore } = setup({
    CoolerOn: true,
    TempChangeRunning: false,
    TargetTemp: -10,
    Temperature: 15,
  });
  assert.equal(cameraStore.isRampRunning, false);
  assert.equal(cameraStore.coolingState, 'holding');
});

// --- heuristic fallback (official ninaAPI without the field) -----------------

test('heuristic: cooler on, far from target, setpoint below -> cooling', () => {
  const { cameraStore } = setup({
    CoolerOn: true,
    TargetTemp: -10,
    TemperatureSetPoint: 10,
    Temperature: 15,
  });
  assert.equal(cameraStore.coolingState, 'cooling');
});

test('heuristic: warm-up with stale cool-down TargetTemp -> warming', () => {
  const { cameraStore } = setup({
    CoolerOn: true,
    TargetTemp: -10,
    TemperatureSetPoint: -4,
    Temperature: -5,
  });
  assert.equal(cameraStore.coolingState, 'warming');
});

test('heuristic: AtTargetTemp stops the ramp state (holding)', () => {
  const { cameraStore } = setup({
    CoolerOn: true,
    AtTargetTemp: true,
    TargetTemp: -10,
    Temperature: -10.2,
  });
  assert.equal(cameraStore.coolingState, 'holding');
});

test('heuristic: within 1°C of target counts as holding', () => {
  const { cameraStore } = setup({
    CoolerOn: true,
    TargetTemp: -10,
    Temperature: -9.5,
  });
  assert.equal(cameraStore.coolingState, 'holding');
});

test('heuristic: TemperatureSetPoint is the fallback when TargetTemp is missing', () => {
  const { cameraStore } = setup({
    CoolerOn: true,
    TemperatureSetPoint: -10,
    Temperature: 15,
  });
  assert.equal(cameraStore.coolingState, 'cooling');
});

// --- off states --------------------------------------------------------------

test('cooler off, disconnected or no temperature control -> off', () => {
  assert.equal(setup({ CoolerOn: false }).cameraStore.coolingState, 'off');
  assert.equal(
    setup({ Connected: false, CoolerOn: true, TempChangeRunning: true }).cameraStore.coolingState,
    'off'
  );
  assert.equal(setup({ CanSetTemperature: false, CoolerOn: true }).cameraStore.coolingState, 'off');
});

// --- optimistic pending flag -------------------------------------------------

test('pending "cooling" shows immediately even before CoolerOn is reported', () => {
  const { cameraStore } = setup({ CoolerOn: false });
  cameraStore.coolingPending = 'cooling';
  assert.equal(cameraStore.coolingState, 'cooling');
});

test('pending "cancel" masks a still-running ramp as holding', () => {
  const { cameraStore } = setup({
    CoolerOn: true,
    TempChangeRunning: true,
    TargetTemp: -10,
    Temperature: 15,
  });
  cameraStore.coolingPending = 'cancel';
  assert.equal(cameraStore.coolingState, 'holding');
});

test('pending flag is cleared once the poll confirms the ramp', async () => {
  const { store, cameraStore } = setup({ CoolerOn: false, TempChangeRunning: false });
  cameraStore.coolingPending = 'cooling';
  store.cameraInfo = {
    ...store.cameraInfo,
    CoolerOn: true,
    TempChangeRunning: true,
    TargetTemp: -10,
    Temperature: 15,
  };
  await nextTick();
  assert.equal(cameraStore.coolingPending, null);
  assert.equal(cameraStore.coolingState, 'cooling');
});
