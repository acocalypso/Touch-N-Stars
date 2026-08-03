<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-xl font-semibold text-content">
        {{ t('components.pinsWizard.location.title') }}
      </h2>
      <p class="text-sm text-content-muted mt-1">
        {{ t('components.pinsWizard.location.description') }}
      </p>
    </div>

    <!-- Current values: profile vs. mount -->
    <div v-if="showCoordCards" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div class="rounded-control bg-surface-2 p-3">
        <div class="flex items-center justify-between mb-2 gap-2">
          <p class="text-xs font-medium text-content-muted">
            {{ t('components.pinsWizard.location.profileCoords') }}
          </p>
          <button
            class="text-content-faint hover:text-accent transition-colors"
            :title="t('common.refresh')"
            @click="locationStore.loadFromAstrometrySettings()"
          >
            <ArrowPathIcon class="w-4 h-4" />
          </button>
        </div>
        <p class="text-xs text-content">
          {{ t('setup.coordLat') }}: {{ formatCoord(ninaCoords.latitude, 'lat') ?? '—' }}
        </p>
        <p class="text-xs text-content">
          {{ t('setup.coordLon') }}: {{ formatCoord(ninaCoords.longitude, 'lon') ?? '—' }}
        </p>
        <p class="text-xs text-content">
          {{ t('setup.coordAlt') }}: {{ ninaCoords.elevation ?? '—' }} {{ t('setup.coordUnit') }}
        </p>
      </div>

      <div class="rounded-control bg-surface-2 p-3">
        <div class="flex items-center justify-between mb-2 gap-2">
          <p class="text-xs font-medium text-content-muted">
            {{ t('components.pinsWizard.location.mountCoords') }}
          </p>
          <button
            class="text-content-faint hover:text-accent transition-colors"
            :class="{ 'animate-spin': mountCoordsLoading }"
            :title="t('common.refresh')"
            @click="locationStore.loadMountCoords()"
          >
            <ArrowPathIcon class="w-4 h-4" />
          </button>
        </div>
        <p v-if="mountCoordsLoading" class="text-xs text-content-faint">
          {{ t('setup.loadingCoords') }}
        </p>
        <p v-else-if="!mountCoords.connected" class="text-xs text-content-faint">
          {{ t('setup.mountNotConnected') }}
        </p>
        <p v-else-if="!mountCoords.siteLocationSupported" class="text-xs text-status-warn">
          {{ t('setup.coordsNotSupported') }}
        </p>
        <template v-else>
          <p class="text-xs text-content">
            {{ t('setup.coordLat') }}: {{ formatCoord(mountCoords.latitude, 'lat') ?? '—' }}
          </p>
          <p class="text-xs text-content">
            {{ t('setup.coordLon') }}: {{ formatCoord(mountCoords.longitude, 'lon') ?? '—' }}
          </p>
          <p class="text-xs text-content">
            {{ t('setup.coordAlt') }}: {{ mountCoords.elevation }} {{ t('setup.coordUnit') }}
          </p>
        </template>
      </div>
    </div>

    <p v-if="coordsMismatch" class="text-xs text-status-warn">
      {{ t('components.settings.coordsMismatchWarning') }}
    </p>

    <!-- Editable coordinates. Text inputs on purpose: getCurrentLocation() writes
         strings (toFixed), and saveCoordinates() sanitizes them (incl. decimal comma). -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <label class="flex flex-col gap-1">
        <span class="text-xs font-semibold uppercase text-content-muted">
          {{ t('components.pinsWizard.location.latitude') }}
        </span>
        <input v-model="latitude" type="text" inputmode="decimal" class="tns-input" />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-xs font-semibold uppercase text-content-muted">
          {{ t('components.pinsWizard.location.longitude') }}
        </span>
        <input v-model="longitude" type="text" inputmode="decimal" class="tns-input" />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-xs font-semibold uppercase text-content-muted">
          {{ t('components.pinsWizard.location.altitude') }} ({{ t('setup.coordUnit') }})
        </span>
        <input v-model="altitude" type="text" inputmode="decimal" class="tns-input" />
      </label>
    </div>

    <button class="tns-btn-secondary" :disabled="isSaving" @click="getCurrentLocation">
      <MapPinIcon class="w-5 h-5" />
      {{ t('components.pinsWizard.location.useCurrentLocation') }}
    </button>
    <p v-if="gpsError" class="text-sm text-status-danger break-words">{{ gpsError }}</p>

    <!-- Sync direction -->
    <template v-if="store.isPINS">
      <label class="flex flex-col gap-1">
        <span class="text-xs font-semibold uppercase text-content-muted">
          {{ t('components.pinsWizard.location.syncDirection') }}
        </span>
        <select v-model="syncDirection" class="tns-select" :disabled="isSaving">
          <option value="NOSYNC">{{ t('setup.syncDirectionNosync') }}</option>
          <option value="TOAPPLICATION">{{ t('setup.syncDirectionToApplication') }}</option>
          <option value="TOTELESCOPE">{{ t('setup.syncDirectionToTelescope') }}</option>
        </select>
      </label>
    </template>
    <template v-else>
      <div
        v-if="
          store?.profileInfo?.TelescopeSettings?.TelescopeLocationSyncDirection !== 'TOTELESCOPE'
        "
      >
        <p class="text-sm text-status-warn">{{ t('components.settings.infoSetLocationSync') }}</p>
        <ButtonSetLocationSyncToMount class="mt-1" />
      </div>
    </template>

    <button class="tns-btn-primary" :disabled="isSaving" @click="save">
      {{
        isSaving
          ? t('components.pinsWizard.location.saving')
          : t('components.pinsWizard.location.save')
      }}
    </button>

    <p v-if="errorMessage" class="text-sm text-status-danger break-words">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowPathIcon, MapPinIcon } from '@heroicons/vue/24/outline';
