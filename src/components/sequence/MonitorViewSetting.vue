<template>
  <div class="flex flex-col gap-1">
    <div
      class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
    >
      <label for="showImage" class="text-gray-400">
        {{ $t('components.sequence.monitor.settings.showImage') }}
      </label>
      <div>
        <toggleButton
          @click="
            settingsStore.monitorViewSetting.showImage = !settingsStore.monitorViewSetting.showImage
          "
          :status-value="settingsStore.monitorViewSetting.showImage"
        />
      </div>
    </div>

    <div class="flex flex-col gap-2 border border-gray-500 p-2 rounded-lg">
      <div class="flex items-center justify-between w-full">
        <label for="showImageStats" class="text-gray-400">
          {{ $t('components.sequence.monitor.settings.showImageStats') }}
        </label>
        <div>
          <toggleButton
            @click="
              settingsStore.monitorViewSetting.showImageStats =
                !settingsStore.monitorViewSetting.showImageStats
            "
            :status-value="settingsStore.monitorViewSetting.showImageStats"
          />
        </div>
      </div>
      <div class="flex items-center justify-between w-full">
        <label for="showImageStats" class="text-gray-400">
          {{ $t('components.sequence.monitor.settings.display_status_under_image') }}
        </label>
        <div>
          <toggleButton
            @click="
              settingsStore.monitorViewSetting.displayStatusUnderImage =
                !settingsStore.monitorViewSetting.displayStatusUnderImage
            "
            :status-value="settingsStore.monitorViewSetting.displayStatusUnderImage"
          />
        </div>
      </div>
    </div>

    <div
      class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
    >
      <label for="showImgStatsGraph" class="text-gray-400">
        {{ $t('components.sequence.monitor.settings.showImgStatsGraph') }}
      </label>
      <div>
        <toggleButton
          @click="
            settingsStore.monitorViewSetting.showImgStatsGraph =
              !settingsStore.monitorViewSetting.showImgStatsGraph
          "
          :status-value="settingsStore.monitorViewSetting.showImgStatsGraph"
        />
      </div>
    </div>

    <div
      class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
    >
      <label for="showGuiderGraph" class="text-gray-400">
        {{ $t('components.sequence.monitor.settings.showGuiderGraph') }}
      </label>
      <div>
        <toggleButton
          @click="
            settingsStore.monitorViewSetting.showGuiderGraph =
              !settingsStore.monitorViewSetting.showGuiderGraph
          "
          :status-value="settingsStore.monitorViewSetting.showGuiderGraph"
        />
      </div>
    </div>

    <div
      class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
    >
      <label for="showGuiderAfGraph" class="text-gray-400">
        {{ $t('components.sequence.monitor.settings.showGuiderAfGraph') }}
      </label>
      <div>
        <toggleButton
          @click="
            settingsStore.monitorViewSetting.showGuiderAfGraph =
              !settingsStore.monitorViewSetting.showGuiderAfGraph
          "
          :status-value="settingsStore.monitorViewSetting.showGuiderAfGraph"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import toggleButton from '@/components/helpers/toggleButton.vue';

const settingsStore = useSettingsStore();
</script>
