<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-top bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center"
      @click.self="$emit('close')"
    >
      <div
        class="w-full max-w-md bg-[#1a1f2e] border border-[#2e3650] rounded-lg overflow-hidden shadow-xl"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-[#2e3650]">
          <p class="text-sm font-semibold text-slate-200">{{ title }}</p>
          <button
            class="text-slate-500 text-sm px-2 py-1 rounded hover:text-slate-200 hover:bg-[#2e3650] transition-colors"
            @click="$emit('close')"
          >
            ✕
          </button>
        </div>

        <div class="p-4 flex flex-col gap-3">
          <label class="text-xs text-slate-400">{{ $t('common.name') }}</label>
          <input
            ref="renameInput"
            v-model="inputModel"
            type="text"
            class="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-cyan-600"
            @keydown.enter="$emit('confirm')"
            @keydown.esc="$emit('close')"
          />
          <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
        </div>

        <div class="flex justify-end gap-2 px-4 py-3 border-t border-[#2e3650]">
          <button class="default-button-gray" @click="$emit('close')">
            {{ $t('common.cancel') }}
          </button>
          <button
            class="default-button-cyan"
            :disabled="!inputValue.trim()"
            @click="$emit('confirm')"
          >
            {{ $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  error: { type: String, default: '' },
  inputValue: { type: String, default: '' },
});

const emit = defineEmits(['close', 'confirm', 'update:inputValue']);

const renameInput = ref(null);

const inputModel = computed({
  get: () => props.inputValue,
  set: (value) => emit('update:inputValue', value),
});

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) {
      return;
    }

    await nextTick();
    renameInput.value?.focus();
    renameInput.value?.select();
  }
);
</script>
