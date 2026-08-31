<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono">{{ raStr }} {{ decStr }}</span>
      <span class="text-xs text-slate-500 font-mono">{{ displayPositionAngle }}°</span>
    </template>

    <template #editor>
      <!-- Container Name -->
      <div class="seq-field-row">
        <label class="text-xs text-slate-400 shrink-0">{{ $t('common.name') }}</label>
        <TextInput
          :modelValue="item.Name ?? ''"
          inputClass="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          @change="store.setProperty(item.Id, 'Name', $event)"
        />
      </div>

      <!-- Object search -->
      <TargetSearch @target-selected="handleTargetSelected" />

      <!-- Load from favorites -->
      <div class="seq-field-row">
        <label class="text-xs text-slate-400 shrink-0">{{
          $t('components.sequence.items.dso.loadFromFavorites')
        }}</label>
        <button
          class="ml-auto flex items-center gap-1 px-2 py-1 bg-slate-700/60 border border-slate-600 rounded text-xs text-gray-200 hover:bg-slate-600"
          @click="openFavPicker"
        >
          <HeartIcon class="w-4 h-4 text-pink-400" />
        </button>
      </div>

      <!-- Load this target into the framing assistant -->
      <div class="seq-field-row">
        <label class="text-xs text-slate-400 shrink-0">{{
          $t('components.sequence.items.dso.loadIntoFraming')
        }}</label>
        <button
          class="ml-auto flex items-center gap-1 px-2 py-1 bg-slate-700/60 border border-slate-600 rounded text-xs text-gray-200 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!canLoadIntoFraming"
          @click="loadIntoFraming"
        >
          <CameraFramingIcon class="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      <!-- FITS Plate Solve -->
      <div
        v-if="
          appStore.isPINS ||
          appStore.checkVersionNewerOrEqual(appStore.currentTnsPluginVersion, '1.2.7.0')
        "
        class="seq-field-row"
      >
        <label class="text-xs text-slate-400 shrink-0">{{
          $t('components.fitsPlatesolve.buttonTitle')
        }}</label>
        <FitsPlateSolve
          class="ml-auto"
          variant="inline"
          :showFraming="false"
          :showSeqTarget="false"
          @solved="handleFitsSolved"
        />
      </div>

      <Modal :show="showFavPicker" maxWidth="max-w-lg" @close="showFavPicker = false">
        <template #header>
          <span class="text-base font-semibold">{{
            $t('components.sequence.items.dso.loadFromFavorites')
          }}</span>
        </template>
        <template #body>
          <div class="w-full">
            <table v-if="hasAnyFavTarget" class="w-full text-xs text-left border border-slate-600">
              <thead class="bg-slate-700 text-slate-300">
                <tr>
                  <th class="px-3 py-2">{{ $t('components.fav_target.table.name') }}</th>
                  <th class="px-3 py-2 hidden sm:table-cell">
                    {{ $t('components.fav_target.table.ra') }}
                  </th>
                  <th class="px-3 py-2 hidden sm:table-cell">
                    {{ $t('components.fav_target.table.dec') }}
                  </th>
                  <th class="px-3 py-2">{{ $t('components.fav_target.table.rotation') }}</th>
                  <th class="px-3 py-2">{{ $t('components.fav_target.table.load') }}</th>
                </tr>
              </thead>
              <tbody v-for="group in favTargetGroups" :key="group.key">
                <tr v-if="group.targets.length" class="bg-slate-700/50">
                  <td
                    colspan="5"
                    class="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300"
                  >
                    {{ group.label }}
                  </td>
                </tr>
                <tr
                  v-for="target in group.targets"
                  :key="target.Id"
                  class="border-t border-slate-700 hover:bg-slate-700 transition-colors"
                >
                  <td class="px-3 py-2">
                    {{ target.Name }}
                    <span
                      v-if="target.source === 'telescopius'"
                      class="ml-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full px-1.5 py-0.5"
                      >{{ $t('components.fav_target.groups.telescopius') }}</span
                    >
                    <div v-if="target.listName" class="text-slate-400">{{ target.listName }}</div>
                  </td>
                  <td class="px-3 py-2 hidden sm:table-cell">{{ target.RaString }}</td>
                  <td class="px-3 py-2 hidden sm:table-cell">{{ target.DecString }}</td>
                  <td class="px-3 py-2">{{ target.Rotation == null ? '–' : target.Rotation }}</td>
                  <td class="px-3 py-2">
                    <button
                      class="hover:text-green-400 text-slate-300"
                      @click="loadFavTarget(target)"
                    >
                      <CheckIcon class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-else class="text-sm text-slate-400">
              {{ $t('components.fav_target.no_fav') }}
            </p>
          </div>
        </template>
      </Modal>

      <!-- Target Name -->
      <div class="seq-field-row">
        <label class="text-xs text-slate-400 shrink-0">{{
          $t('components.sequence.items.dso.targetName')
        }}</label>
        <input
          type="text"
          class="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          :value="parsedTarget?.TargetName ?? item.Target?.TargetName"
          @blur="saveTargetName($event.target.value)"
          @keydown.enter="$event.target.blur()"
        />
      </div>

      <!-- Position Angle -->
      <NumberInputPicker
        :modelValue="parsedTarget?.PositionAngle ?? item.Target?.PositionAngle ?? 0"
        :label="$t('components.sequence.items.dso.positionAngle')"
        labelKey="dso-positionAngle"
        :min="0"
        :max="360"
        :step="1"
        :decimalPlaces="1"
        @change="savePositionAngle($event)"
      />

      <!-- RA -->
      <div class="text-xs text-slate-400 font-medium">
        {{ $t('components.sequence.items.center.ra') }}
      </div>
      <div class="grid grid-cols-1 @[20rem]:grid-cols-3 gap-1">
        <NumberInputPicker
          :modelValue="coords.RAHours"
          label="h"
          labelKey="dso-ra-h"
          :min="0"
          :max="23"
          :step="1"
          labelPosition="top"
          wrapperClass="w-full"
          @change="saveRa($event, coords.RAMinutes, coords.RASeconds)"
        />
        <NumberInputPicker
          :modelValue="coords.RAMinutes"
          label="m"
          labelKey="dso-ra-m"
          :min="0"
          :max="59"
          :step="1"
          labelPosition="top"
          wrapperClass="w-full"
          @change="saveRa(coords.RAHours, $event, coords.RASeconds)"
        />
        <NumberInputPicker
          :modelValue="localRASeconds ?? coords.RASeconds"
          label="s"
          labelKey="dso-ra-s"
          :min="0"
          :max="59"
          :step="0.1"
          :decimalPlaces="1"
          labelPosition="top"
          wrapperClass="w-full"
          @change="
            localRASeconds = $event;
            saveRa(coords.RAHours, coords.RAMinutes, $event);
          "
        />
      </div>

      <!-- Dec -->
      <div class="text-xs text-slate-400 font-medium pt-1">
        {{ $t('components.sequence.items.center.dec') }}
      </div>
      <div class="grid grid-cols-1 @[20rem]:grid-cols-3 gap-1">
        <NumberInputPicker
          :modelValue="decDeg"
          label="°"
          labelKey="dso-dec-d"
          :min="-90"
          :max="90"
          :step="1"
          labelPosition="top"
          wrapperClass="w-full"
          @change="saveDec($event, coords.DecMinutes, coords.DecSeconds)"
        />
        <NumberInputPicker
          :modelValue="coords.DecMinutes"
          label="m"
          labelKey="dso-dec-m"
          :min="0"
          :max="59"
          :step="1"
          labelPosition="top"
          wrapperClass="w-full"
          @change="saveDec(decDeg, $event, coords.DecSeconds)"
        />
        <NumberInputPicker
          :modelValue="localDecSeconds ?? coords.DecSeconds"
          label="s"
          labelKey="dso-dec-s"
          :min="0"
          :max="59"
          :step="0.1"
          :decimalPlaces="1"
          labelPosition="top"
          wrapperClass="w-full"
          @change="
            localDecSeconds = $event;
            saveDec(decDeg, coords.DecMinutes, $event);
          "
        />
      </div>
    </template>
  </ItemShell>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import ItemShell from './ItemShell.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import TextInput from '@/components/helpers/TextInput.vue';
