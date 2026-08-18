// src/utils/indiDriverReload.js
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

/**
 * INDI drivers enumerate their hardware only once, at driver start. A device that gets
 * powered up afterwards (the usual case when a power box switches its ports) is therefore
 * invisible to the already running driver, and PINS lists it from the profile cache with
 * `Category: 'OFFLINE'`. Connecting to such an entry always fails; the only way out is to
 * restart the driver, which is what users currently do by hand in the INDI setup dialog.
 */

// apiAction -> profile section + equipmentStore.rescanTrigger key.
// `guiderAction` is intentionally missing: PHD2 has no IndiDriver setting.
export const INDI_DEVICE_MAP = {
  cameraAction: { section: 'CameraSettings', rescanKey: 'camera' },
  mountAction: { section: 'TelescopeSettings', rescanKey: 'mount' },
  focusAction: { section: 'FocuserSettings', rescanKey: 'focus' },
  filterAction: { section: 'FilterWheelSettings', rescanKey: 'filter' },
  rotatorAction: { section: 'RotatorSettings', rescanKey: 'rotator' },
  switchAction: { section: 'SwitchSettings', rescanKey: 'switch' },
  weatherAction: { section: 'WeatherDataSettings', rescanKey: 'weather' },
  flatdeviceAction: { section: 'FlatDeviceSettings', rescanKey: 'flatdevice' },
  domeAction: { section: 'DomeSettings', rescanKey: 'dome' },
  safetyAction: { section: 'SafetyMonitorSettings', rescanKey: 'safety' },
};

// existingEquipmentList (store.getExistingEquipment) names the focuser 'focuser', while the
// rescan key is 'focus' — so this cannot be derived from INDI_DEVICE_MAP alone.
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
};

export function apiActionForApiName(apiName) {
  return API_NAME_TO_ACTION[apiName] || null;
}

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
 * INDI-backed (no mapping, no driver, or explicitly 'None').
 */
export function getIndiDriver(apiAction) {
  const mapping = INDI_DEVICE_MAP[apiAction];
  if (!mapping) return null;
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
  const mapping = INDI_DEVICE_MAP[apiAction];
  const driver = getIndiDriver(apiAction);
  if (!driver) return false;

  const store = apiStore();
  const settingPath = `${mapping.section}-IndiDriver`;

  await apiService.profileChangeValue(settingPath, 'None');
  await apiService[apiAction]('list-devices');
  await apiService.profileChangeValue(settingPath, driver);
  await apiService[apiAction]('list-devices');
  await store.fetchProfilInfos();

  console.log(`[indiDriverReload] reloaded ${driver} for ${apiAction}`);
  return true;
}
