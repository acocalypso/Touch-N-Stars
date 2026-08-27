<template>
  <div class="flex flex-col sm:flex-row sm:items-center gap-2">
    <span class="text-gray-300 sm:w-52 sm:shrink-0 text-sm">{{ label }}</span>
    <div class="flex flex-col gap-1 w-full sm:flex-1 sm:max-w-sm">
      <input
        type="password"
        autocomplete="new-password"
        v-model="value"
        @blur="onBlur"
        :placeholder="$t('nightsummary.settings.secretLeaveEmpty')"
        class="tns-input w-full"
      />
      <span class="text-xs" :class="isSet ? 'text-gray-400' : 'text-gray-500'">
        {{
          isSet ? $t('nightsummary.settings.secretSet') : $t('nightsummary.settings.secretNotSet')
        }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps(['label', 'isSet']);
const emit = defineEmits(['save']);

const value = ref('');

function onBlur() {
  if (!value.value) return;
  emit('save', value.value);
  value.value = '';
}
</script>
