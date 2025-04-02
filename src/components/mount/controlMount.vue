<template>
  <div class="flex flex-col xs:flex-row gap-1 xs:gap-2">
    <ButtonPark />
    <ButtonUnpark />
    <ButtonHome />
    <ButtonSetAsPark />
  </div>
  <div class="flex mt-4 justify-center items-center">
    <div class="w-3 mr-2 h-[1px] bg-gray-700"></div>
    <p class="text-xs">{{ $t('components.mount.control.trackingMode') }}</p>
    <div class="flex-grow ml-2 h-[1px] bg-gray-700"></div>
  </div>
  <div class="flex gap-x-2 mt-2">
    <button
      @click="setTrackingMode(0)"
      class="min-w-15 min-h-10 bg-cyan-900 rounded-md text-white font-medium transition-colors w-full"
    >
      {{ $t('components.mount.control.siderial') }}
    </button>
    <!-- aktuell deaktiviert da NINA nur Siderial umsetzt
      <button @click="setTrackingMode(1)"
              class="min-w-15 min-h-10 bg-cyan-900 rounded-md text-white font-medium transition-colors w-full">
        Lunar
      </button>
      <button @click="setTrackingMode(2)"
              class="min-w-15 min-h-10 bg-cyan-900 rounded-md text-white font-medium transition-colors w-full">
        Solar
      </button>
      <button @click="setTrackingMode(3)"
              class="min-w-15 min-h-10 bg-cyan-900 rounded-md text-white font-medium transition-colors w-full">
        King
      </button>
       -->
    <button
      @click="setTrackingMode(4)"
      class="min-w-15 min-h-10 bg-red-800 rounded-md text-white font-medium transition-colors w-full"
    >
      {{ $t('components.mount.control.stop') }}
    </button>
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
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import moveAxis from '@/components/mount/moveAxis.vue';
import ButtonSetAsPark from '@/components/mount/ButtonSetAsPark.vue';
import ButtonHome from '@/components/mount/ButtonHome.vue';
import ButtonUnpark from '@/components/mount/ButtonUnpark.vue';
import ButtonPark from '@/components/mount/ButtonPark.vue';

const { t } = useI18n();

async function setTrackingMode(mode) {
  //0=Siderial, 1=Lunar, 2=Solar, 3=King, 4=Stopped
  try {
    await apiService.setTrackingMode(mode);
    console.log(t('components.mount.control.trackingMode') + ' gesetzt');
  } catch (error) {
    console.log(t('components.mount.control.errors.tracking'));
  }
}
</script>
