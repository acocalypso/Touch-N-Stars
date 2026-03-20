import { ref } from 'vue';
import { Geolocation } from '@capacitor/geolocation';
import apiService from '@/services/apiService';
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import { useGuiderStore } from '@/store/guiderStore';

export const latitude = ref(0);
export const longitude = ref(0);
export const altitude = ref(0);
export const gpsError = ref(null);

export async function getCurrentLocation() {
  try {
    // Check for location permission
    if (Capacitor.getPlatform() !== 'web') {
      const result = await Geolocation.requestPermissions({
        permissions: ['location'],
      });
      if (result.location !== 'granted') {
        gpsError.value = 'Location permission not granted';
        return;
      }
    }
    // Get current position with high accuracy
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
    console.log(pos);
    latitude.value = pos.coords.latitude.toFixed(3);
    longitude.value = pos.coords.longitude.toFixed(3);
    altitude.value = pos.coords.altitude.toFixed(1);
    gpsError.value = null;
  } catch (error) {
    gpsError.value = error.message || 'Failed to get GPS location';
  }
}

export function useLocationStore() {
  const settingsStore = useSettingsStore();
  const store = apiStore();

  function sanitizeCoordinate(input) {
    if (typeof input === 'string') {
      const cleaned = input.trim().replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    } else if (typeof input === 'number') {
      return input;
    }
    return null;
  }

  return {
    async loadFromAstrometrySettings() {
      const settings = store.profileInfo?.AstrometrySettings;
      if (!settings) {
        return;
      }
      latitude.value = settings.Latitude ?? '';
      longitude.value = settings.Longitude ?? '';
      altitude.value = settings.Elevation ?? '';
    },

    async saveCoordinates() {
      try {
        settingsStore.setCoordinates({
          latitude: (latitude.value = sanitizeCoordinate(latitude.value)),
          longitude: (longitude.value = sanitizeCoordinate(longitude.value)),
          altitude: (altitude.value = sanitizeCoordinate(altitude.value)),
        });

        if (store.isBackendReachable) {
          await apiService.profileChangeValue('AstrometrySettings-Latitude', latitude.value);
          await apiService.profileChangeValue('AstrometrySettings-Longitude', longitude.value);
          await apiService.profileChangeValue('AstrometrySettings-Elevation', altitude.value);
          /*await apiService.profileChangeValue(
            'TelescopeSettings-TelescopeLocationSyncDirection',
            2
          );*/

          if (
            store.mountInfo.Connected &&
            store.profileInfo.TelescopeSettings.TelescopeLocationSyncDirection === 'TOTELESCOPE'
          ) {
            const guiderStore = useGuiderStore();
            const isPhd2 = store.guiderInfo?.DeviceId === 'PHD2_Single';
            const isPhd2EquipmentConnected = isPhd2 && guiderStore.phd2IsConnected;

            let phd2ProfileName = null;
            if (isPhd2EquipmentConnected) {
              try {
                const profileResponse = await apiService.getPhd2CurrentProfile();
                phd2ProfileName = profileResponse?.Response?.Profile?.name ?? null;
                if (phd2ProfileName) {
                  await apiService.disconnectPHD2Equipment();
                }
              } catch (e) {
                console.warn('Could not disconnect PHD2 equipment before mount reconnect:', e);
                phd2ProfileName = null;
              }
            }

            await apiService.mountAction('disconnect');
            await apiService.mountAction('connect');

            if (phd2ProfileName) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              try {
                await apiService.connectPHD2Equipment(phd2ProfileName);
              } catch (e) {
                console.warn('Could not reconnect PHD2 equipment after mount reconnect:', e);
              }
            }
          }
          console.log('Coordinates saved');
        }
      } catch (error) {
        console.error('Failed to update backend coordinates:', error);
      }
    },
  };
}
