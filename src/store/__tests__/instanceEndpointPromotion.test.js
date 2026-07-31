import test from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals, freshPinia } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

const { useSettingsStore } = await import('@/store/settingsStore');

const CONFIGURED_IP = '192.168.1.117';
const FIELD_HOTSPOT = '10.42.0.1';

function seedInstance() {
  freshPinia();
  const settingsStore = useSettingsStore();
  settingsStore.connection.instances = [
    { id: 'rig-1', name: 'PINS', ip: CONFIGURED_IP, port: 5000 },
  ];
  settingsStore.selectedInstanceId = 'rig-1';
  settingsStore.connection.ip = CONFIGURED_IP;
  settingsStore.connection.port = 5000;
  return settingsStore;
}

test('reaching the rig on its field hotspot does not rewrite the configured address', () => {
  const settingsStore = seedInstance();

  settingsStore.promoteInstanceEndpoint('rig-1', { host: FIELD_HOTSPOT, rigId: 'pins-ce29c' });
  const instance = settingsStore.getInstance('rig-1');

  // The live session follows the rig...
  assert.equal(settingsStore.connection.ip, FIELD_HOTSPOT);
  assert.equal(instance.preferredEndpoint.host, FIELD_HOTSPOT);
  // ...but what the user configured survives it.
  assert.equal(instance.ip, CONFIGURED_IP);
  assert.ok(instance.candidateHosts.includes(CONFIGURED_IP));
  assert.ok(instance.candidateHosts.includes(FIELD_HOTSPOT));
  assert.equal(instance.rigId, 'pins-ce29c');
});

test('a new session starts on the configured address, not on where it ended', () => {
  const settingsStore = seedInstance();
  settingsStore.promoteInstanceEndpoint('rig-1', { host: FIELD_HOTSPOT });

  // The whole store is persisted, so this is the state the next start hydrates.
  assert.equal(settingsStore.restoreConfiguredEndpoint(), true);
  assert.equal(settingsStore.connection.ip, CONFIGURED_IP);
  assert.equal(settingsStore.connection.port, 5000);
});

test('restoring is a no-op while already on the configured address', () => {
  const settingsStore = seedInstance();

  assert.equal(settingsStore.restoreConfiguredEndpoint(), false);
  assert.equal(settingsStore.connection.ip, CONFIGURED_IP);
});

test('each instance keeps its own configured address', () => {
  const settingsStore = seedInstance();
  settingsStore.connection.instances.push({
    id: 'rig-2',
    name: 'Second',
    ip: '192.168.1.200',
    port: 5000,
  });

  settingsStore.promoteInstanceEndpoint('rig-1', { host: FIELD_HOTSPOT });

  assert.equal(settingsStore.getInstance('rig-1').ip, CONFIGURED_IP);
  assert.equal(settingsStore.getInstance('rig-2').ip, '192.168.1.200');
});
