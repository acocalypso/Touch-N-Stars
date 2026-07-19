<template>
  <div v-if="isEnabled" class="tns-stat-tile">
    <span class="tns-stat-label" :title="Name">{{ Name }}</span>
    <span class="tns-stat-value">
      <span class="truncate">{{ Value }}</span>
    </span>
  </div>
</template>

<script setup>
defineProps({
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
