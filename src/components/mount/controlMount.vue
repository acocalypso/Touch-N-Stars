<template>
  <div class="flex flex-col xs:flex-row gap-1 xs:gap-2">
    <ButtonPark />
    <ButtonUnpark />
    <ButtonHome />
    <ButtonSetAsPark />
    <ButtonSlewStop class="w-full" />
  </div>
  <div class="flex mt-4 justify-center items-center">
    <div class="w-3 mr-2 h-[1px] bg-gray-700"></div>
    <p class="text-xs">{{ $t('components.mount.control.trackingMode') }}</p>
    <div class="flex-grow ml-2 h-[1px] bg-gray-700"></div>
  </div>
  <div class="flex gap-x-2 mt-2">
    <ButtonTrackingMode />
    <ButtonTrackingStop />
  </div>

  <div class="flex mt-4 justify-center items-center">
    <div class="w-3 mr-2 h-[1px] bg-gray-700"></div>
    <p class="text-xs">{{ $t('components.mount.control.manuellControl') }}</p>
    <div class="flex-grow ml-2 h-[1px] bg-gray-700"></div>
  </div>
  <div>
    <moveAxis />
  </div>
</template>

<script setup>
import moveAxis from '@/components/mount/moveAxis.vue';
import ButtonSetAsPark from '@/components/mount/ButtonSetAsPark.vue';
import ButtonHome from '@/components/mount/ButtonHome.vue';
import ButtonUnpark from '@/components/mount/ButtonUnpark.vue';
import ButtonPark from '@/components/mount/ButtonPark.vue';
import ButtonSlewStop from '@/components/mount//ButtonSlewStop.vue';
import ButtonTrackingMode from '@/components/mount/ButtonTrackingMode.vue';
import ButtonTrackingStop from '@/components/mount/ButtonTrackingStop.vue';
</script>
