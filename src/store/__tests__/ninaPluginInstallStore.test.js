import test from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals, freshPinia } from '@/test-helpers/browserEnv.js';

installBrowserGlobals();
freshPinia();
const { default: apiService } = await import('@/services/apiService');
const { default: apiPinsService } = await import('@/services/apiPinsService');
const { useNinaPluginInstallStore } = await import('../ninaPluginInstallStore.js');

// One Pinia for the whole file (apiService caches its store references); reset per test.
const store = useNinaPluginInstallStore();
const LIVESTACK = { name: 'LiveStack', pinsPackage: 'pins-plugin-livestack' };
const FAST = { settleMs: 0, pollMs: 1, timeoutMs: 50 };

function reset() {
  store.$reset();
  store.open({ pluginName: 'livestack', requirement: LIVESTACK });
}

test('opens only for requirements with a PINS package', () => {
  store.$reset();
  store.open({ pluginName: 'x', requirement: { name: 'X', pinsPackage: null } });
  assert.equal(store.show, false);
  reset();
  assert.equal(store.show, true);
  assert.equal(store.phase, 'confirm');
});

test('a successful install asks for the NINA restart', async (t) => {
  reset();
  let installed;
  t.mock.method(apiPinsService, 'runPinsPluginAction', async (action, pkg) => {
    installed = [action, pkg];
    return { jobId: 'job-1' };
  });
  t.mock.method(apiPinsService, 'getPinsDaemonJob', async () => ({ status: 'success' }));

  await store.install();

  assert.deepEqual(installed, ['install', 'pins-plugin-livestack']);
  assert.equal(store.phase, 'restartPrompt');
});

test('a failed install keeps the dialog open with the reason, ready to retry', async (t) => {
  reset();
  t.mock.method(apiPinsService, 'runPinsPluginAction', async () => ({ jobId: 'job-2' }));
  t.mock.method(apiPinsService, 'getPinsDaemonJob', async () => ({
    status: 'failed',
    exitCode: 100,
    errorMessage: 'Unable to locate package',
  }));

  await store.install();

  assert.equal(store.phase, 'failed');
  assert.equal(store.errorMessage, 'Unable to locate package');
  assert.equal(store.show, true);
});

test('restart finishes once NINA lists the plugin again', async (t) => {
  reset();
  store.phase = 'restartPrompt';
  t.mock.method(apiPinsService, 'restartPinsNina', async () => ({ status: 'ok' }));
  let polls = 0;
  t.mock.method(apiService, 'getPlugins', async () => {
    polls += 1;
    if (polls === 1) throw new Error('Network Error'); // NINA still down
    return { Success: true, Response: ['ninaAPI', 'LiveStack'] };
  });

  const before = store.completedCount;
  await store.restartNina(FAST);

  assert.equal(store.phase, 'done');
  assert.equal(store.completedCount, before + 1);
});

test('an older daemon without the restart route falls back to a device restart hint', async (t) => {
  reset();
  store.phase = 'restartPrompt';
  t.mock.method(apiPinsService, 'restartPinsNina', async () => {
    const error = new Error('Not Found');
    error.response = { status: 404 };
    throw error;
  });

  await store.restartNina(FAST);

  assert.equal(store.phase, 'restartUnavailable');
});

test('a failed restart call stays on the prompt with the error', async (t) => {
  reset();
  store.phase = 'restartPrompt';
  t.mock.method(apiPinsService, 'restartPinsNina', async () => {
    const error = new Error('boom');
    error.response = { status: 500, data: { detail: 'systemctl failed' } };
    throw error;
  });

  await store.restartNina(FAST);

  assert.equal(store.phase, 'restartPrompt');
  assert.equal(store.errorMessage, 'systemctl failed');
});

test('offer skips straight to the restart when the package is already installed', async (t) => {
  store.$reset();
  t.mock.method(apiPinsService, 'getPinsPlugins', async () => ({
    plugins: [{ packageName: 'pins-plugin-livestack', installed: true }],
  }));

  await store.offer({ pluginName: 'livestack', requirement: LIVESTACK });

  assert.equal(store.phase, 'restartPrompt');
});
