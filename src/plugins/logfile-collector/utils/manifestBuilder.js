export const MANIFEST_VERSION = 1;

// Sentinel outcome status for the case where the user's expert-mode diagnostics
// config was invalid (e.g. no section selected) - distinct from DIAGNOSTICS_STATUS,
// which models the backend archive job's own state machine.
export const MANIFEST_DIAGNOSTICS_VALIDATION_FAILED = 'validation_failed';

/**
 * @typedef {Object} ManifestAppInfo
 * @property {string} tnsVersion
 * @property {string} platform 'android'|'ios'|'web'
 * @property {'pins'|'nina'} mode
 * @property {string} locale
 */

/**
 * @typedef {Object} ManifestVersions
 * @property {string} api
 * @property {string} pins
 * @property {string} tnsPlugin
 */

/**
 * @typedef {Object} ManifestDiagnostics
 * @property {Record<string, boolean|number>} requested Result of buildDiagnosticsPayload() plus includeNinaLogs
 * @property {{status: string, archiveId: ?string, error: ?string, startedAt: ?string, finishedAt: ?string, errors?: Object}} outcome
 */

/**
 * Builds the plain-object manifest embedded as manifest.json in every collected ZIP.
 * Pure function - all values must be supplied by the caller (no store/Capacitor access here).
 *
 * @param {{
 *   generatedAt: string,
 *   description: string,
 *   logToken: ?string,
 *   app: ManifestAppInfo,
 *   versions: ManifestVersions,
 *   diagnostics: ?ManifestDiagnostics
 * }} params
 * @returns {Object}
 */
export function buildLogManifest({
  generatedAt,
  description,
  logToken,
  app,
  versions,
  diagnostics,
}) {
  const manifest = {
    manifestVersion: MANIFEST_VERSION,
    generatedAt,
    description: description || '',
    logToken: logToken || null,
    app,
    versions,
  };

  if (diagnostics) {
    manifest.diagnostics = diagnostics;
  }

  return manifest;
}
