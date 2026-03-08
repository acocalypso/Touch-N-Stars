<template>
  <ItemShell :item="item">
    <template #summary>
      <template v-if="exposure">
        <span class="text-xs text-slate-400 font-mono">{{ exposure.ExposureTime }}s</span>
        <span class="text-xs text-slate-500">G{{ exposure.Gain }}</span>
        <span class="text-xs text-slate-500">{{ exposure.ImageType }}</span>
      </template>
      <span v-if="loopIterations" class="text-xs text-slate-400 font-mono"
        >× {{ loopIterations }}</span
      >
    </template>

    <template v-if="exposure && loopCondition" #editor>
      <NumberInputPicker
        :modelValue="loopIterations"
        :label="$t('components.sequence.items.takeManyExposures.iterations')"
        labelKey="tme-iterations"
        :min="1"
        :max="9999"
        :step="1"
        :decimalPlaces="0"
        @change="saveLoop('Iterations', $event)"
      />
      <NumberInputPicker
        :modelValue="exposure.ExposureTime"
        :label="$t('components.sequence.items.takeExposure.exposureTime')"
        labelKey="tme-exposureTime"
        :min="0"
        :max="3600"
        :step="0.1"
        :decimalPlaces="1"
        @change="saveExposure('ExposureTime', $event)"
      />
      <NumberInputPicker
        :modelValue="exposure.Gain"
        :label="$t('components.sequence.items.takeExposure.gain')"
        labelKey="tme-gain"
        :min="0"
        :max="1000"
        :step="1"
        @change="saveExposure('Gain', $event)"
      />
      <NumberInputPicker
        :modelValue="exposure.Offset"
        :label="$t('components.sequence.items.takeExposure.offset')"
        labelKey="tme-offset"
        :min="-1"
        :max="1000"
        :step="1"
        @change="saveExposure('Offset', $event)"
      />

      <!-- Binning -->
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.takeExposure.binning')
        }}</label>
        <select
          class="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          :value="binningValue"
          @change="saveExposure('Binning', $event.target.value)"
        >
          <option value='{"X":1,"Y":1}'>1x1</option>
          <option value='{"X":2,"Y":2}'>2x2</option>
          <option value='{"X":3,"Y":3}'>3x3</option>
          <option value='{"X":4,"Y":4}'>4x4</option>
        </select>
      </div>

      <!-- Image Type -->
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.takeExposure.imageType')
        }}</label>
        <select
          class="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          :value="exposure.ImageType"
          @change="saveExposure('ImageType', $event.target.value)"
        >
          <option value="LIGHT">LIGHT</option>
          <option value="DARK">DARK</option>
          <option value="FLAT">FLAT</option>
          <option value="BIAS">BIAS</option>
        </select>
      </div>
    </template>
  </ItemShell>
</template>

<script setup>
import { computed } from 'vue';
import ItemShell from './ItemShell.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import { useSequenceV2Store } from '@/store/sequenceV2Store';

const props = defineProps({
  item: { type: Object, required: true },
});

const store = useSequenceV2Store();

const exposure = computed(() => props.item.Items?.[0] ?? null);
const loopCondition = computed(() => props.item.Conditions?.[0] ?? null);
const loopIterations = computed(() => loopCondition.value?.Iterations ?? null);

const binningValue = computed(() => {
  const b = exposure.value?.Binning;
  if (!b) return '{"X":1,"Y":1}';
  return JSON.stringify({ X: b.X, Y: b.Y });
});

function saveExposure(key, value) {
  if (exposure.value?.Id) {
    store.setProperty(exposure.value.Id, key, value);
  }
}

function saveLoop(key, value) {
  if (loopCondition.value?.Id) {
    store.setProperty(loopCondition.value.Id, key, value);
  }
}
</script>
