<template>
  <div class="flex flex-col gap-1 w-full border border-gray-600 rounded-lg p-3">
    <!-- Focuser -->
    <div class="flex flex-row w-full items-center">
      <label for="indi-focuser" class="mr-3 text-gray-200">
        {{ $t('components.connectEquipment.focuser.name') }}
      </label>
      <select
        id="indi-focuser"
        v-model="selectedFocuser"
        @change="onFocuserChange"
        class="default-select min-w-40 ml-auto"
      >
        <option value="" disabled>{{ $t('common.select') }}</option>
        <option v-for="item in focuser" :key="item.Name" :value="item.Name">
          {{ item.Label }}
        </option>
      </select>
    </div>

    <!-- Filterwheel -->
    <div class="flex flex-row w-full items-center">
      <label for="indi-filterwheel" class="mr-3 text-gray-200">
        {{ $t('components.connectEquipment.filter.name') }}
      </label>
      <select
        id="indi-filterwheel"
        v-model="selectedFilterwheel"
        @change="onFilterwheelChange"
        class="default-select min-w-40 ml-auto"
      >
        <option value="" disabled>{{ $t('common.select') }}</option>
        <option v-for="item in filterwheel" :key="item.Name" :value="item.Name">
          {{ item.Label }}
        </option>
      </select>
    </div>

    <!-- Rotator -->
    <div class="flex flex-row w-full items-center">
      <label for="indi-rotator" class="mr-3 text-gray-200">
        {{ $t('components.connectEquipment.rotator.name') }}
      </label>
      <select
        id="indi-rotator"
        v-model="selectedRotator"
        @change="onRotatorChange"
        class="default-select min-w-40 ml-auto"
      >
        <option value="" disabled>{{ $t('common.select') }}</option>
        <option v-for="item in rotator" :key="item.Name" :value="item.Name">
          {{ item.Label }}
        </option>
      </select>
    </div>

    <!-- Telescope -->
    <div class="flex flex-row w-full items-center">
      <label for="indi-telescope" class="mr-3 text-gray-200">
        {{ $t('components.connectEquipment.mount.name') }}
      </label>
      <select
        id="indi-telescope"
        v-model="selectedTelescope"
        @change="onTelescopeChange"
        class="default-select min-w-40 ml-auto"
      >
        <option value="" disabled>{{ $t('common.select') }}</option>
        <option v-for="item in telescope" :key="item.Name" :value="item.Name">
          {{ item.Label }}
        </option>
      </select>
    </div>

    <!-- Weather -->
    <div class="flex flex-row w-full items-center">
      <label for="indi-weather" class="mr-3 text-gray-200">
        {{ $t('components.connectEquipment.weather.name') }}
      </label>
      <select
        id="indi-weather"
        v-model="selectedWeather"
        @change="onWeatherChange"
        class="default-select min-w-40 ml-auto"
      >
        <option value="" disabled>{{ $t('common.select') }}</option>
        <option v-for="item in weather" :key="item.Name" :value="item.Name">
          {{ item.Label }}
        </option>
      </select>
    </div>

    <!-- Switches -->
    <div class="flex flex-row w-full items-center">
      <label for="indi-switches" class="mr-3 text-gray-200">
        {{ $t('components.connectEquipment.switch.name') }}
      </label>
      <select
        id="indi-switches"
        v-model="selectedSwitches"
        @change="onSwitchesChange"
        class="default-select min-w-40 ml-auto"
      >
        <option value="" disabled>{{ $t('common.select') }}</option>
        <option v-for="item in switches" :key="item.Name" :value="item.Name">
          {{ item.Label }}
        </option>
      </select>
    </div>

    <!-- Flatpanel -->
    <div class="flex flex-row w-full items-center">
      <label for="indi-flatpanel" class="mr-3 text-gray-200">
        {{ $t('components.connectEquipment.flat.name') }}
      </label>
      <select
        id="indi-flatpanel"
        v-model="selectedFlatpanel"
        @change="onFlatpanelChange"
        class="default-select min-w-40 ml-auto"
      >
        <option value="" disabled>{{ $t('common.select') }}</option>
        <option v-for="item in flatpanel" :key="item.Name" :value="item.Name">
          {{ item.Label }}
        </option>
      </select>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue';
import apiPinsService from '@/services/apiPinsService';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

const store = apiStore();
const focuser = ref([]);
const filterwheel = ref([]);
const rotator = ref([]);
const telescope = ref([]);
const weather = ref([]);
const switches = ref([]);
const flatpanel = ref([]);

