<template>
  <!-- HocusFocus icon - focus target/crosshair -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
  >
    <!-- Outer circle -->
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none" />
    <!-- Inner circle -->
    <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.5" fill="none" />
    <!-- Center dot -->
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <!-- Crosshair horizontal -->
    <line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="1.5" />
    <line x1="14" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="1.5" />
    <!-- Crosshair vertical -->
    <line x1="12" y1="6" x2="12" y2="10" stroke="currentColor" stroke-width="1.5" />
    <line x1="12" y1="14" x2="12" y2="18" stroke="currentColor" stroke-width="1.5" />
  </svg>
</template>

<style scoped>
svg {
  width: 1em;
  height: 1em;
}
</style>
