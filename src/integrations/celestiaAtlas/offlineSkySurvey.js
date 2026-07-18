export const CELESTIA_ATLAS_DATA_PATH = '/celestia-atlas-data';

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

export function createDssSkySurveySource(dataBaseUrl = CELESTIA_ATLAS_DATA_PATH) {
  return Object.freeze({
    key: 'packaged-dss-color',
    label: 'DSS Color (offline)',
    url: `${normalizeDataBaseUrl(dataBaseUrl)}/surveys/dss`,
    frame: 'ICRS',
    minOrder: 3,
    maxOrder: 4,
    tileWidth: 512,
    format: 'webp',
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

export const PACKAGED_DSS_SKY_SURVEY_SOURCE = createDssSkySurveySource();
