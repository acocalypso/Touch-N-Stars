<template>
  <svg :class="[size, className]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <!-- Telescope -->
    <path
      v-if="name === 'telescope'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M3 3l1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L17 17m-4-4l1.242-1.757M9 9l2.121-2.121m0 0L13 5l4 4m-6.121 2.121L13 13m0 0l2.121-2.121"
    />

    <!-- Snowflake -->
    <path
      v-else-if="name === 'snowflake'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M12 6v12m-3-2l6-6m0 6l-6-6m0 0l6-6m0 6l-6-6m6 6l-6-6"
    />

    <!-- Crosshairs -->
    <path
      v-else-if="name === 'crosshairs'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M12 2v20M2 12h20m-7-7l2 2m3-3l2 2m-10 6l2 2m3 3l2 2"
    />

    <!-- Cursor Arrow Rays -->
    <path
      v-else-if="name === 'cursor-arrow-rays'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2l3 3m6-3l-3 3m-6 12l-3 3m6 3l3-3"
    />

    <!-- Magnifying Glass -->
    <path
      v-else-if="name === 'magnifying-glass'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />

    <!-- Play -->
    <path
      v-else-if="name === 'play'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M8 5v14l11-7z"
    />

    <!-- Camera -->
    <path
      v-else-if="name === 'camera'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM15 13a3 3 0 11-6 0 3 3 0 016 0z"
    />

    <!-- Stop -->
    <path
      v-else-if="name === 'stop'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />

    <!-- Fire -->
    <path
      v-else-if="name === 'fire'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
    />

    <!-- Home -->
    <path
      v-else-if="name === 'home'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />

    <!-- Rocket (Start) -->
    <path
      v-else-if="name === 'rocket'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />

    <!-- Flag (End) -->
    <path
      v-else-if="name === 'flag'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2h7a2 2 0 012 2v6a2 2 0 01-2 2h-7l-1-2H5a2 2 0 00-2 2z"
    />

    <!-- Default fallback -->
    <path
      v-else
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: 'w-5 h-5',
  },
  className: {
    type: String,
    default: '',
  },
});
</script>
