import { createI18n } from 'vue-i18n';
import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import cz from './locales/cz.json';
import cn from './locales/cn.json';
import pt from './locales/pt.json';
import es from './locales/es.json';
import pl from './locales/pl.json';
import nl from './locales/nl.json';

// Available languages with their display names
const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'cz', name: 'Čeština' },
  { code: 'cn', name: '中文' },
  { code: 'pt', name: 'Português' },
  { code: 'es', name: 'Español' },
  { code: 'pl', name: 'Polski' },
  { code: 'nl', name: 'Nederlands' },
];

const messages = {
  de,
  en,
  fr,
  it,
  cz,
  cn,
  pt,
  es,
  pl,
  nl,
};

// Create i18n instance
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
});

// Export i18n instance and initialize function
export function getAvailableLanguages() {
  return availableLanguages;
}

export { i18n as default, initializeI18n };

// Initialize store and set locale after app is mounted
let settingsStore;
function initializeI18n(store) {
  settingsStore = store;

  // Initialize language from store or default to 'en'
  const storedLanguage = settingsStore.language;
  i18n.global.locale.value = storedLanguage || 'en';

  // Update store with current language
  if (!storedLanguage) {
    settingsStore.setLanguage(i18n.global.locale.value);
  }

  // Add language change handler
  i18n.global.onLanguageChanged = (locale) => {
    settingsStore.setLanguage(locale);
  };
}
