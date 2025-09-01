<template>
  <div v-if="!store.mountInfo.Connected" class="flex justify-center items-center pb-2">
    <div class="w-full p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <p class="text-red-400 text-center font-medium">
        {{ $t('components.mount.info.notConnected') }}
      </p>
    </div>
  </div>
  <div v-else class="gap-2 grid grid-cols-2 landscape:grid-cols-3">
    <StatusBool
      :isEnabled="!store.mountInfo.AtPark"
      :enabledText="$t('components.mount.info.unparked')"
      :disabledText="$t('components.mount.info.parked')"
    />
    <StatusBool
      :isEnabled="store.mountInfo.TrackingEnabled"
      :enabledText="$t('components.mount.info.trackingActive')"
      :disabledText="$t('components.mount.info.trackingDisabled')"
    />
    <StatusBool
      :isEnabled="store.mountInfo.Slewing"
      :enabledText="$t('components.mount.info.slewing')"
      :disabledText="$t('components.mount.info.notSlewing')"
    />
    <StatusString
      v-if="!hideMountInfos"
      :isEnabled="!!store.mountInfo.RightAscensionString"
      :Name="$t('components.mount.info.rightAscension')"
      :Value="store.mountInfo.RightAscensionString || ''"
    />
    <StatusString
      v-if="!hideMountInfos"
      :isEnabled="!!store.mountInfo.DeclinationString"
      :Name="$t('components.mount.info.declination')"
      :Value="store.mountInfo.DeclinationString || ''"
    />
    <StatusString
      v-if="!hideMountInfos"
      :isEnabled="!!store.mountInfo.TimeToMeridianFlipString"
      :Name="$t('components.mount.info.timeToMeridianFlip')"
      :Value="store.mountInfo.TimeToMeridianFlipString || ''"
    />
  </div>
</template>

<script setup>
import StatusBool from '@/components/helpers/StatusBool.vue';
import StatusString from '@/components/helpers/StatusString.vue';
import { apiStore } from '@/store/store';
const store = apiStore();

const props = defineProps({
  modelValue: Boolean,
  hideMountInfos: {
    type: Boolean,
    default: false,
  },
});

const { hideMountInfos } = props;
</script>