import { apiStore } from '@/store/store';
import ButtonSetLocationSyncToMount from '@/components/mount/ButtonSetLocationSyncToMount.vue';
import {
  latitude,
  longitude,
  altitude,
  gpsError,
  getCurrentLocation,
  useLocationStore,
  syncDirection,
  ninaCoords,
  mountCoords,
  mountCoordsLoading,
  formatCoord,
} from '@/utils/location';

const emit = defineEmits(['completed']);
const { t } = useI18n();
const store = apiStore();
const locationStore = useLocationStore();

// ~100 m, same threshold LocationSettingsPins.vue uses.
const COORD_TOLERANCE = 0.001;

const isSaving = ref(false);
const errorMessage = ref('');

// The mount-coordinate endpoint only exists on PINS / TNS plugin >= 1.2.8.0.
const showCoordCards = computed(
  () => store.isPINS || store.checkVersionNewerOrEqual(store.currentTnsPluginVersion, '1.2.8.0')
);

const coordsMismatch = computed(() => {
  if (!mountCoords.value.connected || !mountCoords.value.siteLocationSupported) return false;
  const pairs = [
    [ninaCoords.value.latitude, mountCoords.value.latitude],
    [ninaCoords.value.longitude, mountCoords.value.longitude],
  ];
  return pairs.some(
    ([a, b]) => a !== null && b !== null && Math.abs(Number(a) - Number(b)) > COORD_TOLERANCE
  );
});

watch(
  () => [ninaCoords.value.latitude, ninaCoords.value.longitude],
  ([lat, lon]) => {
    if (lat !== null && lon !== null) emit('completed');
  },
  { immediate: true }
);

async function save() {
  if (isSaving.value) return;
  isSaving.value = true;
  errorMessage.value = '';
  try {
    // With TOTELESCOPE this disconnects and reconnects the mount (and PHD2),
    // which takes several seconds - hence the disabled buttons above.
    await locationStore.saveCoordinates();
    await locationStore.loadFromAstrometrySettings();
    locationStore.loadMountCoords();
  } catch (error) {
    console.error('[PinsWizard] Saving coordinates failed:', error);
    errorMessage.value = t('components.pinsWizard.location.saveFailed', { message: error.message });
  } finally {
    isSaving.value = false;
  }
}

onMounted(async () => {
  // The refs in utils/location.js are module singletons shared with SetupPage and
  // the settings panel, so never trust whatever is left in them.
  await store.fetchProfilInfos();
  await locationStore.loadFromAstrometrySettings();
  if (showCoordCards.value) {
    locationStore.loadMountCoords();
  }
});
</script>
