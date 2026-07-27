import test from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals, freshPinia } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();
// browserEnv's window.location has no reload(); _canReloadOnEndpointChange()
// requires one. The seam below means the real helper never runs, so a no-op
// stub is enough to satisfy the capability check.
window.location.reload = () => {};

const { apiStore } = await import('@/store/store');
const { useSettingsStore } = await import('@/store/settingsStore');
const { default: tppaService } = await import('@/services/websocketTppa');
const { default: mountService } = await import('@/services/websocketMountControl');

const INSTANCE_A = { id: 'a', name: 'Instance A', ip: '10.0.0.5', port: 5000 };
const INSTANCE_B = { id: 'b', name: 'Instance B', ip: '10.0.0.9', port: 5000 };

function setup(t, { setupCompleted = true } = {}) {
  freshPinia();
  // The socket services are app-scoped singletons whose reconnect flag starts
  // armed; the in-place teardown path re-arms them and their idle-recheck timers
  // would keep the test runner alive.
  tppaService.disconnect();
  mountService.disconnect();
  t.after(() => {
    tppaService.disconnect();
    mountService.disconnect();
  });

  const store = apiStore();
  const settingsStore = useSettingsStore();

  settingsStore.setupCompleted = setupCompleted;
  settingsStore.connection.instances = [{ ...INSTANCE_A }, { ...INSTANCE_B }];
  settingsStore.selectedInstanceId = INSTANCE_A.id;
  settingsStore.connection.ip = INSTANCE_A.ip;
  settingsStore.connection.port = INSTANCE_A.port;

  // Seam: record the reload instead of navigating away.
  const reloads = [];
  settingsStore._reloadForInstanceSwitch = (name) => reloads.push(name);

  return { store, settingsStore, reloads };
}

test('a post-setup instance switch reloads instead of tearing down in place', (t) => {
  const { store, settingsStore, reloads } = setup(t);
  const epochBefore = store.connectionEpoch;

  settingsStore.setSelectedInstanceId(INSTANCE_B.id);

  assert.deepEqual(reloads, ['Instance B'], 'reloaded once, named after the new instance');
  assert.equal(store.connectionEpoch, epochBefore, 'switchBackend() was not called');
  assert.equal(settingsStore.connection.ip, INSTANCE_B.ip, 'endpoint written before the reload');
});

test('onboarding tears down in place instead of reloading', (t) => {
  const { store, settingsStore, reloads } = setup(t, { setupCompleted: false });
  const epochBefore = store.connectionEpoch;

  settingsStore.setSelectedInstanceId(INSTANCE_B.id);

  assert.deepEqual(reloads, [], 'the setup wizard must survive the endpoint change');
  assert.equal(store.connectionEpoch, epochBefore + 1, 'switchBackend() ran');
});

test('addInstance({ allowReload: false }) opts out even after setup is complete', (t) => {
  const { store, settingsStore, reloads } = setup(t);
  const epochBefore = store.connectionEpoch;

  settingsStore.addInstance(
    { name: 'Instance C', ip: '10.0.0.11', port: 5000 },
    { allowReload: false }
  );

  assert.deepEqual(reloads, []);
  assert.equal(store.connectionEpoch, epochBefore + 1, 'fell back to the in-place teardown');
  assert.equal(settingsStore.connection.ip, '10.0.0.11', 'the new instance is still selected');
});

test('re-selecting the active instance does not reload', (t) => {
  const { settingsStore, reloads } = setup(t);

  settingsStore.setSelectedInstanceId(INSTANCE_B.id);
  settingsStore.setSelectedInstanceId(INSTANCE_B.id);

  assert.deepEqual(reloads, ['Instance B'], 'the no-op guard absorbs the second call');
});

test('renaming the active instance does not reload', (t) => {
  const { store, settingsStore, reloads } = setup(t);
  const epochBefore = store.connectionEpoch;

  settingsStore.updateInstance(INSTANCE_A.id, { name: 'Renamed' });

  assert.deepEqual(reloads, [], 'a name-only edit must not kill the live session');
  assert.equal(store.connectionEpoch, epochBefore);
  assert.equal(settingsStore.getInstance(INSTANCE_A.id).name, 'Renamed');
});

test('editing the active endpoint reloads', (t) => {
  const { settingsStore, reloads } = setup(t);

  settingsStore.updateInstance(INSTANCE_A.id, { ip: '10.0.0.77' });

  assert.deepEqual(reloads, ['Instance A']);
  assert.equal(settingsStore.connection.ip, '10.0.0.77');
});

test('editing a non-selected instance touches neither path', (t) => {
  const { store, settingsStore, reloads } = setup(t);
  const epochBefore = store.connectionEpoch;

  settingsStore.updateInstance(INSTANCE_B.id, { ip: '10.0.0.99' });

  assert.deepEqual(reloads, []);
  assert.equal(store.connectionEpoch, epochBefore);
  assert.equal(settingsStore.connection.ip, INSTANCE_A.ip, 'the live endpoint is untouched');
});
