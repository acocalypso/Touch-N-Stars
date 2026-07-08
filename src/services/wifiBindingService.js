import { watch } from 'vue';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useSettingsStore } from '@/store/settingsStore';
import { WifiNetworkBinder } from '@/utils/wifiNetworkBinder';

let initialized = false;

async function applyBinding(settingsStore) {
  try {
    const ip = settingsStore.connection.ip;
    if (settingsStore.wifiBindingEnabled && ip) {
      const status = await WifiNetworkBinder.setTargetIp({ ip });
      console.log('[WifiBinding] target updated:', JSON.stringify(status));
    } else {
      await WifiNetworkBinder.disable();
      console.log('[WifiBinding] disabled');
    }
  } catch (error) {
    console.warn('[WifiBinding] failed to apply binding:', error);
  }
}

/**
 * Android only: keeps the app process bound to the Wi-Fi network whenever the
 * active instance IP is inside its subnet, so the backend (e.g. PINS hotspot
 * without internet) stays reachable while mobile data is the default network.
 */
export function initWifiBinding() {
  if (initialized || Capacitor.getPlatform() !== 'android') return;
  initialized = true;

  const settingsStore = useSettingsStore();

  watch(
    () => [settingsStore.wifiBindingEnabled, settingsStore.connection.ip],
    () => applyBinding(settingsStore),
    { immediate: true }
  );

  // Android may drop the process binding while the app is paused; re-apply on resume
  CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      applyBinding(settingsStore);
    }
  });
}
