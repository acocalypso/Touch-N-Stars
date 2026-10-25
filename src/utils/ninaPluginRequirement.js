/**
 * App plugins that need a NINA plugin declare it in plugin.json:
 *   "ninaPlugin": { "name": "LiveStack", "displayName": "LiveStack", "pinsPackage": "pins-plugin-livestack" }
 * `name` is what NINA's `GET /v2/api/application/plugins` lists (the plugin folder name),
 * `displayName` what the user reads (defaults to `name`), `pinsPackage` the package the
 * PINS daemon installs it from.
 */

/** @returns {{ name: string, displayName: string, pinsPackage: string|null } | null} */
export function getNinaPluginRequirement(pluginMetadata) {
  const requirement = pluginMetadata?.ninaPlugin;
  if (!requirement || typeof requirement.name !== 'string' || !requirement.name.trim()) {
    return null;
  }
  const name = requirement.name.trim();
  return {
    name,
    displayName:
      typeof requirement.displayName === 'string' && requirement.displayName.trim()
        ? requirement.displayName.trim()
        : name,
    pinsPackage:
      typeof requirement.pinsPackage === 'string' && requirement.pinsPackage.trim()
        ? requirement.pinsPackage.trim()
        : null,
  };
}

/**
 * @param {unknown} pluginsResponse - raw response of `apiService.getPlugins()`
 * @returns {string[]|null} the loaded plugin names, or null when the response is unusable
 */
export function parseLoadedNinaPlugins(pluginsResponse) {
  if (!pluginsResponse?.Success || !Array.isArray(pluginsResponse.Response)) return null;
  return pluginsResponse.Response.filter((name) => typeof name === 'string');
}

/** Case-insensitive, since NINA reports folder names as they happen to be spelled. */
export function isNinaPluginLoaded(loadedNames, requirement) {
  if (!requirement || !Array.isArray(loadedNames)) return false;
  const wanted = requirement.name.toLowerCase();
  return loadedNames.some((name) => name.trim().toLowerCase() === wanted);
}

/** A daemon without the NINA restart route answers 404 or 405. */
export function isRouteMissingError(error) {
  const status = error?.response?.status;
  return status === 404 || status === 405;
}
