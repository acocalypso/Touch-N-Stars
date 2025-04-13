<template>
  <div v-if="!store.domeInfo.Connected" class="text-red-500">
    <p>{{ $t('components.dome.please_connect_dome') }}</p>
  </div>
  <div v-else class="gap-2">
    <StatusString
      :isEnabled="store.domeInfo.Azimuth !== undefined && !isNaN(store.domeInfo.Azimuth)"
      :Name="$t('components.dome.azimuth')"
      :Value="
        store.domeInfo.Azimuth !== undefined && !isNaN(store.domeInfo.Azimuth)
          ? store.domeInfo.Azimuth.toFixed(1)
          : ''
      "
    />
    <StatusBool
      :isEnabled="store.domeInfo.Slewing"
      :enabledText="$t('components.dome.slewing')"
      :disabledText="$t('components.dome.slewing_stopped')"
    />
    <StatusBool
      :isEnabled="store.domeInfo.IsFollowing"
      :enabledText="$t('components.dome.following')"
      :disabledText="$t('components.dome.following_stopped')"
    />
    <StatusBool
      :isEnabled="store.domeInfo.AtHome"
      :enabledText="$t('components.dome.at_home')"
      :disabledText="$t('components.dome.not_at_home')"
    />
    <StatusBool
      :isEnabled="!store.domeInfo.AtPark"
      :enabledText="$t('components.dome.unpark')"
      :disabledText="$t('components.dome.park')"
    />
    <StatusBool
      :isEnabled="store.domeInfo.ShutterStatus !== 'ShutterClosed'"
      :enabledText="$t('components.dome.shutter_open')"
      :disabledText="$t('components.dome.shutter_close')"
    />
    <StatusBool
      :isEnabled="store.domeInfo.IsSynchronized"
      :enabledText="$t('components.dome.is_sync')"
      :disabledText="$t('components.dome.not_sync')"
    />
  </div>
</template>

<script setup>
import StatusBool from '@/components/helpers/StatusBool.vue';
import StatusString from '@/components/helpers/StatusString.vue';
import { apiStore } from '@/store/store';

const store = apiStore();
</script>
