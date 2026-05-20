<template>
  <!-- 10micron mount icon: simplified telescope/polar grid -->
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
    class="icon force-visible"
  >
    <!-- Outer circle (polar grid) -->
    <circle cx="12" cy="12" r="9" />
    <!-- Inner circle -->
    <circle cx="12" cy="12" r="4" />
    <!-- Cross hairs -->
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <!-- Centre dot -->
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </svg>
</template>
