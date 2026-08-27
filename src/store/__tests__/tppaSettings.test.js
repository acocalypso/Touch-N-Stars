import test from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals, freshPinia } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

const { useSettingsStore } = await import('@/store/settingsStore');
const { useTppaStore } = await import('@/store/tppaStore');
const { default: apiService } = await import('@/services/apiService');

function setup(t) {
  freshPinia();
  const originals = {
    getSetting: apiService.getSetting,
    createSetting: apiService.createSetting,
    updateSetting: apiService.updateSetting,
  };
  t.after(() => {
    Object.assign(apiService, originals);
    localStorage.clear();
  });
  const settingsStore = useSettingsStore();
  settingsStore.connection.ip = '10.0.0.5';
  settingsStore.connection.port = 5000;
  return { settingsStore, tppaStore: useTppaStore() };
}

test('loadTppaSettings() merges the backend value onto the defaults', async (t) => {
  const { tppaStore } = setup(t);
  apiService.getSetting = async () => ({
    Response: { Value: JSON.stringify({ Gain: 120, Filter: 'Ha' }) },
  });

  await tppaStore.loadTppaSettings();

  assert.equal(tppaStore.settings.Gain, 120);
  assert.equal(tppaStore.settings.Filter, 'Ha');
  // Fields absent from the stored blob fall back to the shared defaults, not
  // to whatever happened to be in memory before the load.
  assert.equal(tppaStore.settings.ManualMode, false);
  assert.equal(tppaStore.settingsReady, true);
});

test('404 with an existing per-instance legacy key migrates it and clears it', async (t) => {
  const { tppaStore } = setup(t);
  localStorage.setItem(
    'tppaStore.settings:10.0.0.5:5000',
    JSON.stringify({ Gain: 100, Filter: 'Lum' })
  );
  apiService.getSetting = async () => ({ StatusCode: 404 });
  let written = null;
  apiService.createSetting = async (setting) => {
    written = setting;
    return { StatusCode: 200 };
  };

  await tppaStore.loadTppaSettings();

  assert.equal(tppaStore.settings.Gain, 100);
  assert.equal(tppaStore.settings.Filter, 'Lum');
  assert.equal(JSON.parse(written.Value).Gain, 100, 'migrated value pushed to the backend');
  assert.equal(localStorage.getItem('tppaStore.settings:10.0.0.5:5000'), null);
});

test('404 with only the older global legacy key migrates its settings', async (t) => {
  const { tppaStore } = setup(t);
  localStorage.setItem(
    'tppaStore',
    JSON.stringify({ isRunning: true, settings: { Gain: 42, Filter: 'OIII' } })
  );
  apiService.getSetting = async () => ({ StatusCode: 404 });
  apiService.createSetting = async () => ({ StatusCode: 200 });

  await tppaStore.loadTppaSettings();

  assert.equal(tppaStore.settings.Gain, 42);
  assert.equal(tppaStore.settings.Filter, 'OIII');
  assert.equal(tppaStore.isRunning, false, 'live state is not restored from the legacy blob');
  assert.equal(localStorage.getItem('tppaStore'), null);
});

test('404 without any legacy data seeds the backend with defaults', async (t) => {
  const { tppaStore } = setup(t);
  apiService.getSetting = async () => ({ StatusCode: 404 });
  let written = null;
  apiService.createSetting = async (setting) => {
    written = setting;
    return { StatusCode: 200 };
  };

  await tppaStore.loadTppaSettings();

  assert.equal(tppaStore.settings.Gain, null);
  assert.equal(written.Key, 'tppa_settings');
});

test('saveSettings() falls back to updateSetting on a 409 conflict', async (t) => {
  const { tppaStore } = setup(t);
  tppaStore.settings.Gain = 200;
  let updatedKey = null;
  let updatedValue = null;
  apiService.createSetting = async () => ({ StatusCode: 409 });
  apiService.updateSetting = async (key, value) => {
    updatedKey = key;
    updatedValue = value;
    return { StatusCode: 200 };
  };

  await tppaStore.saveSettings();

  assert.equal(updatedKey, 'tppa_settings');
  assert.equal(JSON.parse(updatedValue).Gain, 200);
});

test('a failed load keeps the legacy keys and leaves saving disabled', async (t) => {
  const { tppaStore } = setup(t);
  localStorage.setItem('tppaStore.settings:10.0.0.5:5000', JSON.stringify({ Gain: 100 }));
  apiService.getSetting = async () => {
    throw new Error('network down');
  };

  await tppaStore.loadTppaSettings();

  assert.ok(
    localStorage.getItem('tppaStore.settings:10.0.0.5:5000'),
    'legacy key survives for the next attempt'
  );
  // settingsReady must stay false: with only the defaults in memory, an active
  // save watcher would overwrite the rig's real settings on the first edit.
  assert.equal(tppaStore.settingsReady, false);
});

test('an unexpected response neither migrates nor discards the legacy keys', async (t) => {
  const { tppaStore } = setup(t);
  localStorage.setItem('tppaStore.settings:10.0.0.5:5000', JSON.stringify({ Gain: 100 }));
  // e.g. a 500 or an empty body while the plugin restarts.
  apiService.getSetting = async () => ({ StatusCode: 500, Success: false });
  let seeded = false;
  apiService.createSetting = async () => {
    seeded = true;
    return { StatusCode: 200 };
  };

  await tppaStore.loadTppaSettings();

  assert.equal(seeded, false, 'nothing is written to the backend');
  assert.ok(localStorage.getItem('tppaStore.settings:10.0.0.5:5000'));
  assert.equal(tppaStore.settingsReady, false);
});

test('a corrupt stored blob does not reject or drop the legacy keys', async (t) => {
  const { tppaStore } = setup(t);
  localStorage.setItem('tppaStore.settings:10.0.0.5:5000', JSON.stringify({ Gain: 100 }));
  apiService.getSetting = async () => ({ Response: { Value: '{not json' } });

  await tppaStore.loadTppaSettings();

  assert.ok(localStorage.getItem('tppaStore.settings:10.0.0.5:5000'));
  assert.equal(tppaStore.settingsReady, false);
});

test('saveSettings() swallows write failures instead of rejecting', async (t) => {
  const { tppaStore } = setup(t);
  apiService.createSetting = async () => {
    throw new Error('rig unreachable');
  };

  // Called from a floating debounce timer, so a rejection would be unhandled.
  await tppaStore.saveSettings();
});

test('setRunning() no longer triggers a settings save', async (t) => {
  const { tppaStore } = setup(t);
  let saveCalled = false;
  apiService.createSetting = async () => {
    saveCalled = true;
    return { StatusCode: 200 };
  };

  tppaStore.setRunning(true);

  assert.equal(tppaStore.isRunning, true);
  assert.equal(saveCalled, false);
});
