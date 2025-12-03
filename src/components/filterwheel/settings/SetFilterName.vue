<template>
  <div class="flex flex-row w-full items-center">
    <label class="text-sm text-gray-200 mr-10 whitespace-nowrap">
      {{ $t('components.filterwheel.settings.FilterWheelFilters.Name') }}
    </label>
    <input v-model="value" type="text" class="default-input w-full" @change="updateSetting" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiService from '@/services/apiService';

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  settingKey: {
    type: String,
    required: true,
  },
});

const value = ref('');
const filterName = ref(props.modelValue);

async function updateSetting() {
  try {
    await apiService.profileChangeValue(`${props.settingKey}`, value.value);
  } catch (error) {
    console.error('Error updating filter name:', error);
  }
}

onMounted(() => {
  value.value = props.modelValue;
  filterName.value = props.modelValue;
});
</script>
