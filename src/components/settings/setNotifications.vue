<template>
  <div>
    <div
      class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg mb-2"
    >
      <label for="notificationsEnabled" class="text-gray-400">
        {{ $t('components.settings.notifications.enable') }}
      </label>
      <div>
        <toggleButton
          @click="toggleNotifications"
          :status-value="settingsStore.notifications.enabled"
        />
      </div>
    </div>

    <div v-if="settingsStore.notifications.enabled">
      <div
        class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg ml-2"
      >
        <label for="sequenceNotificationsEnabled" class="text-gray-400">
          {{ $t('components.settings.notifications.sequence') }}
        </label>
        <div>
          <toggleButton
            @click="toggleSequenceNotifications"
            :status-value="settingsStore.notifications.sequence.enabled"
          />
        </div>
      </div>

      <div
        class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg ml-2 mt-2"
      >
        <label for="phd2NotificationsEnabled" class="text-gray-400">
          {{ $t('components.settings.notifications.phd2') }}
        </label>
        <div>
          <toggleButton
            @click="togglePhd2Notifications"
            :status-value="settingsStore.notifications.phd2.enabled"
          />
        </div>
      </div>
    </div>

    <!-- Permission Modal -->
    <NotificationPermissionModal
      v-model="showPermissionModal"
      @permission-result="handlePermissionResult"
    />
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useSettingsStore } from '@/store/settingsStore';
import toggleButton from '@/components/helpers/toggleButton.vue';
import NotificationPermissionModal from '@/components/NotificationPermissionModal.vue';
import notificationService from '@/services/notificationService';

const settingsStore = useSettingsStore();
const showPermissionModal = ref(false);

function toggleNotifications() {
  if (!settingsStore.notifications.enabled) {
    // If turning on notifications, show the permission modal
    showPermissionModal.value = true;
  } else {
    // If turning off notifications, just update the setting
    settingsStore.toggleNotifications();
  }
}

function toggleSequenceNotifications() {
  settingsStore.toggleSequenceNotifications();
}

function togglePhd2Notifications() {
  settingsStore.togglePhd2Notifications();
}

function handlePermissionResult(granted) {
  if (granted) {
    // Send a test notification to confirm it's working
    notificationService.sendNotification(
      'Notifications Enabled',
      'You will now receive notifications for sequence events',
      Math.floor(Math.random() * 10000),
      'sequence-events',
      'default'
    );
  }
}
</script>
