<template>
  <div
    v-if="isEnabled"
    class="flex items-center space-x-4 border border-gray-500 rounded-xl min-h-7 pl-2 pr-2"
  >
    <div class="flex items-center space-x-3 text-xs">
      <strong class="text-gray-400">{{ Name }}</strong>
      <p>{{ Value }}</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isEnabled: {
    type: Boolean,
    default: true,
  },
  Name: {
    type: String,
    default: 'Name:',
  },
  Value: {
    type: [String, Number],
    default: '1234',
  },
});
</script>

<style scoped></style>
