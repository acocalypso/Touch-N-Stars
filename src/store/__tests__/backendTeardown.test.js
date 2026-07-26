import test from 'node:test';
import assert from 'node:assert/strict';
import {
  installBrowserGlobals,
  freshPinia,
  lastSocket,
  resetSockets,
} from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

// Import AFTER the globals exist: the websocket services instantiate their
// sockets' plumbing at module load.
const { apiStore } = await import('@/store/store');
const { useSettingsStore } = await import('@/store/settingsStore');
const { useCameraStore } = await import('@/store/cameraStore');
const { useImagetStore } = await import('@/store/imageStore');
const { useSequenceV2Store } = await import('@/store/sequenceV2Store');
const { useTppaStore } = await import('@/store/tppaStore');
const { default: tppaService } = await import('@/services/websocketTppa');
const { default: mountService } = await import('@/services/websocketMountControl');

function setup(t) {
  resetSockets();
  freshPinia();
  // The services are app-scoped singletons whose reconnect flag starts armed;
  // latch both off so each test states explicitly which sockets are live.
  tppaService.disconnect();
  mountService.disconnect();
  const store = apiStore();
  const settingsStore = useSettingsStore();
  const cameraStore = useCameraStore();
  const imageStore = useImagetStore();
  const sequenceV2Store = useSequenceV2Store();
  settingsStore.connection.ip = '10.0.0.5';
  settingsStore.connection.port = 5000;
  store.apiPort = 1888;
  store.isApiConnected = true;
  store.isTnsPluginConnected = true;
  t.after(() => {
    tppaService.disconnect();
    mountService.disconnect();
  });
  return { store, settingsStore, cameraStore, imageStore, sequenceV2Store };
}

function withTimeout(promise, ms, label) {
  let timerId;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error(label)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId));
}

// --- instance switch ---------------------------------------------------------

test('switchBackend() drops all instance-scoped state and re-arms armed sockets', async (t) => {
  const { store, settingsStore, cameraStore, imageStore, sequenceV2Store } = setup(t);

  // TPPA page is open (socket armed), the mount slew page is not.
  const tppaConnect = tppaService.connect();
  lastSocket().emitOpen();
  await tppaConnect;
  assert.equal(tppaService.shouldReconnect, true);
  assert.equal(mountService.shouldReconnect, false);

  // State accumulated while connected to instance A.
  store.profileInfo.SnapShotControlSettings.Save = true;
  store.imageSavePath = 'C:/instance-a/images';
  imageStore.imageData = 'blob:instance-a-image';
  imageStore.lastImage.index = 42;
  sequenceV2Store.data = [{ Id: 'container-1' }];
  sequenceV2Store.loaded = true;
  sequenceV2Store.availableItems = [{ FullTypeName: 'OnlyOnInstanceA' }];
  cameraStore.isLooping = true;
  cameraStore.binningMode = '2x2';
  cameraStore.readoutMode = 1;
  const epochBefore = store.connectionEpoch;

  // The user selects instance B.
  settingsStore.connection.ip = '10.0.0.9';
  await store.switchBackend();

  assert.equal(store.connectionEpoch, epochBefore + 1, 'in-flight cycles are invalidated');
  assert.equal(store.isBackendReachable, false);
  assert.equal(store.apiPort, null);

  // Instance-only resets (audit #1b/#4).
  assert.equal(store.profileInfo.SnapShotControlSettings.Save, false, 'profile reset');
  assert.equal(store.imageSavePath, null);
  assert.equal(imageStore.imageData, null, 'image cache cleared');
  assert.equal(imageStore.lastImage.index, 0);

  // Session resets (audit #1/#2).
  assert.equal(cameraStore.isLooping, false, 'capture loop stopped');
  assert.equal(cameraStore.binningMode, '1x1');
  assert.equal(cameraStore.readoutMode, 0);
  assert.deepEqual(sequenceV2Store.data, []);
  assert.equal(sequenceV2Store.loaded, false);
  assert.deepEqual(sequenceV2Store.availableItems, [], 'per-instance item cache dropped');

  // Sockets: armed ones re-arm for the new instance, others stay off.
  assert.equal(tppaService.shouldReconnect, true, 'TPPA socket re-armed');
  assert.equal(mountService.shouldReconnect, false, 'mount socket stays off');
});

// --- transient connection loss (WLAN blip) -----------------------------------

