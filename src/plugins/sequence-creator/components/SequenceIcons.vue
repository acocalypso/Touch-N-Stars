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
    <!-- Telescope Icon -->
    <template v-if="name === 'telescope'">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M6 21l6 -5l6 5" />
      <path d="M12 13v8" />
      <path
        d="M3.294 13.678l.166 .281c.52 .88 1.624 1.265 2.605 .91l14.242 -5.165a1.023 1.023 0 0 0 .565 -1.456l-2.62 -4.705a1.087 1.087 0 0 0 -1.447 -.42l-.056 .032l-12.694 7.618c-1.02 .613 -1.357 1.897 -.76 2.905z"
      />
      <path d="M14 5l3 5.5" />
    </template>

    <!-- Guider Icon -->
    <template v-else-if="name === 'guider'">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M12 3l0 4" />
      <path d="M12 21l0 -3" />
      <path d="M3 12l4 0" />
      <path d="M21 12l-3 0" />
      <path d="M12 12l0 .01" />
    </template>

    <!-- Snowflake Icon -->
    <template v-else-if="name === 'snowflake'">
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
    </template>

    <!-- Hero Icons (from HeroIcon.vue) -->
    <!-- Play -->
    <template v-else-if="name === 'play'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M8 5v14l11-7z"
      />
    </template>

    <!-- Camera -->
    <template v-else-if="name === 'camera'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </template>

    <!-- Stop -->
    <template v-else-if="name === 'stop'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </template>

    <!-- Fire -->
    <template v-else-if="name === 'fire'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
      />
    </template>

    <!-- Home -->
    <template v-else-if="name === 'home'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </template>

    <!-- Cursor Arrow Rays -->
    <template v-else-if="name === 'cursor-arrow-rays'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2l3 3m6-3l-3 3m-6 12l-3 3m6 3l3-3"
      />
    </template>

    <!-- Crosshairs -->
    <template v-else-if="name === 'crosshairs'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 2v20M2 12h20m-7-7l2 2m3-3l2 2m-10 6l2 2m3 3l2 2"
      />
    </template>

    <!-- Magnifying Glass -->
    <template v-else-if="name === 'magnifying-glass'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </template>

    <!-- Rocket (Start) -->
    <template v-else-if="name === 'rocket'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </template>

    <!-- Flag (End) -->
    <template v-else-if="name === 'flag'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2h7a2 2 0 012 2v6a2 2 0 01-2 2h-7l-1-2H5a2 2 0 00-2 2z"
      />
    </template>

    <!-- List with Pencil (Sequence Creator) -->
    <template v-else-if="name === 'list-with-pencil'">
      <!-- List background -->
      <rect x="3" y="5" width="14" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- List items -->
      <line x1="6" y1="9" x2="14" y2="9" stroke="currentColor" stroke-width="1.5"/>
      <line x1="6" y1="12" x2="12" y2="12" stroke="currentColor" stroke-width="1.5"/>
      <line x1="6" y1="15" x2="10" y2="15" stroke="currentColor" stroke-width="1.5"/>
      <!-- Pencil -->
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M14 4l2 2 4-4-2-2zM14 4l-8 8v2h2l8-8z"
        fill="currentColor"
        stroke="currentColor"
      />
      <!-- Pencil tip -->
      <circle cx="16" cy="6" r="1" fill="currentColor"/>
    </template>

    <!-- Default fallback -->
    <template v-else>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </template>
  </svg>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  className: {
    type: String,
    default: 'w-5 h-5',
  },
});
</script>