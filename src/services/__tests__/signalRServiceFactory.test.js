import test from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals, freshPinia } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

// scripts/test-loader.mjs redirects '@microsoft/signalr' to the controllable
// fake, so the factory under test builds FakeHubConnections we can drive.
const { fakeSignalR } = await import('../../test-helpers/fakeSignalR.js');
const { createSignalRService } = await import('@/services/signalRServiceFactory');
const { useSettingsStore } = await import('@/store/settingsStore');

const RESTART_DELAY_MS = 2000;

function setup(t, overrides = {}) {
  fakeSignalR.reset();
  freshPinia();
  const settingsStore = useSettingsStore();
  settingsStore.connection.ip = '10.0.0.5';
  const statuses = [];
  const service = createSignalRService({
    name: 'TestHub',
    path: '/hubs/test',
    registerHandlers: overrides.registerHandlers ?? (() => {}),
    emitStatus: (s) => statuses.push(s),
    onReconnected: overrides.onReconnected,
  });
  t.after(() => service.disconnect());
  return { service, statuses, settingsStore };
}

test('connect() dials the hub on the selected instance', async (t) => {
  const { service } = setup(t);
  const p = service.connect();
  const connection = fakeSignalR.lastConnection();
  assert.equal(connection.baseUrl, 'http://10.0.0.5:4782/hubs/test');
  connection.resolveStart();
  await p;
  assert.equal(service.isSignalRConnected(), true);
});

test('concurrent connect() calls share one in-flight attempt', async (t) => {
  const { service } = setup(t);
  const p1 = service.connect();
  const p2 = service.connect();
  assert.equal(p1, p2);
  assert.equal(fakeSignalR.connections.length, 1);
  fakeSignalR.lastConnection().resolveStart();
  await p1;
});

test('a failed first connect resolves null and retries once after the restart delay', async (t) => {
  const { service } = setup(t);
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const p = service.connect();
  fakeSignalR.lastConnection().rejectStart(new Error('ECONNREFUSED'));
  const result = await p;
  assert.equal(result, null, 'resolves null so awaiters do not hang');
  assert.equal(fakeSignalR.connections.length, 1);

  // The single manual restart arms; before the delay nothing redials.
  t.mock.timers.tick(RESTART_DELAY_MS - 1);
  assert.equal(fakeSignalR.connections.length, 1);
  t.mock.timers.tick(1);
  assert.equal(fakeSignalR.connections.length, 2, 'restart dialed a fresh connection');

  fakeSignalR.lastConnection().resolveStart();
  await Promise.resolve();
  assert.equal(service.isSignalRConnected(), true);
});

test('disconnect() cancels a pending restart', async (t) => {
  const { service } = setup(t);
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const p = service.connect();
  fakeSignalR.lastConnection().rejectStart(new Error('ECONNREFUSED'));
  await p;

  service.disconnect();
  t.mock.timers.tick(RESTART_DELAY_MS * 10);
  assert.equal(fakeSignalR.connections.length, 1, 'no redial after a deliberate disconnect');
});

test('close after automatic reconnect gave up schedules the manual restart', async (t) => {
  const { service } = setup(t);
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const p = service.connect();
  const first = fakeSignalR.lastConnection();
  first.resolveStart();
  await p;

  // onclose fires only after withAutomaticReconnect exhausted its schedule.
  first.emitClose(new Error('gone'));
  assert.equal(service.isSignalRConnected(), false);

  t.mock.timers.tick(RESTART_DELAY_MS);
  assert.equal(fakeSignalR.connections.length, 2, 'manual restart dialed');
  fakeSignalR.lastConnection().resolveStart();
  await Promise.resolve();
  assert.equal(service.isSignalRConnected(), true);
});

test('a superseded connection cannot disturb the live one (generation guard)', async (t) => {
  const { service } = setup(t);
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const p = service.connect();
  const stale = fakeSignalR.lastConnection();
  stale.resolveStart();
  await p;

  // Restart path: the old connection closes, the restart dials a new one.
  stale.emitClose(new Error('gone'));
  t.mock.timers.tick(RESTART_DELAY_MS);
  const live = fakeSignalR.lastConnection();
  assert.notEqual(stale, live);
  live.resolveStart();
  await Promise.resolve();
  assert.equal(service.isSignalRConnected(), true);

  // A late event from the superseded connection must be ignored: no state
  // flip, no second restart timer.
  stale.emitClose(new Error('late zombie close'));
  assert.equal(service.isSignalRConnected(), true);
  t.mock.timers.tick(RESTART_DELAY_MS * 10);
  assert.equal(fakeSignalR.connections.length, 2, 'no restart scheduled by the stale close');
});

test('disconnect() stops the live connection and reports disconnected', async (t) => {
  const { service } = setup(t);
  const p = service.connect();
  const connection = fakeSignalR.lastConnection();
  connection.resolveStart();
  await p;

  await service.disconnect();
  assert.ok(connection.stopCalls >= 1, 'underlying hub connection stopped');
  assert.equal(service.isSignalRConnected(), false);
});

test('onReconnected hook fires for the automatic reconnect of the live connection only', async (t) => {
  let reconnects = 0;
  const { service } = setup(t, { onReconnected: () => reconnects++ });
  const p = service.connect();
  const connection = fakeSignalR.lastConnection();
  connection.resolveStart();
  await p;

  connection.emitReconnecting(new Error('blip'));
  assert.equal(service.isSignalRConnected(), false);
  connection.emitReconnected('new-id');
  assert.equal(service.isSignalRConnected(), true);
  assert.equal(reconnects, 1);
});
