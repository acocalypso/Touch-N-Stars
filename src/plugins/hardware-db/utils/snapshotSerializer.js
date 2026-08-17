/**
 * Builds the hardware knowledge-base payload.
 *
 * Everything that leaves the device passes through this module. The equipment
 * objects it reads are copied verbatim from NINA responses (see
 * `setInfoIfChanged` in src/store/store.js) and carry far more fields than
 * their default shapes suggest — driver blobs, file paths and per-driver extras
 * that change with every NINA release. This file therefore works on a strict
 * allow-list: an output field exists only because it is named here.
 *
 * Never turn this into a deny-list. A forgotten entry would leak silently.
 */

export const SCHEMA_VERSION = 1;

/** How the user rates a device/driver combination. */
export const USER_STATUS = Object.freeze({
  WORKS: 'works',
  CAVEAT: 'caveat',
  BROKEN: 'broken',
});

const VALID_USER_STATUS = new Set(Object.values(USER_STATUS));

/** Store field -> knowledge-base category slug. Order defines UI order. */
export const DEVICE_CATEGORIES = Object.freeze({
  cameraInfo: 'camera',
  mountInfo: 'mount',
  focuserInfo: 'focuser',
  filterInfo: 'filterwheel',
  rotatorInfo: 'rotator',
  guiderInfo: 'guider',
  flatdeviceInfo: 'flatdevice',
  switchInfo: 'switch',
  weatherInfo: 'weather',
  domeInfo: 'dome',
  safetyInfo: 'safetymonitor',
});

/**
 * The only device fields ever transmitted. Adding one here is a deliberate
 * privacy decision — check what the driver actually puts in it first.
 *
 * `DeviceId` is deliberately absent: several drivers report the hardware serial
 * number there, and the knowledge base identifies an entry by driver plus
 * device name, so it would be pure risk without a use.
 */
export const DEVICE_FIELDS = Object.freeze([
  'category',
  'name',
  'displayName',
  'driverInfo',
  'driverVersion',
  'driverCategory',
  'indiDriver',
  'connectionType',
  'connected',
]);

/** Category -> profile section holding Id and IndiDriver while disconnected. */
export const PROFILE_SECTIONS = Object.freeze({
  camera: 'CameraSettings',
  mount: 'TelescopeSettings',
  focuser: 'FocuserSettings',
  filterwheel: 'FilterWheelSettings',
  rotator: 'RotatorSettings',
  guider: 'GuiderSettings',
  flatdevice: 'FlatDeviceSettings',
  switch: 'SwitchSettings',
  weather: 'WeatherDataSettings',
  dome: 'DomeSettings',
  safetymonitor: 'SafetyMonitorSettings',
});

/**
 * Values that mean "no driver reported". NINA and the PINS backend fill the
 * field with these rather than leaving it empty, and storing them would put
 * junk driver names into the database. `no_device` is NINA's placeholder for
 * "nothing selected" in a profile section.
 */
const PLACEHOLDER_VALUES = new Set([
  'n.a.',
  'n/a',
  'na',
  'none',
  'unknown',
  'no_device',
  'no device',
  '-',
  '--',
  '?',
]);

export const MAX_NOTE_LENGTH = 500;
export const MAX_DEVICES = 40;

function cleanString(value, maxLength = 200) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const cleaned = cleanString(value);
    if (cleaned) return cleaned;
  }
  return '';
}

/**
 * Collapses a device name to a comparable form. Without USB vendor/product IDs
 * this is the identity key of an entry, so it has to survive the punctuation
 * and casing differences between NINA, INDI and ASCOM spellings of the same
 * model ("ZWO ASI533MC-Pro" vs "ZWO ASI533MC Pro").
 */
