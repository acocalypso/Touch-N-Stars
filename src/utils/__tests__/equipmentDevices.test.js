import test from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals, freshPinia } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

// Import AFTER the globals exist: the store's transitive imports touch browser APIs
// at module load.
const { apiStore } = await import('@/store/store');
const apiService = (await import('@/services/apiService')).default;
const { apiActionForApiName, getIndiDriver, isOfflineDevice, reloadIndiDriver, setProfileDevice } =
  await import('@/utils/equipmentDevices');

// Records every API call the reload makes, in order, and keeps the real methods out of
// the network.
function stubApi(calls) {
  const original = {
    profileChangeValue: apiService.profileChangeValue,
    rotatorAction: apiService.rotatorAction,
  };
  apiService.profileChangeValue = async (path, value) => {
    calls.push(`profileChangeValue:${path}=${value}`);
  };
  apiService.rotatorAction = async (action) => {
    calls.push(`rotatorAction:${action}`);
    return { Response: [], Success: true };
  };
  return () => Object.assign(apiService, original);
}

function setup(indiDriver, calls) {
  freshPinia();
  const store = apiStore();
  store.profileInfo = { RotatorSettings: { IndiDriver: indiDriver } };
  store.fetchProfilInfos = async () => {
    calls.push('fetchProfilInfos');
  };
  return store;
}

test('reloadIndiDriver unloads and reloads the configured driver', async () => {
  const calls = [];
  const restore = stubApi(calls);
  setup('indi_asi_rotator', calls);

  try {
    assert.equal(await reloadIndiDriver('rotatorAction'), true);
  } finally {
    restore();
  }

  assert.deepEqual(calls, [
    'profileChangeValue:RotatorSettings-IndiDriver=None',
    'rotatorAction:list-devices',
    'profileChangeValue:RotatorSettings-IndiDriver=indi_asi_rotator',
    'rotatorAction:list-devices',
    'fetchProfilInfos',
  ]);
});

test('reloadIndiDriver does nothing when no INDI driver is configured', async () => {
  const calls = [];
  const restore = stubApi(calls);
  setup('None', calls);

  try {
    assert.equal(await reloadIndiDriver('rotatorAction'), false);
    setup(undefined, calls);
    assert.equal(await reloadIndiDriver('rotatorAction'), false);
  } finally {
    restore();
  }

  assert.deepEqual(calls, []);
});

test('reloadIndiDriver ignores devices without an INDI driver setting', async () => {
  const calls = [];
  const restore = stubApi(calls);
  setup('indi_asi_rotator', calls);

  try {
    // PHD2 has no IndiDriver, so guiderAction is not part of the map.
    assert.equal(await reloadIndiDriver('guiderAction'), false);
  } finally {
    restore();
  }

  assert.deepEqual(calls, []);
});

test('getIndiDriver reads the driver from the matching profile section', () => {
  const calls = [];
  setup('indi_asi_rotator', calls);
  assert.equal(getIndiDriver('rotatorAction'), 'indi_asi_rotator');
  assert.equal(getIndiDriver('cameraAction'), null);
  assert.equal(getIndiDriver('guiderAction'), null);
});

test('isOfflineDevice detects the category and the label fallback', () => {
  assert.equal(isOfflineDevice({ Category: 'OFFLINE' }), true);
  assert.equal(
    isOfflineDevice({ Category: '', DisplayName: 'ZWO CAA CAA (INDI) (OFFLINE)' }),
    true
  );
  assert.equal(isOfflineDevice({ Category: 'INDI', DisplayName: 'ZWO CAA CAA (INDI)' }), false);
  assert.equal(isOfflineDevice(null), false);
  assert.equal(isOfflineDevice(undefined), false);
  assert.equal(isOfflineDevice({}), false);
});

test('apiActionForApiName bridges the focuser/focus naming mismatch', () => {
  // existingEquipmentList says 'focuser', the rescan key is 'focus'.
  assert.equal(apiActionForApiName('focuser'), 'focusAction');
  assert.equal(apiActionForApiName('rotator'), 'rotatorAction');
  assert.equal(apiActionForApiName('guider'), 'guiderAction');
  assert.equal(apiActionForApiName('nonsense'), null);
});

test('setProfileDevice writes the device id into the profile', async () => {
  const calls = [];
  const restore = stubApi(calls);
  setup('indi_asi_rotator', calls);

  try {
    assert.equal(await setProfileDevice('rotatorAction', 'No_Device'), true);
  } finally {
    restore();
  }

  assert.deepEqual(calls, ['profileChangeValue:RotatorSettings-Id=No_Device', 'fetchProfilInfos']);
});

test('setProfileDevice uses GuiderName instead of Id for the guider', async () => {
  const calls = [];
  const restore = stubApi(calls);
  setup('None', calls);

  try {
    assert.equal(await setProfileDevice('guiderAction', 'No_Guider'), true);
  } finally {
    restore();
  }

  // The guider is the only device whose selection is not stored under `Id`.
  assert.deepEqual(calls, [
    'profileChangeValue:GuiderSettings-GuiderName=No_Guider',
    'fetchProfilInfos',
  ]);
});

test('setProfileDevice ignores an unknown apiAction', async () => {
  const calls = [];
  const restore = stubApi(calls);
  setup('None', calls);

  try {
    assert.equal(await setProfileDevice('nonsenseAction', 'No_Device'), false);
  } finally {
    restore();
  }

  assert.deepEqual(calls, []);
});
