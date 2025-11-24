<template>
  <div
    @click="executeShortcut"
    :class="[
      buttonColorClass,
      { 'opacity-50 cursor-not-allowed': isExecuting, 'cursor-pointer': !isExecuting },
    ]"
    class="w-full relative group flex flex-row items-center justify-start gap-4 rounded-xl p-4 pr-20 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
  >
    <!-- Icon -->
    <component
      :is="iconComponent"
      class="w-8 h-8 text-white flex-shrink-0"
      :class="{ 'animate-pulse': isExecuting }"
    />

    <!-- Phrase -->
    <span class="text-white font-medium text-left text-base leading-tight">
      {{ shortcut.phrase }}
    </span>

    <!-- Execution type indicator -->
    <div
      class="absolute top-1/2 -translate-y-1/2 right-12 bg-white/20 backdrop-blur-sm rounded-full p-1.5"
      :title="
        shortcut.autoStart
          ? $t('plugins.shortcuts.autoStartEnabled')
          : $t('plugins.shortcuts.manualExecution')
      "
    >
      <PlayIcon v-if="shortcut.autoStart" class="w-5 h-5 text-white" />
      <HandRaisedIcon v-else class="w-5 h-5 text-white" />
    </div>

    <!-- Menu button -->
    <button
      @click.stop="handleMenuClick"
      class="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-colors z-10"
      :title="$t('plugins.shortcuts.menu')"
    >
      <EllipsisVerticalIcon class="w-5 h-5 text-white" />
    </button>

    <!-- Loading spinner -->
    <div
      v-if="isExecuting"
      class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl backdrop-blur-sm"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useShortcutsStore } from '../store/shortcutsStore';
import {
  BoltIcon,
  SparklesIcon,
  MoonIcon,
  StarIcon,
  CameraIcon,
  ArrowPathIcon,
  RocketLaunchIcon,
  GlobeAltIcon,
  PlayIcon,
  HandRaisedIcon,
  EllipsisVerticalIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps({
  shortcut: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['menu-click']);

const shortcutsStore = useShortcutsStore();
const isExecuting = ref(false);

// Map icon names to components
const iconMap = {
  BoltIcon,
  SparklesIcon,
  MoonIcon,
  StarIcon,
  CameraIcon,
  ArrowPathIcon,
  RocketLaunchIcon,
  GlobeAltIcon,
};

const iconComponent = computed(() => {
  return iconMap[props.shortcut.icon] || BoltIcon;
});

// Color classes map
const colorClasses = {
  blue: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
  green: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
  yellow: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700',
  red: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
  purple: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700',
  orange: 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700',
  gray: 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700',
  indigo: 'bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700',
  pink: 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700',
  teal: 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700',
};

const buttonColorClass = computed(() => {
  return colorClasses[props.shortcut.color] || colorClasses.blue;
});

const executeShortcut = async () => {
  if (isExecuting.value) return;

  isExecuting.value = true;
  try {
    await shortcutsStore.executeShortcut(props.shortcut.id);
  } finally {
    isExecuting.value = false;
  }
};

const handleMenuClick = () => {
  emit('menu-click', props.shortcut.id);
};
</script>
