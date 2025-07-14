// src/utils/locationSyncUtils.js
import { ref } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

// Reactive state für das Modal
export const showLocationSyncModal = ref(false);
let locationSyncResolver = null;

// Prüft ob die Sync-Richtung korrekt ist
export function checkLocationSyncDirection() {
  const store = apiStore();
  const syncDirection = store.profileInfo?.TelescopeSettings?.TelescopeLocationSyncDirection;
  console.log('checkLocationSyncDirection' , syncDirection);
  return syncDirection === 'PROMPT';
}

// Setzt die neue Sync-Richtung
export async function setLocationSyncDirection(direction) {
      await apiService.profileChangeValue('TelescopeSettings-TelescopeLocationSyncDirection', direction); 
}

// Zeigt das Modal an und wartet auf Benutzerantwort
function showLocationSyncConfirmation() {
  return new Promise((resolve) => {
    locationSyncResolver = resolve;
    showLocationSyncModal.value = true;
  });
}

// Option wurde gewählt
export function selectLocationSyncOption(value) {
  showLocationSyncModal.value = false;
  if (locationSyncResolver) {
    setLocationSyncDirection(value);
    locationSyncResolver(true);
    locationSyncResolver = null;
  }
}

// Abbrechen
export function cancelLocationSync() {
  showLocationSyncModal.value = false;
  if (locationSyncResolver) {
    locationSyncResolver(false);
    locationSyncResolver = null;
  }
}

// Hauptfunktion für Mount-Verbindungscheck
export async function checkMountConnectionPermission() {
  if (checkLocationSyncDirection()) {
    return await showLocationSyncConfirmation();
  }
  return true; // Bereits korrekt eingestellt
}