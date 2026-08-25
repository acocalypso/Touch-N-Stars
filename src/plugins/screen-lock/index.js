import metadata from './plugin.json';

export default {
  metadata,
  // Intentionally empty: this plugin has no page of its own. It is a pure
  // feature flag - the settings toggle lives in SettingsPluginsTab.vue, the
  // entry point is the status bar chip, and the overlay is rendered globally
  // by App.vue. Registering a route/navigation item here would add a screen
  // with nothing on it.
  install() {},
};
