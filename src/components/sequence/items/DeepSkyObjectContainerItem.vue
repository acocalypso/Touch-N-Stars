<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono">{{ raStr }} {{ decStr }}</span>
    </template>

    <template #editor>
      <!-- Object search -->
      <TargetSearch @target-selected="handleTargetSelected" />

      <!-- Target Name -->
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.dso.targetName')
        }}</label>
        <input
          type="text"
          class="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          :value="item.Target?.TargetName"
          @blur="saveTargetName($event.target.value)"
          @keydown.enter="$event.target.blur()"
        />
      </div>

      <!-- Position Angle -->
      <NumberInputPicker
        :modelValue="item.Target?.PositionAngle ?? 0"
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
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-1">
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
          :modelValue="coords.RASeconds"
          label="s"
          labelKey="dso-ra-s"
          :min="0"
          :max="59"
          :step="0.1"
          :decimalPlaces="1"
          labelPosition="top"
          wrapperClass="w-full"
          @change="saveRa(coords.RAHours, coords.RAMinutes, $event)"
        />
      </div>

      <!-- Dec -->
      <div class="text-xs text-slate-400 font-medium pt-1">
        {{ $t('components.sequence.items.center.dec') }}
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-1">
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
          :modelValue="coords.DecSeconds"
          label="s"
          labelKey="dso-dec-s"
          :min="0"
          :max="59"
          :step="0.1"
          :decimalPlaces="1"
          labelPosition="top"
          wrapperClass="w-full"
          @change="saveDec(decDeg, coords.DecMinutes, $event)"
        />
      </div>
    </template>
  </ItemShell>
</template>

<script setup>
import { computed } from 'vue';
import ItemShell from './ItemShell.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import TargetSearch from '@/plugins/sequence-creator/components/TargetSearch.vue';
import { useSequenceV2Store } from '@/store/sequenceV2Store';

const props = defineProps({
  item: { type: Object, required: true },
});

const store = useSequenceV2Store();
const coords = computed(() => props.item.Target?.InputCoordinates ?? {});

const raStr = computed(() => {
  const co = coords.value;
  if (!co.RAHours && co.RAHours !== 0) return '';
  return `${String(co.RAHours).padStart(2, '0')}:${String(co.RAMinutes).padStart(2, '0')}:${String(Math.round(co.RASeconds)).padStart(2, '0')}`;
});

const decStr = computed(() => {
  const co = coords.value;
  if (!co.DecDegrees && co.DecDegrees !== 0) return '';
  const sign = co.NegativeDec ? '-' : '+';
  return `${sign}${String(co.DecDegrees).padStart(2, '0')}°${String(co.DecMinutes).padStart(2, '0')}'${String(Math.round(co.DecSeconds)).padStart(2, '0')}"`;
});

const decDeg = computed(() =>
  coords.value.NegativeDec ? -coords.value.DecDegrees : coords.value.DecDegrees
);

const currentRaDeg = computed(() => {
  const c = coords.value;
  return ((c.RAHours ?? 0) + (c.RAMinutes ?? 0) / 60 + (c.RASeconds ?? 0) / 3600) * 15;
});
const currentDecDeg = computed(() => {
  const c = coords.value;
  const abs = (c.DecDegrees ?? 0) + (c.DecMinutes ?? 0) / 60 + (c.DecSeconds ?? 0) / 3600;
  return c.NegativeDec ? -abs : abs;
});

function callSetTarget(raDeg, decDeg, name, rotation) {
  store.setDsoTarget(
    props.item.Id,
    name ?? props.item.Target?.TargetName ?? '',
    raDeg ?? currentRaDeg.value,
    decDeg ?? currentDecDeg.value,
    rotation ?? props.item.Target?.PositionAngle ?? 0
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

async function handleTargetSelected(targetData) {
  const ra = targetData.originalData?.RA;
  const dec = targetData.originalData?.Dec;
  await store.setDsoTarget(
    props.item.Id,
    targetData.name || props.item.Target?.TargetName || '',
    ra ?? currentRaDeg.value,
    dec ?? currentDecDeg.value,
    props.item.Target?.PositionAngle ?? 0
  );
}
</script>
