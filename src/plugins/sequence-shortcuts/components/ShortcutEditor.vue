<template>
  <div class="bg-gray-800 rounded-lg p-6 space-y-6">
    <h3 class="text-xl font-semibold text-white mb-4">
      {{ isEditing ? $t('plugins.shortcuts.editShortcut') : $t('plugins.shortcuts.newShortcut') }}
    </h3>

    <!-- Phrase input -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">
        {{ $t('plugins.shortcuts.phrase') }}
      </label>
      <input
        v-model="formData.phrase"
        type="text"
        class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        :placeholder="$t('plugins.shortcuts.phrasePlaceholder')"
      />
    </div>

    <!-- Sequence selector -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">
        {{ $t('plugins.shortcuts.sequenceFile') }}
      </label>
      <div class="flex gap-2">
        <select
          v-model="formData.sequencePath"
          class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="shortcutsStore.isLoadingSequences"
        >
          <option value="">{{ $t('plugins.shortcuts.selectSequence') }}</option>
          <option
            v-for="sequence in shortcutsStore.availableSequences"
            :key="sequence.path"
            :value="sequence.path"
          >
            {{ sequence.name }}
          </option>
        </select>
        <button
          @click="refreshSequences"
          :disabled="shortcutsStore.isLoadingSequences"
          class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :title="$t('plugins.shortcuts.refreshSequences')"
        >
          <ArrowPathIcon
            class="w-5 h-5"
            :class="{ 'animate-spin': shortcutsStore.isLoadingSequences }"
          />
        </button>
      </div>
    </div>

    <!-- Auto-start toggle -->
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-300">
        {{ $t('plugins.shortcuts.autoStart') }}
      </label>
      <button
        @click="formData.autoStart = !formData.autoStart"
        :class="formData.autoStart ? 'bg-blue-500' : 'bg-gray-600'"
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span
          :class="formData.autoStart ? 'translate-x-6' : 'translate-x-1'"
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        />
      </button>
    </div>

    <!-- Icon selector -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">
        {{ $t('plugins.shortcuts.icon') }}
      </label>
      <div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
        <button
          v-for="(icon, key) in availableIcons"
          :key="key"
          @click="formData.icon = key"
          :class="[
            formData.icon === key
              ? 'bg-blue-500 ring-2 ring-blue-400'
              : 'bg-gray-700 hover:bg-gray-600',
          ]"
          class="p-3 rounded-lg transition-all duration-200"
        >
          <component :is="icon" class="w-6 h-6 text-white mx-auto" />
        </button>
      </div>
    </div>

    <!-- Color selector -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">
        {{ $t('plugins.shortcuts.color') }}
      </label>
      <div class="grid grid-cols-5 sm:grid-cols-10 gap-2">
        <button
          v-for="(colorClass, colorName) in availableColors"
          :key="colorName"
          @click="formData.color = colorName"
          :class="[
            colorClass,
            formData.color === colorName ? 'ring-4 ring-white ring-opacity-50 scale-110' : '',
          ]"
          class="w-10 h-10 rounded-full transition-all duration-200 hover:scale-105"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 pt-4">
      <button
        @click="save"
        :disabled="!isFormValid"
        class="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isEditing ? $t('plugins.shortcuts.update') : $t('plugins.shortcuts.create') }}
      </button>
      <button
        @click="cancel"
        class="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
      >
        {{ $t('plugins.shortcuts.cancel') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
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
} from '@heroicons/vue/24/outline';

const props = defineProps({
  shortcut: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['save', 'cancel']);

const shortcutsStore = useShortcutsStore();

const isEditing = computed(() => !!props.shortcut);

const formData = ref({
  phrase: '',
  sequencePath: '',
  autoStart: false,
  color: 'blue',
  icon: 'BoltIcon',
});

const availableIcons = {
  BoltIcon,
  SparklesIcon,
  MoonIcon,
  StarIcon,
  CameraIcon,
  ArrowPathIcon,
  RocketLaunchIcon,
  GlobeAltIcon,
};

const availableColors = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  gray: 'bg-gray-500',
  indigo: 'bg-indigo-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
};

const isFormValid = computed(() => {
  return formData.value.phrase.trim() !== '' && formData.value.sequencePath !== '';
});

const refreshSequences = async () => {
  await shortcutsStore.loadAvailableSequences();
};

const save = () => {
  if (!isFormValid.value) return;

  emit('save', { ...formData.value });
};

const cancel = () => {
  emit('cancel');
};

// Initialize form with existing data if editing
watch(
  () => props.shortcut,
  (newShortcut) => {
    if (newShortcut) {
      formData.value = {
        phrase: newShortcut.phrase || '',
        sequencePath: newShortcut.sequencePath || '',
        autoStart: newShortcut.autoStart || false,
        color: newShortcut.color || 'blue',
        icon: newShortcut.icon || 'BoltIcon',
      };
    } else {
      formData.value = {
        phrase: '',
        sequencePath: '',
        autoStart: false,
        color: 'blue',
        icon: 'BoltIcon',
      };
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (shortcutsStore.availableSequences.length === 0) {
    refreshSequences();
  }
});
</script>