test('clearAllStates() on a connection loss keeps same-instance data but stops the capture loop', (t) => {
  const { store, cameraStore, imageStore, sequenceV2Store } = setup(t);

  store.profileInfo.SnapShotControlSettings.Save = true;
  store.imageSavePath = 'C:/instance-a/images';
  imageStore.imageData = 'blob:still-valid-image';
  sequenceV2Store.availableItems = [{ FullTypeName: 'X' }];
  cameraStore.isLooping = true;
  cameraStore.countdownRunning = true;

  // fetchAllInfos() error path: backend unreachable.
  store.clearAllStates();

  // Same instance - profile and last image stay valid through the blip.
  assert.equal(store.profileInfo.SnapShotControlSettings.Save, true, 'profile kept');
  assert.equal(store.imageSavePath, 'C:/instance-a/images');
  assert.equal(imageStore.imageData, 'blob:still-valid-image', 'image kept');

  // But nothing client-driven may keep commanding an unreachable backend.
  assert.equal(cameraStore.isLooping, false, 'capture loop stopped');
  assert.equal(cameraStore.countdownRunning, false);
  assert.deepEqual(sequenceV2Store.availableItems, []);
  assert.equal(store.isBackendReachable, false);
});

// --- capture loop lifecycle (audit #1) ----------------------------------------

test('a looping capture aborted by the teardown does not trigger a follow-up exposure', async (t) => {
  const { store, cameraStore, imageStore } = setup(t);
  imageStore.isImageFetching = false;

  let startCalls = 0;
  let rejectStart;
  const fakeApi = {
    startCapture: () => {
      startCalls += 1;
      return new Promise((resolve, reject) => {
        rejectStart = reject;
      });
    },
  };

  const capture = cameraStore.capturePhoto(fakeApi, 2, 100);
  cameraStore.isLooping = true;

  // Teardown (instance switch or connection loss), then the in-flight request
  // dies - exactly the abortInFlightRequests() ordering in switchBackend().
  store.clearAllStates();
  rejectStart(new Error('request aborted'));

  await withTimeout(capture, 2000, 'capturePhoto never returned');
  assert.equal(startCalls, 1, 'no follow-up exposure was started');
  assert.equal(cameraStore.isLooping, false);
});

test('a capture stuck waiting for its image is released by the teardown', async (t) => {
  const { store, cameraStore, imageStore } = setup(t);
  imageStore.isImageFetching = false; // never flips true: the exposure is gone

  const fakeApi = { startCapture: async () => {} };
  const capture = cameraStore.capturePhoto(fakeApi, 2, 100);

  // Let it settle into the wait-for-exposure loop, then tear down.
  await new Promise((resolve) => setTimeout(resolve, 250));
  store.clearAllStates();

  await withTimeout(capture, 2000, 'capturePhoto hung in the wait loop');
  assert.equal(cameraStore.loading, false);
  assert.equal(cameraStore.isLoadingImage, false);
});

// --- TPPA settings persistence (audit #3) -------------------------------------

test('TPPA settings are persisted per instance and reloaded on switch', (t) => {
  const { settingsStore } = setup(t);
  const tppaStore = useTppaStore();
  t.after(() => localStorage.clear());

  // Instance A saves its filter.
  tppaStore.initialize();
  tppaStore.settings.Filter = 'Lum';
  tppaStore.settings.Gain = 100;
  tppaStore.saveSettings();
  assert.ok(localStorage.getItem('tppaStore.settings:10.0.0.5:5000'), 'scoped key written');

  // Switch to instance B: A's filter must not carry over.
  settingsStore.connection.ip = '10.0.0.9';
  tppaStore.initialize();
  assert.equal(tppaStore.settings.Filter, null, 'defaults on an instance with nothing saved');
  tppaStore.settings.Filter = 'Ha';
  tppaStore.saveSettings();

  // Back to instance A: its own settings return.
  settingsStore.connection.ip = '10.0.0.5';
  tppaStore.initialize();
  assert.equal(tppaStore.settings.Filter, 'Lum');
  assert.equal(tppaStore.settings.Gain, 100);

  // And forward to B again.
  settingsStore.connection.ip = '10.0.0.9';
  tppaStore.initialize();
  assert.equal(tppaStore.settings.Filter, 'Ha');
});

test('TPPA settings migrate once from the legacy global key', (t) => {
  const { settingsStore } = setup(t);
  const tppaStore = useTppaStore();
  t.after(() => localStorage.clear());

  // Pre-fix layout: the whole store state for all instances under one key.
  localStorage.setItem(
    'tppaStore',
    JSON.stringify({ isRunning: true, settings: { Gain: 42, Filter: 'OIII' } })
  );

  settingsStore.connection.ip = '10.0.0.77';
  tppaStore.initialize();
  assert.equal(tppaStore.settings.Gain, 42, 'legacy settings imported');
  assert.equal(tppaStore.settings.Filter, 'OIII');
  assert.equal(tppaStore.isRunning, false, 'live state is NOT restored from disk');
});