import TargetSearch from '@/plugins/sequence-creator/components/TargetSearch.vue';
import Modal from '@/components/helpers/Modal.vue';
import { useSequenceV2Store } from '@/store/sequenceV2Store';
import { useFavTargetStore } from '@/store/favTargetsStore';
import { useTelescopiusFavorites } from '@/plugins/telescopius/composables/useTelescopiusFavorites';
import { apiStore } from '@/store/store';
import { HeartIcon, CheckIcon } from '@heroicons/vue/24/outline';
import FitsPlateSolve from '@/components/fitsPlatesolve/FitsPlateSolve.vue';
import CameraFramingIcon from '@/components/icons/CameraFramingIcon.vue';
import { useRouter } from 'vue-router';
import { useFramingStore } from '@/store/framingStore';
import { raDecToAltAz, degreesToHMS, degreesToDMS } from '@/utils/utils';
import {
  parseDsoTargetString,
  dsoContainerCoordinates,
  dsoContainerRaString,
  dsoContainerDecString,
} from '@/utils/sequenceTargets';

const props = defineProps({
  item: { type: Object, required: true },
});

const store = useSequenceV2Store();
const favStore = useFavTargetStore();
const appStore = apiStore();
const framingStore = useFramingStore();
const router = useRouter();
const showFavPicker = ref(false);
const { loadTelescopiusFavorites, buildTargetGroups } = useTelescopiusFavorites();

// Telescopius targets are merged in for display only - see useTelescopiusFavorites().
const favTargetGroups = computed(() => buildTargetGroups(favStore.favoriteTargets));
const hasAnyFavTarget = computed(() =>
  favTargetGroups.value.some((group) => group.targets.length > 0)
);

