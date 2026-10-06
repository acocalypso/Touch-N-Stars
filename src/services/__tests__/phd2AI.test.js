import test from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals, freshPinia } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();
freshPinia();
const { default: api, aiHttp } = await import('@/services/api/phd2AI');
const { useSettingsStore } = await import('@/store/settingsStore');
const { apiStore } = await import('@/store/store');
const { usePhd2AIStore } = await import('@/store/phd2AIStore');
const settings = useSettingsStore();
apiStore();
settings.connection.ip = '192.168.178.109';
settings.connection.port = 5000;

test('AI methods use the selected plugin host, bounded timeout and RPC field names', async (t) => {
  const calls = [];
  t.mock.method(aiHttp, 'request', async (request) => {
    calls.push(request);
    return { data: { Success: true, Response: { state: 'recording' } } };
  });
  await api.start(720, 120);
  await api.fit('/home/pi/baseline.csv', 120);
  await api.mode('shadow');
  await api.directory('/home/pi/Documents/PHD2');
  assert.equal(calls[0].url, 'http://192.168.178.109:5000/api/phd2/ai/training/start');
  assert.equal(calls[0].timeout, 10000);
  assert.deepEqual(calls[0].data, { duration_sec: 720, period_sec: 120 });
  assert.deepEqual(calls[1].data, { recording_path: '/home/pi/baseline.csv', period_sec: 120 });
  assert.deepEqual(calls[2].data, { mode: 'shadow' });
  assert.equal(calls[3].url, 'http://192.168.178.109:5000/api/phd2/ai/directory');
  assert.equal(calls[3].method, 'put');
  assert.deepEqual(calls[3].data, { path: '/home/pi/Documents/PHD2' });
});

test('HTTP success with a failed API envelope still rejects mutations', async (t) => {
  t.mock.method(aiHttp, 'request', async () => ({
    data: { Success: false, Error: 'Incompatible mount' },
  }));
  await assert.rejects(api.mode('active'), /Incompatible mount/);
});

test('unsupported versions clear stale model and Active state', async (t) => {
  const store = usePhd2AIStore();
  store.reset();
  store.status = { mode: 'active' };
  t.mock.method(api, 'status', async () => {
    throw Object.assign(new Error('Unsupported'), { response: { status: 501 } });
  });
  await store.refresh();
  assert.equal(store.available, false);
  assert.equal(store.status, null);
});

test('switching Pi during a request discards its response', async (t) => {
  const store = usePhd2AIStore();
  store.reset();
  let resolve;
  t.mock.method(
    api,
    'status',
    () =>
      new Promise((done) => {
        resolve = done;
      })
  );
  t.mock.method(api, 'models', async () => ({ profile_id: 1, models: [] }));
  const pending = store.refresh();
  settings.connection.ip = '192.168.178.110';
  resolve({ profile_id: 1, mode: 'active' });
  await pending;
  assert.equal(store.status, null);
  settings.connection.ip = '192.168.178.109';
});

test('profile change between status and library snapshots is not displayed', async (t) => {
  const store = usePhd2AIStore();
  store.reset();
  t.mock.method(api, 'status', async () => ({ profile_id: 1 }));
  t.mock.method(api, 'models', async () => ({ profile_id: 2, models: [] }));
  await store.refresh();
  assert.equal(store.status, null);
});

test('a completed mutation on a previous Pi cannot trigger a follow-up action', async (t) => {
  const store = usePhd2AIStore();
  store.reset();
  t.mock.method(api, 'gain', async () => {
    settings.connection.ip = '192.168.178.110';
  });
  t.mock.method(api, 'status', async () => ({ profile_id: 1, mode: 'disabled' }));
  t.mock.method(api, 'models', async () => ({ profile_id: 1, models: [] }));
  assert.equal(await store.run('gain', 0.1), false);
  settings.connection.ip = '192.168.178.109';
});

test('import selects the copied model, and errors remain visible after refresh', async (t) => {
  const store = usePhd2AIStore();
  store.reset();
  let selected;
  t.mock.method(api, 'import', async () => ({ path: '/home/pi/library/imported.json' }));
  t.mock.method(api, 'select', async (path) => {
    selected = path;
  });
  t.mock.method(api, 'status', async () => ({ profile_id: 1, mode: 'disabled' }));
  t.mock.method(api, 'models', async () => ({ profile_id: 1, models: [] }));
  assert.equal(await store.run('import', '/home/pi/upload.json'), true);
  assert.equal(selected, '/home/pi/library/imported.json');
  t.mock.method(api, 'start', async () => {
    throw new Error('Start guiding first');
  });
  assert.equal(await store.run('start', 720, 120), false);
  assert.match(store.error, /Start guiding first/);
  assert.equal(store.busy, false);
});
