<template>
  <div class="space-y-4">
    <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <div class="space-y-3">
        <!-- PHD2 Connection Settings -->
        <settingsPhd2 :selectedGuiderDevice="selectedGuiderDevice" />

        <!-- Dither Settings -->
        <settingsDither />

        <!-- Settle Settings -->
        <settingsSettle />

        <!-- Guiding Start Settings -->
        <settingsGuideStart />

        <!-- ROI Settings -->
        <settingsROI />
      </div>
    </div>
  </div>
</template>

<script setup>
import settingsPhd2 from '@/components/guider/PHD2/settingsPhd2.vue';
import settingsDither from '@/components/guider/settingsDither.vue';
import settingsSettle from '@/components/guider/settingsSettle.vue';
import settingsGuideStart from '@/components/guider/settingsGuideStart.vue';
import settingsROI from '@/components/guider/settingsROI.vue';

defineProps({
  selectedGuiderDevice: { type: String, default: '' },
});
</script>
