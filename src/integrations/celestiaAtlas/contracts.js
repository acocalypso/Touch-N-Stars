const VALID_FRAMES = new Set(['ICRS', 'J2000']);

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
  // NINA's mount API exposes RightAscension in hours and Declination in degrees.
  // The API does not tag an apparent/epoch frame, so callers must provide the
  // proven frame before this value can be rendered or used for follow behavior.
  const frame = mountInfo.CoordinateFrame;
  if (!VALID_FRAMES.has(frame)) throw new TypeError('Mount coordinate frame is unproven');
  return {
    coordinates: toAtlasCoordinates({
      raDeg: mountInfo.RightAscension * 15,
      decDeg: mountInfo.Declination,
      frame,
      epochJulianYear: mountInfo.EpochJulianYear,
    }),
    connected: true,
    stale: Boolean(mountInfo.Stale),
    timestampUtcMs,
  };
}

export function atlasSelectionToFraming(target) {
  if (!target?.name) throw new TypeError('Selected target requires a name');
  const coordinates = toAtlasCoordinates(target.coordinates ?? {});
  return {
    Name: target.name,
    RA: coordinates.raDeg,
    Dec: coordinates.decDeg,
    coordinateFrame: coordinates.frame,
    epochJulianYear: coordinates.epochJulianYear,
  };
}
