import { ref } from 'vue';
import { Capacitor } from '@capacitor/core';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import apiPinsService from '@/services/apiPinsService';
import appVersion from '@/version';
import {
  DEVICE_CATEGORIES,
  enrichWithIndiPackages,
  extractArchitecture,
  extractDeviceCandidates,
} from '../utils/snapshotSerializer';

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

  async function collect() {
    loading.value = true;
    error.value = '';

    try {
      const store = apiStore();

      const deviceInfos = {};
      for (const storeKey of Object.keys(DEVICE_CATEGORIES)) {
        deviceInfos[storeKey] = store[storeKey];
      }

      let list = extractDeviceCandidates(deviceInfos);

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
