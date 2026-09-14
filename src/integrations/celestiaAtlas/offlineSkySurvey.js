export const CELESTIA_ATLAS_DATA_PATH = '/celestia-atlas-data';
export const DSS_SURVEY_PATH = '/surveys/dss';
export const DSS_SURVEY_MIN_ORDER = 3;
export const DSS_SURVEY_BASE_ORDER = 4;
export const DSS_SURVEY_MAX_ORDER = 7;

// Average stored WebP bytes per tile, the same table the plugin server uses for its
// free-space check (DssSurveyService.AverageTileBytes). Orders 3-4 are measured means of
// the survey that used to be packaged with the app, 5-7 are scaled from sample tiles.
export const DSS_SURVEY_AVERAGE_TILE_BYTES = Object.freeze({
  3: 14_000,
  4: 21_000,
  5: 33_000,
  6: 41_000,
  7: 40_000,
});

function normalizeDataBaseUrl(value) {
  return String(value || CELESTIA_ATLAS_DATA_PATH)
    .trim()
    .replace(/\/+$/, '');
}

export function resolveCelestiaAtlasDataBaseUrl({
  native = false,
  protocol = 'http',
  host = '',
  port = '',
  location = globalThis.location,
} = {}) {
  if (!native) return CELESTIA_ATLAS_DATA_PATH;

  const resolvedHost = String(host || location?.hostname || '').trim();
  if (!resolvedHost) throw new Error('The NINA host is required for native Atlas data');
  const resolvedPort = String(port || '').trim();
  const authority = resolvedPort ? `${resolvedHost}:${resolvedPort}` : resolvedHost;
  return `${protocol || 'http'}://${authority}${CELESTIA_ATLAS_DATA_PATH}`;
}

export function resolveDssSurveyUrl(dataBaseUrl = CELESTIA_ATLAS_DATA_PATH) {
  return `${normalizeDataBaseUrl(dataBaseUrl)}${DSS_SURVEY_PATH}`;
}

/** Number of HiPS tiles in one order: 12 base pixels, each split in four per order. */
export function dssSurveyTileCount(order) {
  return 12 * 4 ** order;
}

/**
 * Estimated download size in bytes for orders `fromOrder`..`toOrder` (inclusive).
 * Used for the size hint per selectable order; the server checks the real free space.
 */
export function estimateDssSurveyBytes(fromOrder, toOrder) {
  let bytes = 0;
  for (let order = fromOrder; order <= toOrder; order += 1) {
    const perTile = DSS_SURVEY_AVERAGE_TILE_BYTES[order];
    if (!perTile) throw new RangeError(`No size estimate for HiPS order ${order}`);
    bytes += perTile * dssSurveyTileCount(order);
  }
  return bytes;
}

/** Parse a HiPS `properties` file (key = value lines, `#` comments) into an object. */
export function parseHipsProperties(text) {
  const properties = {};
  for (const rawLine of String(text ?? '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    properties[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return properties;
}

/** The advertised `hips_order` of a properties file, or null when absent or invalid. */
export function readHipsOrder(text) {
  const value = parseHipsProperties(text).hips_order;
  if (value === undefined) return null;
  const order = Number(value);
  return Number.isInteger(order) && order >= 0 ? order : null;
}

/**
 * Reads the served `properties` file and returns the installed survey order, or null when
 * no survey is installed (404), the server is unreachable or the file is unusable. The
 * plugin server only advertises orders whose tiles are all present, so the returned value
 * can be used as `maxOrder` directly.
 */
export async function loadDssSurveyOrder(dataBaseUrl, fetchImpl = globalThis.fetch) {
  try {
    const response = await fetchImpl(`${resolveDssSurveyUrl(dataBaseUrl)}/properties`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const order = readHipsOrder(await response.text());
    return order !== null && order >= DSS_SURVEY_MIN_ORDER ? order : null;
  } catch {
    return null;
  }
}

/**
 * Survey source for the Atlas viewer. `maxOrder` is the order the plugin server advertises
 * in `properties`; there is no packaged default any more, so the caller must know what is
 * installed (see loadDssSurveyOrder).
 */
export function createDssSkySurveySource(dataBaseUrl, maxOrder) {
  if (!Number.isInteger(maxOrder) || maxOrder < DSS_SURVEY_MIN_ORDER) {
    throw new RangeError(`DSS survey maxOrder must be an integer >= ${DSS_SURVEY_MIN_ORDER}`);
  }
  return Object.freeze({
    key: 'local-dss-color',
    label: 'DSS Color (offline)',
    url: resolveDssSurveyUrl(dataBaseUrl),
    frame: 'ICRS',
    minOrder: DSS_SURVEY_MIN_ORDER,
    maxOrder,
    tileWidth: 512,
    format: 'webp',
    blendStartFovDeg: 170,
    blendFullFovDeg: 130,
    creditLabel:
      'Digitized Sky Survey — STScI/NASA; colored and HiPS-processed by CDS (CNRS/Unistra).',
    attribution:
      'Digitized Sky Survey — STScI/NASA; colored and HiPS-processed by CDS (CNRS/Unistra).',
    attributionUrl:
      'https://alasky.cds.unistra.fr/MocServer/query?ID=CDS%2FP%2FDSS2%2Fcolor&fmt=html&get=record',
    rightsUrl:
      'https://outerspace.stsci.edu/spaces/MASTDATA/pages/176435492/Photographic+Sky+Surveys',
  });
}