const selectedFocuser = ref('');
const selectedFilterwheel = ref('');
const selectedRotator = ref('');
const selectedTelescope = ref('');
const selectedWeather = ref('');
const selectedSwitches = ref('');
const selectedFlatpanel = ref('');

const onFocuserChange = async () => {
  try {
    await apiService.profileChangeValue('FocuserSettings-IndiDriver', selectedFocuser.value);
    console.log('[SelectIndi] Focuser selected:', selectedFocuser.value);
  } catch (error) {
    console.error('[SelectIndi] Error Focuser selection:', error);
  }
};

const onFilterwheelChange = async () => {
  try {
    await apiService.profileChangeValue(
      'FilterWheelSettings-IndiDriver',
      selectedFilterwheel.value
    );
    console.log('[SelectIndi] Filterwheel selected:', selectedFilterwheel.value);
  } catch (error) {
    console.error('[SelectIndi] Error Filterwheel selection:', error);
  }
};

const onRotatorChange = async () => {
  try {
    await apiService.profileChangeValue('RotatorSettings-IndiDriver', selectedRotator.value);
    console.log('[SelectIndi] Rotator selected:', selectedRotator.value);
  } catch (error) {
    console.error('[SelectIndi] Error Rotator selection:', error);
  }
};

const onTelescopeChange = async () => {
  try {
    await apiService.profileChangeValue('TelescopeSettings-IndiDriver', selectedTelescope.value);
    console.log('[SelectIndi] Telescope selected:', selectedTelescope.value);
  } catch (error) {
    console.error('[SelectIndi] Error Telescope selection:', error);
  }
};

const onWeatherChange = async () => {
  try {
    await apiService.profileChangeValue('WeatherSettings-IndiDriver', selectedWeather.value);
    console.log('[SelectIndi] Weather selected:', selectedWeather.value);
  } catch (error) {
    console.error('[SelectIndi] Error Weather selection:', error);
  }
};

const onSwitchesChange = async () => {
  try {
    await apiService.profileChangeValue('SwitchSettings-IndiDriver', selectedSwitches.value);
    console.log('[SelectIndi] Switches selected:', selectedSwitches.value);
  } catch (error) {
    console.error('[SelectIndi] Error Switches selection:', error);
  }
};

const onFlatpanelChange = async () => {
  try {
    await apiService.profileChangeValue('FlatPanelSettings-IndiDriver', selectedFlatpanel.value);
    console.log('[SelectIndi] Flatpanel selected:', selectedFlatpanel.value);
  } catch (error) {
    console.error('[SelectIndi] Error Flatpanel selection:', error);
  }
};

onMounted(async () => {
  try {
    const [
      focuserResponse,
      filterwheelResponse,
      rotatorResponse,
      telescopeResponse,
      weatherResponse,
      switchesResponse,
      flatpanelResponse,
    ] = await Promise.all([
      apiPinsService.getINDIDeviceList('focuser'),
      apiPinsService.getINDIDeviceList('filterwheel'),
      apiPinsService.getINDIDeviceList('rotator'),
      apiPinsService.getINDIDeviceList('telescope'),
      apiPinsService.getINDIDeviceList('weather'),
      apiPinsService.getINDIDeviceList('switches'),
      apiPinsService.getINDIDeviceList('flatpanel'),
    ]);

    focuser.value = focuserResponse.Response;
    filterwheel.value = filterwheelResponse.Response;
    rotator.value = rotatorResponse.Response;
    telescope.value = telescopeResponse.Response;
    weather.value = weatherResponse.Response;
    switches.value = switchesResponse.Response;
    flatpanel.value = flatpanelResponse.Response;

    // Set saved values from store as defaults
    selectedFocuser.value = store.profileInfo?.FocuserSettings?.IndiDriver || '';
    selectedFilterwheel.value = store.profileInfo?.FilterWheelSettings?.IndiDriver || '';
    selectedRotator.value = store.profileInfo?.RotatorSettings?.IndiDriver || '';
    selectedTelescope.value = store.profileInfo?.TelescopeSettings?.IndiDriver || '';
    selectedWeather.value = store.profileInfo?.WeatherDataSettings?.IndiDriver || '';
    selectedSwitches.value = store.profileInfo?.SwitchSettings?.IndiDriver || '';
    selectedFlatpanel.value = store.profileInfo?.FlatDeviceSettings?.IndiDriver || '';

    console.log('[SelectIndi] All INDI devices loaded');
  } catch (error) {
    console.error('[SelectIndi] Error fetching INDI devices:', error);
  }
});
</script>
