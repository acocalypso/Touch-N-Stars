<template>
    <div class="">

        <!-- Camera Control -->
        <ConnectionButton :isConnected="store.cameraInfo.Connected" 
            :connectText="$t('components.connectEquipment.camera.connect')"
            :disconnectText="$t('components.connectEquipment.camera.disconnect')" 
            :onToggle="toggleCameraConnection" />

        <!-- Filter Control -->
        <ConnectionButton :isConnected="store.filterInfo.Connected" 
            :connectText="$t('components.connectEquipment.filter.connect')"
            :disconnectText="$t('components.connectEquipment.filter.disconnect')" 
            :onToggle="toggleFilterConnection" />

        <!-- Mount Control -->
        <ConnectionButton :isConnected="store.mountInfo.Connected" 
            :connectText="$t('components.connectEquipment.mount.connect')"
            :disconnectText="$t('components.connectEquipment.mount.disconnect')" 
            :onToggle="toggleMountConnection" />

        <!-- Focuser Control -->
        <ConnectionButton :isConnected="store.focuserInfo.Connected" 
            :connectText="$t('components.connectEquipment.focuser.connect')"
            :disconnectText="$t('components.connectEquipment.focuser.disconnect')" 
            :onToggle="toggleFocuserConnection" />

        <!-- Rotator Control -->
        <ConnectionButton :isConnected="store.rotatorInfo.Connected" 
            :connectText="$t('components.connectEquipment.rotator.connect')"
            :disconnectText="$t('components.connectEquipment.rotator.disconnect')" 
            :onToggle="toggleRotatorConnection" />

        <!-- Guider Control -->
        <ConnectionButton :isConnected="store.guiderInfo.Connected" 
            :connectText="$t('components.connectEquipment.guider.connect')"
            :disconnectText="$t('components.connectEquipment.guider.disconnect')" 
            :onToggle="toggleGuiderConnection" />

    </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { apiStore } from '../store/store';
import apiService from '../services/apiService';
import ConnectionButton from './helpers/ConnectionButton.vue';

const { t } = useI18n();
const store = apiStore();

async function toggleCameraConnection() {
    try {
        if (store.cameraInfo.Connected) {
            await apiService.cameraAction("disconnect");
        } else {
            await apiService.cameraAction("connect");
        }
    } catch (error) {
        console.error(t('components.connectEquipment.camera.error'), error.response?.data || error);
    }
}

async function toggleMountConnection() {
    try {
        if (store.mountInfo.Connected) {
            await apiService.mountAction("disconnect");
        } else {
            await apiService.mountAction("connect");
        }
    } catch (error) {
        console.error(t('components.connectEquipment.mount.error'), error.response?.data || error);
    }
}

async function toggleFilterConnection() {
    try {
        if (store.filterInfo.Connected) {
            await apiService.filterAction("disconnect");
        } else {
            await apiService.filterAction("connect");
        }
    } catch (error) {
        console.error(t('components.connectEquipment.filter.error'), error.response?.data || error);
    }
}

async function toggleFocuserConnection() {
    try {
        if (store.focuserInfo.Connected) {
            await apiService.focusAction("disconnect");
        } else {
            await apiService.focusAction("connect");
        }
    } catch (error) {
        console.error(t('components.connectEquipment.focuser.error'), error.response?.data || error);
    }
}

async function toggleRotatorConnection() {
    try {
        if (store.rotatorInfo.Connected) {
            await apiService.rotatorAction("disconnect");
        } else {
            await apiService.rotatorAction("connect");
        }
    } catch (error) {
        console.error(t('components.connectEquipment.rotator.error'), error.response?.data || error);
    }
}

async function toggleGuiderConnection() {
    try {
        if (store.guiderInfo.Connected) {
            await apiService.guiderAction("disconnect");
        } else {
            await apiService.guiderAction("connect");
        }
    } catch (error) {
        console.error(t('components.connectEquipment.guider.error'), error.response?.data || error);
    }
}
</script>
