<template>
  <div
    v-if="showModal"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
  >
    <div class="bg-gray-800 p-6 rounded-lg max-w-sm w-full">
      <h3 class="text-lg font-semibold text-white mb-4">
        {{ $t('components.notifications.modal.title') }}
      </h3>
      <p class="text-gray-300 mb-6">
        {{ $t('components.notifications.modal.description') }}
      </p>
      <div class="flex justify-end space-x-4">
        <button
          @click="cancel"
          class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          @click="confirmPermission"
          class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md"
        >
          {{ $t('common.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import notificationService from '@/services/notificationService';
import { useSettingsStore } from '@/store/settingsStore';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'permissionResult']);
const settingsStore = useSettingsStore();
const showModal = ref(props.modelValue);

// Watch for changes to the modelValue prop
watch(
  () => props.modelValue,
  (newValue) => {
    showModal.value = newValue;
  }
);

function cancel() {
  // Disable notifications in settings
  settingsStore.notifications.enabled = false;
  settingsStore.toggleNotifications();
  emit('update:modelValue', false);
  emit('permissionResult', false);
}

async function confirmPermission() {
  try {
    // Initialize notification service and request permissions
    const result = await notificationService.initialize();

    if (result) {
      emit('permissionResult', true);
    } else {
      // Disable notifications in settings since permission was denied
      settingsStore.notifications.enabled = false;
      settingsStore.toggleNotifications();
      emit('permissionResult', false);
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
    settingsStore.notifications.enabled = false;
    settingsStore.toggleNotifications();
    emit('permissionResult', false);
  }

  emit('update:modelValue', false);
}
</script>
