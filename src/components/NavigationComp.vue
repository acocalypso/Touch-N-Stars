<template>
  <div class="top-0 h-16 bg-gray-800 shadow-md">
    <div class="flex inset-x-0 mx-auto max-w-sm h-16 items-center justify-around">
      <router-link
        to="/equipment"
        class="nav-button"
        active-class="active-nav-button"
        :title="$t('components.navigation.equipment')"
      >
        <LinkIcon class="icon" />
      </router-link>
      <router-link
        to="/camera"
        class="nav-button"
        active-class="active-nav-button"
        :title="$t('components.navigation.camera')"
      >
        <CameraIcon class="icon" />
      </router-link>
      <router-link
        to="/autofocus"
        class="nav-button"
        active-class="active-nav-button"
        :title="$t('components.navigation.autofocus')"
      >
        <EyeIcon class="icon" />
      </router-link>

      <router-link
        to="/mount"
        class="nav-button"
        active-class="active-nav-button"
        :title="$t('components.navigation.mount')"
      >
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
          class="icon "
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M6 21l6 -5l6 5" />
          <path d="M12 13v8" />
          <path d="M3.294 13.678l.166 .281c.52 .88 1.624 1.265 2.605 .91l14.242 -5.165a1.023 1.023 0 0 0 .565 -1.456l-2.62 -4.705a1.087 1.087 0 0 0 -1.447 -.42l-.056 .032l-12.694 7.618c-1.02 .613 -1.357 1.897 -.76 2.905z" />
          <path d="M14 5l3 5.5" />
        </svg>
      </router-link>

      <router-link
        to="/guider"
        class="nav-button"
        active-class="active-nav-button"
        :title="$t('components.navigation.guider')"
      >
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
          class="icon icon-tabler icons-tabler-outline icon-tabler-viewfinder"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M12 3l0 4" />
          <path d="M12 21l0 -3" />
          <path d="M3 12l4 0" />
          <path d="M21 12l-3 0" />
          <path d="M12 12l0 .01" />
        </svg>
      </router-link>

      <router-link
        to="/sequence"
        class="nav-button"
        active-class="active-nav-button"
        :title="$t('components.navigation.sequence')"
      >
        <ListBulletIcon class="icon" />
      </router-link>
      
      <div class="relative">
        <button
          class="nav-button"
          :title="$t('components.language.select')"
          @click="toggleLanguageMenu"
        >
          <GlobeAltIcon class="icon" />
        </button>
        <div
          v-if="showLanguageMenu"
          class="absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5"
        >
          <div class="py-1">
            <button
              v-for="lang in languages"
              :key="lang.code"
              :class="{ 'bg-cyan-700': lang.code === currentLanguage }"
              @click="changeLanguage(lang.code)"
              class="block w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
            >
              {{ lang.name }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  LinkIcon,
  CameraIcon,
  EyeIcon,
  ListBulletIcon,
  GlobeAltIcon,
} from '@heroicons/vue/24/outline';
import { ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale, t } = useI18n();
const $t = t;
const showLanguageMenu = ref(false);

const currentLanguage = ref(locale.value);

watchEffect(() => {
  currentLanguage.value = locale.value;
});

const languages = [
  { code: 'en', name: $t('components.language.en') },
  { code: 'de', name: $t('components.language.de') }
];

function toggleLanguageMenu() {
  showLanguageMenu.value = !showLanguageMenu.value;
}

function changeLanguage(lang) {
  locale.value = lang;
  showLanguageMenu.value = false;
}
</script>

<style scoped>
.nav-button {
  @apply w-12 h-12 border border-cyan-500/20 bg-gray-700 text-white rounded-full hover:bg-gray-600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px;
  transition: border-radius 0.2s ease, background-color 0.2s ease;
}

.active-nav-button {
  @apply border border-cyan-300/30 bg-cyan-700 rounded-lg;
}
.icon {
  @apply w-6 h-6;
}
</style>
