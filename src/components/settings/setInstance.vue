<template>
  <!-- Instance List -->
  <div class="mb-4">
    <div
      v-for="(instance, index) in instances"
      :key="instance.id"
      class="p-2 rounded mb-2"
      :class="settingsStore.getInstanceColorByIndex(index)"
    >
      <div class="flex items-center justify-between">
        <div>
          <div class="font-medium">{{ instance.name }}</div>
          <div class="text-sm text-gray-400">{{ instance.ip }}:{{ instance.port }}</div>
        </div>
        <div class="flex gap-2">
          <button
            @click="selectInstance(instance)"
            :class="[
              'p-1 transition-colors',
              selectedInstance === instance.id
                ? 'text-green-500'
                : 'text-gray-300 hover:text-green-500',
            ]"
            title="Select Instance"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <button
            @click="editInstance(instance.id)"
            class="p-1 text-gray-300 hover:text-cyan-500 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
              />
            </svg>
          </button>
          <button
            @click="removeInstance(instance.id)"
            class="p-1 text-gray-300 hover:text-red-500 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Add/Edit Instance Form -->
  <div class="space-y-2">
    <div>
      <label class="block text-sm font-medium text-gray-400 mb-1">Name</label>
      <input
        v-model="tempInstance.name"
        type="text"
        class="w-full px-3 py-2 bg-gray-600 text-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        placeholder="Instance Name"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-400 mb-1">IP / FQDN</label>
      <input
        v-model="tempInstance.ip"
        type="text"
        class="w-full px-3 py-2 bg-gray-600 text-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        placeholder="192.168.x.x"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-400 mb-1">Port</label>
      <input
        v-model="tempInstance.port"
        type="text"
        class="w-full px-3 py-2 bg-gray-600 text-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        placeholder="5000"
      />
    </div>
    <div v-if="emptyFieldsError" class="mt-2 text-sm text-red-400">
      {{ $t('components.settings.errors.emptyFields') }}
    </div>
    <button
      @click="saveInstance"
      class="w-full mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors"
    >
      {{ editingInstance ? $t('components.settings.update') : $t('components.settings.add') }}
    </button>
  </div>
</template>
<script setup>
import { watch, ref, computed } from 'vue';
import { useSettingsStore } from '@/store/settingsStore';

const settingsStore = useSettingsStore();
const instances = computed(() => settingsStore.connection.instances);
const editingInstance = ref(null);
const selectedInstance = ref(settingsStore.selectedInstanceId);
const emptyFieldsError = ref(false);
const tempInstance = ref({
  name: '',
  ip: '',
  port: '',
});
const instanceError = ref(null);

function saveInstance() {
  // Clear errors before validation
  emptyFieldsError.value = false;
  instanceError.value = null;

  // Validate fields
  if (!tempInstance.value.name || !tempInstance.value.ip || !tempInstance.value.port) {
    emptyFieldsError.value = true;
    return;
  }

  // Save instance
  if (editingInstance.value) {
    settingsStore.updateInstance(editingInstance.value, tempInstance.value);
  } else {
    settingsStore.addInstance({
      id: Date.now().toString(),
      ...tempInstance.value,
    });
  }

  // Clear form after successful save
  editingInstance.value = null;
  emptyFieldsError.value = false;
  tempInstance.value = { name: '', ip: '', port: '' };
}

function editInstance(id) {
  const instance = instances.value.find((i) => i.id === id);
  if (instance) {
    tempInstance.value = { ...instance };
    editingInstance.value = id;
  }
}

function selectInstance(instance) {
  selectedInstance.value = instance.id;
  settingsStore.setSelectedInstanceId(instance.id);
}

function removeInstance(id) {
  settingsStore.removeInstance(id);
}

watch(selectedInstance, (newId) => {
  settingsStore.setSelectedInstanceId(newId);
});
</script>