function openFavPicker() {
  favStore.loadFavorites();
  loadTelescopiusFavorites();
  showFavPicker.value = true;
}

function loadFavTarget(target) {
  callSetTarget(target.Ra, target.Dec, target.Name, target.Rotation ?? 0);
  showFavPicker.value = false;
}

function handleFitsSolved(result) {
  callSetTarget(result.ra, result.dec, 'FITS Plate Solve', result.rotation ?? 0);
}

const localRASeconds = ref(null);
const localDecSeconds = ref(null);

watch(
  () => props.item.Id,
  () => {
    localRASeconds.value = null;
    localDecSeconds.value = null;
  }
);

const parsedTarget = computed(() => parseDsoTargetString(props.item.Target, props.item.Name ?? ''));

const coords = computed(() => dsoContainerCoordinates(props.item));

const raStr = computed(() => dsoContainerRaString(props.item));

const decStr = computed(() => dsoContainerDecString(props.item));

const decDeg = computed(() => {
  const co = coords.value;
  const isNegative = co.NegativeDec || (co.DecDegrees ?? 0) < 0;
  const absDeg = Math.abs(co.DecDegrees ?? 0);
  return isNegative ? -absDeg : absDeg;
});

const displayPositionAngle = computed(() => {
  const value = parsedTarget.value?.PositionAngle ?? props.item.Target?.PositionAngle ?? 0;
  return Number(value).toFixed(2);
});

const currentRaDeg = computed(() => {
  const c = coords.value;
  return ((c.RAHours ?? 0) + (c.RAMinutes ?? 0) / 60 + (c.RASeconds ?? 0) / 3600) * 15;
});
const currentDecDeg = computed(() => {
  const c = coords.value;
  const isNegative = c.NegativeDec || (c.DecDegrees ?? 0) < 0;
  const abs = Math.abs(c.DecDegrees ?? 0) + (c.DecMinutes ?? 0) / 60 + (c.DecSeconds ?? 0) / 3600;
  return isNegative ? -abs : abs;
});

function callSetTarget(raDeg, decDeg, name, rotation) {
  store.setDsoTarget(
    props.item.Id,
    name ?? parsedTarget.value?.TargetName ?? props.item.Name ?? '',
    raDeg ?? currentRaDeg.value,
    decDeg ?? currentDecDeg.value,
    rotation ?? parsedTarget.value?.PositionAngle ?? 0
  );
}

function saveRa(h, m, s) {
  callSetTarget((Number(h) + Number(m) / 60 + Number(s) / 3600) * 15, null, null, null);
}

function saveDec(d, m, s) {
  const sign = Number(d) < 0 ? -1 : 1;
  callSetTarget(null, sign * (Math.abs(Number(d)) + Number(m) / 60 + Number(s) / 3600), null, null);
}

function saveTargetName(name) {
  callSetTarget(null, null, name, null);
}

function savePositionAngle(rotation) {
  callSetTarget(null, null, null, rotation);
}

// Read-only direction: copy this container's target into the framing assistant.
// Nothing is written back to the sequence and no hardware is moved.
const canLoadIntoFraming = computed(() => parsedTarget.value !== null);

function loadIntoFraming() {
  if (!canLoadIntoFraming.value) return;

  const ra = currentRaDeg.value;
  const dec = currentDecDeg.value;
  const name = parsedTarget.value?.TargetName || props.item.Name || '';

  framingStore.RAangle = ra;
  framingStore.DECangle = dec;
  // degreesToHMS/DMS so slewAndCenter.vue can parse the strings back.
  framingStore.RAangleString = degreesToHMS(ra);
  framingStore.DECangleString = degreesToDMS(dec);
  framingStore.rotationAngle = parsedTarget.value?.PositionAngle ?? 0;
  framingStore.isMosaicMode = false;
  framingStore.selectedItem = { Name: name, RA: ra, Dec: dec };

  const { altitude, azimuth } = raDecToAltAz(
    ra,
    dec,
    appStore.profileInfo?.AstrometrySettings?.Latitude ?? 0,
    appStore.profileInfo?.AstrometrySettings?.Longitude ?? 0
  );
  framingStore.ALTangle = altitude;
  framingStore.AZangle = azimuth;
  framingStore.ALTangleString = altitude.toFixed(3);
  framingStore.AZangleString = azimuth.toFixed(3);

  framingStore.framingReloadKey++;
  router.push('/framing');
}

async function handleTargetSelected(targetData) {
  const ra = targetData.originalData?.RA;
  const dec = targetData.originalData?.Dec;
  await store.setDsoTarget(
    props.item.Id,
    targetData.name || parsedTarget.value?.TargetName || props.item.Name || '',
    ra ?? currentRaDeg.value,
    dec ?? currentDecDeg.value,
    parsedTarget.value?.PositionAngle ?? 0
  );
}
</script>
