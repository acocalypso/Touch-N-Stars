<template>
  <button
    @click="executeShortcut"
    :disabled="isExecuting"
    :class="buttonColorClass"
    class="relative group flex flex-col items-center justify-center gap-3 rounded-xl p-6 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[140px]"
  >
    <!-- Icon -->
    <component
      :is="iconComponent"
      class="w-12 h-12 text-white"
      :class="{ 'animate-pulse': isExecuting }"
    />

    <!-- Phrase -->
    <span class="text-white font-medium text-center text-sm leading-tight px-2">
      {{ shortcut.phrase }}
    </span>

    <!-- Auto-start indicator -->
    <div
      v-if="shortcut.autoStart"
      class="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full p-1.5"
      :title="$t('plugins.shortcuts.autoStartEnabled')"
    >
      <PlayIcon class="w-4 h-4 text-white" />
    </div>

    <!-- Loading spinner -->
    <div
      v-if="isExecuting"
      class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl backdrop-blur-sm"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  </button>
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
} from '@heroicons/vue/24/outline';

const props = defineProps({
  shortcut: {
    type: Object,
    required: true,
  },
});

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
</script>
