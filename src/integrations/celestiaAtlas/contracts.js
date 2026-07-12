const VALID_FRAMES = new Set(['ICRS', 'J2000']);

// Transpose of the IAU SOFA 2023-10-11 iauFk5hip orientation matrix:
// Hipparcos/ICRS to FK5 equinox and epoch J2000.0.
// https://www.iausofa.org/current-software
const ICRS_TO_J2000 = [
  [0.9999999999999929, -0.00000011102233084587464, -0.00000004411805033656962],
  [0.00000011102233510229197, 0.9999999999999892, 0.00000009647792009175314],
  [0.00000004411803962536558, -0.00000009647792498984142, 0.9999999999999943],
];
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export function normalizeRaDeg(value) {
  if (value >= 0 && value < 360) return value;
  return ((value % 360) + 360) % 360;
}

export function toAtlasCoordinates({ raDeg, decDeg, frame, epochJulianYear }) {
  if (!Number.isFinite(raDeg) || !Number.isFinite(decDeg)) {
    throw new TypeError('Atlas coordinates require finite decimal degrees');
  }
  if (!VALID_FRAMES.has(frame)) {
    throw new TypeError('Atlas coordinates require an explicit ICRS or J2000 frame');
  }
  if (decDeg < -90 || decDeg > 90) throw new RangeError('Declination is outside [-90, 90]');
  if (frame === 'J2000' && epochJulianYear !== undefined && !Number.isFinite(epochJulianYear)) {
    throw new TypeError('J2000 epochJulianYear must be finite when supplied');
  }
  return {
    raDeg: normalizeRaDeg(raDeg),
    decDeg,
    frame,
    ...(epochJulianYear === undefined ? {} : { epochJulianYear }),
  };
}

export function ninaObserverToAtlas(astrometrySettings) {
  const latitudeDeg = astrometrySettings?.Latitude;
  const longitudeDeg = astrometrySettings?.Longitude;
  const elevationM = astrometrySettings?.Elevation ?? 0;
  if (![latitudeDeg, longitudeDeg, elevationM].every(Number.isFinite)) {
    throw new TypeError('NINA astrometry settings do not contain a finite observer');
  }
  if (latitudeDeg < -90 || latitudeDeg > 90) throw new RangeError('Observer latitude is invalid');
  return {
    latitudeDeg,
    longitudeDeg: ((((longitudeDeg + 180) % 360) + 360) % 360) - 180,
    elevationM,
  };
}

export function ninaMountToAtlas(mountInfo, timestampUtcMs = Date.now()) {
  if (!mountInfo?.Connected) return null;
  const source = mountInfo.Coordinates ?? {};
  const epoch = source.Epoch ?? mountInfo.EquatorialSystem;
  if (epoch !== 'J2000') {
    throw new TypeError(`Unsupported mount coordinate epoch: ${epoch ?? 'unknown'}`);
  }
  const raDeg = source.RADegrees ?? mountInfo.RightAscension * 15;
  const decDeg = source.Dec ?? mountInfo.Declination;
  return {
    coordinates: toAtlasCoordinates({
      raDeg,
      decDeg,
      frame: 'J2000',
      epochJulianYear: 2000,
    }),
    connected: true,
    stale: Boolean(mountInfo.Stale),
    timestampUtcMs,
  };
}

export function toNinaJ2000Coordinates(value) {
  const coordinates = toAtlasCoordinates(value);
  if (coordinates.frame === 'J2000') {
    return {
      raDeg: coordinates.raDeg,
      decDeg: coordinates.decDeg,
      frame: 'J2000',
      epochJulianYear: 2000,
    };
  }

  const ra = coordinates.raDeg * DEG_TO_RAD;
  const dec = coordinates.decDeg * DEG_TO_RAD;
  const cosDec = Math.cos(dec);
  const vector = [cosDec * Math.cos(ra), cosDec * Math.sin(ra), Math.sin(dec)];
  const [x, y, z] = ICRS_TO_J2000.map(
    (row) => row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2]
  );

  return {
    raDeg: normalizeRaDeg(Math.atan2(y, x) * RAD_TO_DEG),
    decDeg: Math.atan2(z, Math.hypot(x, y)) * RAD_TO_DEG,
    frame: 'J2000',
    epochJulianYear: 2000,
  };
}

export function atlasSearchResultToTarget(result) {
  if (!result || typeof result !== 'object') {
    throw new TypeError('Atlas search result is required');
  }
  const id = result.id ?? result.catalogId;
  const name = result.name || id;
  if (typeof id !== 'string' || !id.trim() || typeof name !== 'string' || !name.trim()) {
    throw new TypeError('Atlas search result requires an id and name');
  }
  const coordinates = toAtlasCoordinates(result.coordinates ?? result);
  return {
    id,
    name,
    aliases: result.aliases,
    objectType: result.type,
    parentBody: result.parentBody,
    magnitude: result.mag,
    catalogueSource: result.catalogSource,
    coordinates,
  };
}

export function atlasSelectionToFraming(target) {
  if (!target?.name) throw new TypeError('Selected target requires a name');
  const sourceCoordinates = toAtlasCoordinates(target.coordinates ?? {});
  const coordinates = toNinaJ2000Coordinates(sourceCoordinates);
  return {
    Name: target.name,
    RA: coordinates.raDeg,
    Dec: coordinates.decDeg,
    coordinateFrame: 'J2000',
    epochJulianYear: 2000,
    sourceCoordinateFrame: sourceCoordinates.frame,
  };
}
