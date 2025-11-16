<template>
  <div :class="['relative', props.fullWidth ? 'w-full' : 'mr-2']">
    <button
      :disabled="buttonDisabled"
      :style="props.fullWidth ? { width: '100%' } : { minWidth: buttonMinWidth }"
      :class="[
        'bg-gray-700/50 text-white font-bold py-1 px-2 rounded-md border border-gray-400 z-50 transition',
        props.fullWidth ? 'w-full justify-between' : '',
        buttonDisabled
          ? 'bg-gray-800/50 opacity-50 cursor-not-allowed'
          : 'hover:bg-gray-700 cursor-pointer',
      ]"
      @click="toggleTargetList"
    >
      <span class="flex justify-between items-center w-full">
        {{ props.currentOption?.label || props.placeholder }}
        <ChevronDoubleDownIcon
          v-show="props.availableOptions.length > 1 && props.canOpen"
          class="inline-block w-4 h-4 ml-1"
        />
      </span>
    </button>
    <ul
      v-if="showTargetList"
      :style="props.fullWidth ? {} : { minWidth: buttonMinWidth }"
      class="absolute left-0 mt-1 w-full max-h-48 overflow-auto bg-gray-900/90 border border-gray-500 rounded-md shadow-lg backdrop-blur-sm z-50"
    >
      <li
        v-for="item in props.availableOptions"
        :key="item.label"
        @click="selectTarget(item)"
        class="px-3 py-2 text-sm hover:bg-gray-700 cursor-pointer"
      >
        <div class="flex items-center justify-between space-x-3">
          <span class="truncate">{{ item.label }}</span>
          <span class="bg-gray-600 px-2 rounded-md shrink-0">{{ item.count }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ChevronDoubleDownIcon } from '@heroicons/vue/24/solid';

const props = defineProps({
  availableOptions: { type: Array, default: () => [] },
  currentOption: { type: Object, default: null },
  placeholder: { type: String, default: 'Empty' },
  canOpen: { type: Boolean, default: true },
  fullWidth: { type: Boolean, default: false },
});

const showTargetList = ref(false);

const emit = defineEmits(['optionSelected', 'open', 'close']);

const buttonMinWidth = computed(() => {
  const avail = props.availableOptions || [];
  if (avail.length === 0) return '14ch';
  const lengths = avail.map((t) => (t?.label ? t.label.length : 0));
  const currentLength = props.currentOption?.label?.length ?? 0;
  const longest = Math.max(currentLength, ...lengths);
  return `${Math.max(14, longest + 4)}ch`;
});

const buttonDisabled = computed(() => {
  return !(props.availableOptions && props.availableOptions.length > 1) || !props.canOpen;
});

const closeList = () => {
  if (!showTargetList.value) return;
  showTargetList.value = false;
};

watch(
  () => props.canOpen,
  (value) => {
    if (!value) closeList();
  }
);

watch(showTargetList, (value) => {
  emit(value ? 'open' : 'close');
});

const toggleTargetList = () => {
  if (buttonDisabled.value) return;
  showTargetList.value = !showTargetList.value;
};

const selectTarget = (item) => {
  emit('optionSelected', item);
  closeList();
};

defineExpose({
  closeList,
});
</script>
