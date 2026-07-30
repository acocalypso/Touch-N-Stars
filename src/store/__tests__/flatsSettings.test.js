import test from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals, freshPinia } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

const { useSettingsStore } = await import('@/store/settingsStore');
const { default: apiService } = await import('@/services/apiService');

function setup(t) {
  freshPinia();
  const originals = {
    getSetting: apiService.getSetting,
    createSetting: apiService.createSetting,
    updateSetting: apiService.updateSetting,
  };
  t.after(() => Object.assign(apiService, originals));
  return useSettingsStore();
}

test('flats target name defaults to opt-out with a usable name', (t) => {
  const settingsStore = setup(t);

  assert.equal(settingsStore.flats.targetNameEnabled, false);
  assert.ok(settingsStore.flats.targetName.trim().length > 0);
});

test('loadFlatsSettings() keeps the defaults when the stored blob predates the feature', async (t) => {
  const settingsStore = setup(t);
  const legacy = {
    activeMode: 'multi',
    selectedOption: 'SkyFlat',
    keepClosed: true,
  };
  apiService.getSetting = async () => ({ Response: { Value: JSON.stringify(legacy) } });

  await settingsStore.loadFlatsSettings();

  assert.equal(settingsStore.flats.activeMode, 'multi');
  assert.equal(settingsStore.flats.targetNameEnabled, false);
  assert.equal(settingsStore.flats.targetName, 'Flat Wizard');
});

test('loadFlatsSettings() restores a stored target name', async (t) => {
  const settingsStore = setup(t);
  apiService.getSetting = async () => ({
    Response: { Value: JSON.stringify({ targetNameEnabled: true, targetName: 'Flats' }) },
  });

  await settingsStore.loadFlatsSettings();

  assert.equal(settingsStore.flats.targetNameEnabled, true);
  assert.equal(settingsStore.flats.targetName, 'Flats');
});

test('saveFlatsSettings() serialises both target name fields', async (t) => {
  const settingsStore = setup(t);
  settingsStore.flats.targetNameEnabled = true;
  settingsStore.flats.targetName = 'Flat Wizard';

  let written = null;
  apiService.createSetting = async (setting) => {
    written = setting;
    return { StatusCode: 200 };
  };

  await settingsStore.saveFlatsSettings();

  assert.equal(written.Key, 'flats_settings');
  const value = JSON.parse(written.Value);
  assert.equal(value.targetNameEnabled, true);
  assert.equal(value.targetName, 'Flat Wizard');
});
