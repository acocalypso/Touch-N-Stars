// src/utils/locationSyncUtils.js
import { apiStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';

// Prüft ob die Sync-Richtung korrekt ist
export function checkLocationSyncDirection() {
  const store = apiStore();
  const syncDirection = store.profileInfo?.TelescopeSettings?.TelescopeLocationSyncDirection;
  console.log(syncDirection);
  return syncDirection !== 'PROMPT';
}

export async function checkMountConnectionPermission(t) {
  if (!checkLocationSyncDirection()) {
    const toastStore = useToastStore();

    const confirmed = await toastStore.showConfirmation(
      t('components.mount.location_sync.title'),
      t('components.mount.location_sync.confirmationMessage'),
      t('components.mount.control.setLocationSyncToMount'),
      t('general.confirm')
    );

    return confirmed;
  }
  return true; // Keine Bestätigung nötig
}
