<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="w-6 h-6"
  >
    <!-- Center circle representing a star -->
    <circle cx="12" cy="12" r="2" />

    <!-- Main diffraction spikes in a Bathinov pattern -->
    <line x1="12" y1="4" x2="12" y2="20" />
    <line x1="6" y1="8" x2="18" y2="16" />
    <line x1="6" y1="16" x2="18" y2="8" />

    <!-- Focus indicator line -->
    <path d="M12,3 Q15,10 12,21" stroke-dasharray="1,2" />

    <!-- Outer circle representing the mask -->
    <circle cx="12" cy="12" r="10" stroke-dasharray="1,1" />
  </svg>
</template>

<script setup>
// No additional logic needed for this SVG component
</script>