export function normalizeDeviceName(name) {
  return cleanString(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Stable identity of a device/driver pair, used for dedupe and lookups. */
export function deviceKey({ name, driverInfo }) {
  return `${normalizeDeviceName(name)}::${normalizeDeviceName(driverInfo)}`;
}

/** Drops placeholder driver strings so they never reach the database. */
function cleanDriverValue(value) {
  const cleaned = cleanString(value);
  return PLACEHOLDER_VALUES.has(cleaned.toLowerCase()) ? '' : cleaned;
}

/**
 * INDI drivers are executables named `indi_*`; ASCOM Alpaca reports its own
 * category. Everything else is a natively supported driver.
 *
 * On PINS both DriverInfo and Category are frequently empty and the only INDI
 * marker is a "(INDI)" suffix the backend appends to the display name, so that
 * is checked as well.
 */
function detectConnectionType({ driverInfo, driverCategory, displayName }) {
  if (/^indi_/i.test(driverInfo) || /\(\s*indi\s*\)/i.test(displayName)) return 'indi';
  if (/alpaca/i.test(driverCategory)) return 'alpaca';
  if (/ascom/i.test(driverCategory)) return 'ascom';
  // A named driver that is none of the above is a vendor SDK, e.g. "ToupTek SDK".
  return driverInfo || driverCategory ? 'native' : '';
}

/**
 * Strips a trailing hardware identifier from a display name, e.g. the
 * "(7c-2-2-3)" in "ToupTek ATR585M (7c-2-2-3)".
 *
 * That suffix is a truncated fragment of the driver's DeviceId — the full value
 * reads `ToupTek_usb-0547-157c-2-2-3`, i.e. prefix, USB vendor/product ID, and
 * the bus/port chain the camera is plugged into. It therefore changes with the
 * socket used and differs between two users owning the same model, which would
 * break the name-based matching. Descriptive suffixes such as "(INDI)" are kept.
 */
export function stripHardwareSuffix(displayName) {
  return String(displayName ?? '')
    .replace(/\s*\([0-9a-f]+(?:[-:._][0-9a-f]+)+\)\s*$/i, '')
    .trim();
}

/**
 * The guide camera, which lives in none of the NINA equipment stores: on PINS
 * it is picked through PHD2 and recorded in the profile by
 * components/guider/PHD2/selectGuiderCam.vue.
 *
 * Deliberately reported as `category: 'camera'`. A guide camera *is* a camera —
 * the same models get used for guiding and imaging depending on the night — and
 * the schema already models "one device, several drivers". So the PHD2 driver
 * becomes another entry on the same device rather than splitting it in two.
 *
 * @param {object} profileInfo NINA profile, holds driver and id without PHD2
 * @param {object} [phd2.equipment] CurrentEquipment, only while PHD2 is connected
 * @param {object} [phd2.cameraIds] driver -> [{Id, Name}] from phd2/camera/ids
 */
export function extractGuideCameraCandidate(profileInfo = {}, { equipment, cameraIds } = {}) {
  const guider = profileInfo?.GuiderSettings;
  if (!guider || typeof guider !== 'object') return null;

  const driverInfo = cleanDriverValue(guider.PHD2Camera);
  if (!driverInfo) return null;

  // The profile stores driver plus an opaque id. The model name has to be
  // resolved, in descending order of trustworthiness:
  //   1. the id list, which is what the selection dropdown itself shows and is
  //      tied to the *configured* camera
  //   2. whatever PHD2 currently has connected, which may be a different one
  //   3. the raw id, so the device stays reportable with no PHD2 at all —
  //      exactly the case most worth reporting
  const configuredId = String(guider.PHD2CameraId ?? '');
  const listed = Array.isArray(cameraIds?.[driverInfo]) ? cameraIds[driverInfo] : [];
  const matched = listed.find((entry) => String(entry?.Id ?? '') === configuredId);

  const camera = equipment?.camera;
  const name = firstNonEmpty(matched?.Name, camera?.name, configuredId);
  if (!name) return null;

  return {
    id: 'guidecam',
    labelKey: 'guidecam',
    category: 'camera',
    name: stripHardwareSuffix(name),
    displayName: '',
    driverInfo,
    driverVersion: '',
    driverCategory: '',
    indiDriver: '',
    connectionType: 'phd2',
    connected: camera?.connected ? 'yes' : 'no',
  };
}

/**
 * Turns the store equipment objects into the candidate list shown in the UI.
 *
 * A connected device is described by NINA itself. A device that is configured
 * but *not* connected is included as well, built from the profile — otherwise
 * the single most valuable report would be impossible to make: "this device
 * does not work" is precisely the case where the user cannot connect it.
 *
 * Such a candidate carries no DriverInfo, because NINA only fills that while a
 * device is connected. Nothing is invented to fill the gap; the reviewer adds
 * the driver when publishing.
 *
 * `id` identifies the row in the UI, `category` is the database value. The two
 * were the same until the guide camera arrived, which shares the camera
 * category but must not share the imaging camera's rating.
 *
 * @param {object} deviceInfos store equipment objects, keyed like DEVICE_CATEGORIES
 * @param {object} [options.profileInfo] active profile, source for disconnected devices
 * @param {object} [options.deviceNames] category -> DisplayName resolved from list-devices
 * @param {object} [options.phd2] `{ equipment, cameraIds }` for the guide camera
 */
export function extractDeviceCandidates(deviceInfos = {}, { profileInfo, deviceNames, phd2 } = {}) {
  const candidates = [];
  const profile = profileInfo || {};
  const names = deviceNames || {};

  for (const [storeKey, category] of Object.entries(DEVICE_CATEGORIES)) {
    const info = deviceInfos[storeKey];

    if (info && typeof info === 'object' && info.Connected) {
      const name = firstNonEmpty(info.Name, info.DisplayName);
      const driverInfo = cleanDriverValue(info.DriverInfo);
      if (!name && !driverInfo) continue;

      const driverCategory = firstNonEmpty(info.Category);
      // Detection runs on the raw name so the "(INDI)" marker survives; only the
      // stripped form is transmitted.
      const displayName = firstNonEmpty(info.DisplayName);
      candidates.push({
        id: category,
        category,
        name,
        displayName: stripHardwareSuffix(displayName),
        driverInfo,
        driverVersion: cleanDriverValue(info.DriverVersion),
        driverCategory,
        indiDriver: '',
        connectionType: detectConnectionType({ driverInfo, driverCategory, displayName }),
        connected: 'yes',
      });
      continue;
    }

    const section = profile[PROFILE_SECTIONS[category]];
    if (!section || typeof section !== 'object') continue;

    // The profile Id is a device identifier; the display name resolved from the
    // device list is friendlier, so prefer it when the caller supplied one.
    const configuredId = cleanDriverValue(section.Id);
    const resolvedName = stripHardwareSuffix(firstNonEmpty(names[category]));
    const name = resolvedName || configuredId;
    if (!name) continue;

    const driverInfo = cleanDriverValue(section.IndiDriver);
    candidates.push({
      id: category,
      category,
      name,
      displayName: resolvedName,
      driverInfo,
      driverVersion: '',
      driverCategory: '',
      indiDriver: '',
      connectionType: detectConnectionType({ driverInfo, driverCategory: '', displayName: name }),
      connected: 'no',
    });
  }

  const guideCamera = extractGuideCameraCandidate(profile, phd2 || {});
  if (guideCamera) candidates.push(guideCamera);

  return candidates.slice(0, MAX_DEVICES);
}

/**
 * Fills in `indiDriver` and a missing `driverVersion` from the PINS 3rd-party
 * package list. The registry itself only carries Name/Label/Type, so the
 * version has to come from the package catalogue via a name match.
 */
export function enrichWithIndiPackages(candidates, packages = []) {
  if (!Array.isArray(packages) || packages.length === 0) return candidates;

  const byName = new Map();
  for (const pkg of packages) {
    const key = normalizeDeviceName(pkg?.name);
    if (key && !byName.has(key)) byName.set(key, pkg);
  }

  return candidates.map((candidate) => {
    if (candidate.connectionType !== 'indi') return candidate;

    const match =
      byName.get(normalizeDeviceName(candidate.driverInfo)) ||
      byName.get(normalizeDeviceName(candidate.name));
    if (!match) return candidate;

    return {
      ...candidate,
      indiDriver: firstNonEmpty(match.name, candidate.driverInfo),
      driverVersion: candidate.driverVersion || firstNonEmpty(match.version),
    };
  });
}

/**
 * The CPU architecture is not exposed by any endpoint. The 3rd-party package
 * list is built for the running system, so its `architecture` field is a
 * reliable stand-in on PINS.
 */
export function extractArchitecture(packages = []) {
  if (!Array.isArray(packages)) return '';
  for (const pkg of packages) {
    const arch = cleanString(pkg?.architecture, 32);
    if (arch) return arch;
  }
  return '';
}

function sanitizeDevice(candidate, rating) {
  const status = VALID_USER_STATUS.has(rating?.status) ? rating.status : null;
  if (!status) return null;

  const device = {};
  for (const field of DEVICE_FIELDS) {
    const value = cleanString(candidate?.[field]);
    if (value) device[field] = value;
  }
  if (!device.name && !device.driverInfo) return null;

  device.userStatus = status;

  const note = cleanString(rating?.note, MAX_NOTE_LENGTH);
  if (note) device.userNote = note;

  return device;
}

/**
 * Assembles the final submission. `ratings` maps a candidate id to
 * `{ status, note }`; candidates the user did not rate are dropped, so an
 * untouched form submits nothing.
 *
 * @returns {object|null} payload, or null when nothing was rated
 */
export function buildSubmissionPayload({
  candidates = [],
  ratings = {},
  installId = '',
  versions = {},
  architecture = '',
  mode = 'nina',
  platform = 'web',
  locale = 'en',
  submittedAt = new Date().toISOString(),
} = {}) {
  const devices = [];
  for (const candidate of candidates) {
    const device = sanitizeDevice(candidate, ratings[candidate?.id]);
    if (device) devices.push(device);
    if (devices.length >= MAX_DEVICES) break;
  }

  if (devices.length === 0) return null;

  const backend = {};
  const pinsVersion = cleanString(versions.pins, 64);
  const apiVersion = cleanString(versions.api, 64);
  const tnsPluginVersion = cleanString(versions.tnsPlugin, 64);
  const arch = cleanString(architecture, 32);
  if (pinsVersion) backend.pinsVersion = pinsVersion;
  if (apiVersion) backend.apiVersion = apiVersion;
  if (tnsPluginVersion) backend.tnsPluginVersion = tnsPluginVersion;
  if (arch) backend.arch = arch;

  return {
    schemaVersion: SCHEMA_VERSION,
    installId: cleanString(installId, 64),
    submittedAt,
    client: {
      tnsVersion: cleanString(versions.tns, 64),
      platform: cleanString(platform, 32),
      mode: mode === 'pins' ? 'pins' : 'nina',
      locale: cleanString(locale, 16),
    },
    backend,
    devices,
  };
}
