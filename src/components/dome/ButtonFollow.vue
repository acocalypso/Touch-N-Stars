<template>
  <div
    class="flex flex-row w-full h-12 items-center min-w-28 border border-gray-500 p-1 rounded-lg"
  >
    <label for="pixel-size" class="text-sm mr-3 mb-1 text-gray-400">
      {{ $t('components.dome.control.follow') }}
    </label>
    <toggleButton
      @click="toggleFollowDome"
      :status-value="store.domeInfo.IsFollowing"
      class="ml-auto pr-2 justify-center"
    />
  </div>
</template>

<script setup>
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import { handleApiError } from '@/utils/utils';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { apiStore } from '@/store/store';

const { t } = useI18n();
const store = apiStore();

async function toggleFollowDome() {
  const enable = !store.domeInfo.IsFollowing;
  console.log('enable:', enable);
  try {
    const response = await apiService.domeAction(`set-follow?enabled=${enable}`);
    console.log(response);
    if (
      handleApiError(response, {
        title: t('components.dome.control.errors.follow'),
      })
    )
      return;

    isFollowing = enable;
    console.log(enable ? 'followEnabled' : 'followDisabled');
  } catch (error) {
    console.log(t('components.dome.control.errors.follow'));
  }
}
</script>
