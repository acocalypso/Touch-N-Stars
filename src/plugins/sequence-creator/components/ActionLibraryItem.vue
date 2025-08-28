<template>
  <div
    :class="[
      'action-library-item p-3 rounded-lg cursor-pointer transition-all duration-200',
      'hover:shadow-md transform hover:scale-105',
      action.color,
      'text-white',
    ]"
    @click="handleClick"
    :title="action.description"
  >
    <div class="flex items-center gap-3">
      <span class="text-lg">{{ action.icon }}</span>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium">{{ action.name }}</div>
        <div class="text-xs opacity-90 truncate">
          {{ action.description }}
        </div>
      </div>
      <div class="flex-shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  action: {
    type: Object,
    required: true,
  },
  containerType: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['add-action']);

function handleClick() {
  emit('add-action', props.action, props.containerType);
}
</script>

<style scoped>
.action-library-item {
  transition: all 0.2s ease;
}

.action-library-item:hover {
  transform: translateY(-1px);
}
</style>
