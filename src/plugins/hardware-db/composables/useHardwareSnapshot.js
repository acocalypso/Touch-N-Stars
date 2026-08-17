import { ref } from 'vue';
import { Capacitor } from '@capacitor/core';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import apiPinsService from '@/services/apiPinsService';
import appVersion from '@/version';
import apiService from '@/services/apiService';
import {
  DEVICE_CATEGORIES,
  PROFILE_SECTIONS,
  enrichWithIndiPackages,
  extractArchitecture,
  extractDeviceCandidates,
} from '../utils/snapshotSerializer';

/** Category -> apiService method used to list that device type. */
const LIST_ACTIONS = Object.freeze({
  camera: 'cameraAction',
  mount: 'mountAction',
  focuser: 'focusAction',
  filterwheel: 'filterAction',
  rotator: 'rotatorAction',
  guider: 'guiderAction',
  flatdevice: 'flatdeviceAction',
  switch: 'switchAction',
  weather: 'weatherAction',
  dome: 'domeAction',
  safetymonitor: 'safetyAction',
});

/**
 * Collects everything the report needs from data the app already has.
 *
 * By design this never asks the PINS daemon for anything new — no lsusb, no
 * OS/kernel/board info. Those would have required a new daemon endpoint, so the
 * device identity rests on the driver name plus the device name instead.
 */
export function useHardwareSnapshot() {
  const candidates = ref([]);
  const architecture = ref('');
  const loading = ref(false);
  const error = ref('');

  /**
   * PINS-only extras. Each is optional: on NINA, on an older PINS build, or on
   * any transport hiccup the report still goes out with the store data alone.
   */
  async function collectIndiPackages() {
    try {
      const response = await apiPinsService.getPinsIndi3rdpartyPackages({
        onlyNotInstalled: false,
      });
      const packages = response?.packages || [];
      return Array.isArray(packages) ? packages : [];
    } catch (err) {
      console.warn('[hardware-db] INDI package list unavailable:', err?.message || err);
      return [];
    }
  }

  /**
   * The guide camera's readable name and connection state.
   *
   * Read-only on purpose: selectGuiderCam.vue forces a connectPHD2() before it
   * lists cameras, which must not happen here — opening a reporting page may
   * not start PHD2 as a side effect. A plain GET is enough, and it failing with
   * "PHD2NotConnected" is the normal case, not an error. The profile still
   * carries driver and id, so the camera stays reportable either way.
   */
  async function collectPhd2() {
    const [equipment, cameraIds] = await Promise.all([
      apiService
        .getPhd2CurrentEquipment()
        .then((response) => response?.Response?.CurrentEquipment || null)
        .catch((err) => {
          console.warn('[hardware-db] PHD2 equipment unavailable:', err?.message || err);
          return null;
        }),
      // Same list the guide camera dropdown is built from: driver -> [{Id, Name}].
      // It turns the profile's opaque camera id into the model name the user
      // sees there. selectGuiderCam.vue calls connectPHD2() first; we do not.
      apiPinsService
        .getGuideCam()
        .then((response) => (response?.Success ? response.Response || null : null))
        .catch((err) => {
          console.warn('[hardware-db] PHD2 camera list unavailable:', err?.message || err);
          return null;
        }),
    ]);

    return { equipment, cameraIds };
  }

  /**
   * Resolves display names for devices that are configured but not connected.
   * The profile only stores an Id, which for ASCOM is a ProgID and reads badly;
   * the device list has the friendly name. Only the categories that actually
   * need it are queried.
   */
  async function resolveConfiguredNames(store, deviceInfos) {
    const wanted = [];
    for (const [storeKey, category] of Object.entries(DEVICE_CATEGORIES)) {
      if (deviceInfos[storeKey]?.Connected) continue;
      const id = store.profileInfo?.[PROFILE_SECTIONS[category]]?.Id;
      if (id && LIST_ACTIONS[category]) wanted.push({ category, id });
    }
    if (!wanted.length) return {};

    const resolved = {};
    await Promise.all(
      wanted.map(async ({ category, id }) => {
        try {
          const response = await apiService[LIST_ACTIONS[category]]('list-devices');
          const devices = Array.isArray(response?.Response) ? response.Response : [];
          const match = devices.find((device) => String(device?.Id) === String(id));
          if (match?.DisplayName) resolved[category] = match.DisplayName;
        } catch (err) {
          // Optional enrichment: without it the profile Id is used as the name.
          console.warn(
            `[hardware-db] Device list for ${category} unavailable:`,
            err?.message || err
          );
        }
      })
    );
    return resolved;
  }

  async function collect() {
    loading.value = true;
    error.value = '';

    try {
      const store = apiStore();

      const deviceInfos = {};
      for (const storeKey of Object.keys(DEVICE_CATEGORIES)) {
        deviceInfos[storeKey] = store[storeKey];
      }

      // PHD2 is a PINS concept; on NINA the guide camera is regular equipment.
      const [deviceNames, phd2] = await Promise.all([
        resolveConfiguredNames(store, deviceInfos),
        store.isPINS ? collectPhd2() : Promise.resolve(null),
      ]);

      let list = extractDeviceCandidates(deviceInfos, {
        profileInfo: store.profileInfo,
        deviceNames,
        phd2,
      });

      if (store.isPINS) {
        const packages = await collectIndiPackages();
        list = enrichWithIndiPackages(list, packages);
        architecture.value = extractArchitecture(packages);
      } else {
        architecture.value = '';
      }

      candidates.value = list;
    } catch (err) {
      console.error('[hardware-db] Failed to collect hardware snapshot:', err);
      error.value = err?.message || 'Failed to collect hardware snapshot';
      candidates.value = [];
    } finally {
      loading.value = false;
    }
  }

  /** Version and environment context that accompanies every report. */
  function collectMeta() {
    const store = apiStore();
    const settingsStore = useSettingsStore();

    return {
      versions: {
        tns: appVersion,
        pins: store.currentPinsVersion || '',
        api: store.currentApiVersion || '',
        tnsPlugin: store.currentTnsPluginVersion || '',
      },
      architecture: architecture.value,
      mode: store.isPINS ? 'pins' : 'nina',
      platform: Capacitor.getPlatform(),
      locale: settingsStore.getLanguage?.() || store.currentLanguage || 'en',
    };
  }

  return { candidates, architecture, loading, error, collect, collectMeta };
}
