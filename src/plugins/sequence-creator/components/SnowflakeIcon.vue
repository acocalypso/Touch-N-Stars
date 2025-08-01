<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="className"
  >
    <!-- Center vertical line -->
    <path d="M12 2v20" />
    <!-- Center horizontal line -->
    <path d="M2 12h20" />
    <!-- Diagonal lines -->
    <path d="M4.22 4.22l15.56 15.56" />
    <path d="M19.78 4.22L4.22 19.78" />
    <!-- Small branches on vertical line -->
    <path d="M8 8l4-4 4 4" />
    <path d="M8 16l4 4 4-4" />
    <!-- Small branches on horizontal line -->
    <path d="M8 8l-4 4 4 4" />
    <path d="M16 8l4 4-4 4" />
  </svg>
</template>

<script setup>
defineProps({
  className: {
    type: String,
    default: 'w-5 h-5',
  },
});
</script>