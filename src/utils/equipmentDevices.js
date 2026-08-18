// src/utils/equipmentDevices.js
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

/**
 * Everything that maps an equipment apiAction onto the device behind it: where its
 * selection lives in the profile, which rescan key it uses, and whether it can be driven
 * by an INDI driver.
 */

// apiAction -> profile section, equipmentStore.rescanTrigger key, profile field holding the
// selected device, and whether the device can run through an INDI driver.
// The guider is the only one whose selection is not stored under `Id`.
export const DEVICE_MAP = {
  cameraAction: { section: 'CameraSettings', rescanKey: 'camera', idKey: 'Id', indi: true },
  mountAction: { section: 'TelescopeSettings', rescanKey: 'mount', idKey: 'Id', indi: true },
  focusAction: { section: 'FocuserSettings', rescanKey: 'focus', idKey: 'Id', indi: true },
  filterAction: { section: 'FilterWheelSettings', rescanKey: 'filter', idKey: 'Id', indi: true },
  rotatorAction: { section: 'RotatorSettings', rescanKey: 'rotator', idKey: 'Id', indi: true },
  switchAction: { section: 'SwitchSettings', rescanKey: 'switch', idKey: 'Id', indi: true },
  weatherAction: { section: 'WeatherDataSettings', rescanKey: 'weather', idKey: 'Id', indi: true },
  flatdeviceAction: {
    section: 'FlatDeviceSettings',
    rescanKey: 'flatdevice',
    idKey: 'Id',
    indi: true,
  },
  domeAction: { section: 'DomeSettings', rescanKey: 'dome', idKey: 'Id', indi: true },
  safetyAction: { section: 'SafetyMonitorSettings', rescanKey: 'safety', idKey: 'Id', indi: true },
  guiderAction: {
    section: 'GuiderSettings',
    rescanKey: 'guider',
    idKey: 'GuiderName',
    indi: false,
  },
};

// existingEquipmentList (store.getExistingEquipment) names the focuser 'focuser', while the
// rescan key is 'focus' — so this cannot be derived from DEVICE_MAP alone.
const API_NAME_TO_ACTION = {
  camera: 'cameraAction',
  mount: 'mountAction',
  focuser: 'focusAction',
  filter: 'filterAction',
  rotator: 'rotatorAction',
  switch: 'switchAction',
  weather: 'weatherAction',
  flatdevice: 'flatdeviceAction',
  dome: 'domeAction',
  safety: 'safetyAction',
  guider: 'guiderAction',
};

export function apiActionForApiName(apiName) {
  return API_NAME_TO_ACTION[apiName] || null;
}

/**
 * Writes the selected device into the profile, the way NINA's own device dropdowns do.
 * Without this the selection would only ever live in the component and get overwritten by
 * the next device list refresh — which also made 'No device' impossible to choose.
 */
export async function setProfileDevice(apiAction, deviceId) {
  const mapping = DEVICE_MAP[apiAction];
  if (!mapping) return false;

  const store = apiStore();
  await apiService.profileChangeValue(`${mapping.section}-${mapping.idKey}`, deviceId);
  await store.fetchProfilInfos();
  return true;
}

/**
 * INDI drivers enumerate their hardware only once, at driver start. A device that gets
 * powered up afterwards (the usual case when a power box switches its ports) is therefore
 * invisible to the already running driver, and PINS lists it from the profile cache with
 * `Category: 'OFFLINE'`. Connecting to such an entry always fails; the only way out is to
 * restart the driver, which is what users currently do by hand in the INDI setup dialog.
 */

/**
 * A device PINS remembers from the profile but cannot see on the INDI server.
 */
export function isOfflineDevice(device) {
  if (!device) return false;
  if (device.Category === 'OFFLINE') return true;
  // Fallback in case the category is not set but the label still carries the marker.
  return typeof device.DisplayName === 'string' && device.DisplayName.endsWith('(OFFLINE)');
}

/**
 * Returns the configured INDI driver for an apiAction, or null when the device is not
 * INDI-backed (no mapping, no INDI support, no driver, or explicitly 'None').
 */
export function getIndiDriver(apiAction) {
  const mapping = DEVICE_MAP[apiAction];
  if (!mapping || !mapping.indi) return null;
  const store = apiStore();
  const driver = store.profileInfo?.[mapping.section]?.IndiDriver;
  if (!driver || driver === 'None') return null;
  return driver;
}

/**
 * Restarts the INDI driver of a device by unloading it and loading it again — the same
 * sequence selectIndi.vue runs when the user picks a driver, just applied twice.
 *
 * Deliberately does not call equipmentStore.triggerRescan(): that would push the calling
 * selectDevices instance into a concurrent rescan and clash with its fetch generation.
 * Callers refresh their own list afterwards.
 *
 * @returns {Promise<boolean>} true when a reload actually ran.
 */
export async function reloadIndiDriver(apiAction) {
  const mapping = DEVICE_MAP[apiAction];
  const driver = getIndiDriver(apiAction);
  if (!driver) return false;

  const store = apiStore();
  const settingPath = `${mapping.section}-IndiDriver`;

  await apiService.profileChangeValue(settingPath, 'None');
  await apiService[apiAction]('list-devices');
  await apiService.profileChangeValue(settingPath, driver);
  await apiService[apiAction]('list-devices');
  await store.fetchProfilInfos();

  console.log('[equipmentDevices] reloaded', driver, 'for', apiAction);
  return true;
}
