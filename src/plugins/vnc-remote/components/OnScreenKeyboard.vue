<template>
  <div
    class="absolute left-2 right-2 z-40 rounded-lg border border-gray-700 bg-gray-900/95 p-2 shadow-2xl backdrop-blur-sm"
    :class="nativeKeyboardOpen ? 'bottom-14' : 'bottom-2'"
  >
    <div class="mb-2 flex items-center gap-2">
      <input
        v-model="keyboardInput"
        type="text"
        class="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        placeholder="Type text to send to remote"
        @keydown.enter.prevent="sendKeyboardInput"
      />
      <button
        class="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        :disabled="!keyboardInput"
        @click="sendKeyboardInput"
      >
        Send
      </button>
    </div>

    <div class="grid grid-cols-12 gap-1 text-sm">
      <button
        v-for="key in keyboardKeys"
        :key="key.id"
        class="rounded border border-gray-700 bg-gray-800 px-1 py-2 text-gray-200 hover:bg-gray-700"
        :class="[
          key.className,
          {
            'border-indigo-500 text-indigo-300': key.action === 'shift' && shiftEnabled,
          },
        ]"
        @click="handleKeyboardKey(key)"
      >
        {{ key.label || getPrintableLabel(key) }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  nativeKeyboardOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['send-keysym', 'send-printable']);

const shiftEnabled = ref(false);
const keyboardInput = ref('');

const keyboardKeys = [
  { id: 'esc', label: 'Esc', action: 'keysym', keysym: 0xff1b, className: 'col-span-2' },
  { id: 'tab', label: 'Tab', action: 'keysym', keysym: 0xff09, className: 'col-span-2' },
  { id: 'bs', label: 'Back', action: 'keysym', keysym: 0xff08, className: 'col-span-2' },
  { id: 'up', label: 'Up', action: 'keysym', keysym: 0xff52, className: 'col-span-2' },
  { id: 'left', label: 'Left', action: 'keysym', keysym: 0xff51, className: 'col-span-2' },
  { id: 'right', label: 'Right', action: 'keysym', keysym: 0xff53, className: 'col-span-2' },

  { id: 'q', base: 'q', shift: 'Q', action: 'print', className: 'col-span-1' },
  { id: 'w', base: 'w', shift: 'W', action: 'print', className: 'col-span-1' },
  { id: 'e', base: 'e', shift: 'E', action: 'print', className: 'col-span-1' },
  { id: 'r', base: 'r', shift: 'R', action: 'print', className: 'col-span-1' },
  { id: 't', base: 't', shift: 'T', action: 'print', className: 'col-span-1' },
  { id: 'y', base: 'y', shift: 'Y', action: 'print', className: 'col-span-1' },
  { id: 'u', base: 'u', shift: 'U', action: 'print', className: 'col-span-1' },
  { id: 'i', base: 'i', shift: 'I', action: 'print', className: 'col-span-1' },
  { id: 'o', base: 'o', shift: 'O', action: 'print', className: 'col-span-1' },
  { id: 'p', base: 'p', shift: 'P', action: 'print', className: 'col-span-1' },
  { id: 'down', label: 'Down', action: 'keysym', keysym: 0xff54, className: 'col-span-2' },

  { id: 'a', base: 'a', shift: 'A', action: 'print', className: 'col-span-1' },
  { id: 's', base: 's', shift: 'S', action: 'print', className: 'col-span-1' },
  { id: 'd', base: 'd', shift: 'D', action: 'print', className: 'col-span-1' },
  { id: 'f', base: 'f', shift: 'F', action: 'print', className: 'col-span-1' },
  { id: 'g', base: 'g', shift: 'G', action: 'print', className: 'col-span-1' },
  { id: 'h', base: 'h', shift: 'H', action: 'print', className: 'col-span-1' },
  { id: 'j', base: 'j', shift: 'J', action: 'print', className: 'col-span-1' },
  { id: 'k', base: 'k', shift: 'K', action: 'print', className: 'col-span-1' },
  { id: 'l', base: 'l', shift: 'L', action: 'print', className: 'col-span-1' },
  { id: 'enter', label: 'Enter', action: 'keysym', keysym: 0xff0d, className: 'col-span-3' },

  { id: 'shift', label: 'Shift', action: 'shift', className: 'col-span-2' },
  { id: 'z', base: 'z', shift: 'Z', action: 'print', className: 'col-span-1' },
  { id: 'x', base: 'x', shift: 'X', action: 'print', className: 'col-span-1' },
  { id: 'c', base: 'c', shift: 'C', action: 'print', className: 'col-span-1' },
  { id: 'v', base: 'v', shift: 'V', action: 'print', className: 'col-span-1' },
  { id: 'b', base: 'b', shift: 'B', action: 'print', className: 'col-span-1' },
  { id: 'n', base: 'n', shift: 'N', action: 'print', className: 'col-span-1' },
  { id: 'm', base: 'm', shift: 'M', action: 'print', className: 'col-span-1' },
  { id: 'space', label: 'Space', action: 'keysym', keysym: 0x20, className: 'col-span-3' },
];

const getPrintableLabel = (key) => {
  if (key.action !== 'print') return key.label || '';
  return shiftEnabled.value ? key.shift || key.base : key.base;
};

const handleKeyboardKey = (key) => {
  if (!key) return;

  if (key.action === 'shift') {
    shiftEnabled.value = !shiftEnabled.value;
    return;
  }

  if (key.action === 'keysym') {
    emit('send-keysym', key.keysym);
    return;
  }

  if (key.action === 'print') {
    const character = shiftEnabled.value ? key.shift || key.base : key.base;
    emit('send-printable', character);
    if (shiftEnabled.value) {
      shiftEnabled.value = false;
    }
  }
};

const sendKeyboardInput = () => {
  if (!keyboardInput.value) return;
  for (const character of keyboardInput.value) {
    emit('send-printable', character);
  }
  keyboardInput.value = '';
};
</script>
