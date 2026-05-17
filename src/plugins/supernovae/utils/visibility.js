// Tonight visibility for a given RA/Dec from an observer's lat/lon.
// Returns: 'circumpolar' | 'visible' | 'hidden'
//
// 'circumpolar' — always above 15° from this latitude (never sets usefully low)
// 'visible'     — rises above 15° altitude during the 12-hour window around midnight tonight
// 'hidden'      — never rises above 15° from this latitude (or only during daytime)

const DEG = Math.PI / 180;
const MIN_ALT_DEG = 15;

// Greenwich Mean Sidereal Time in degrees at a given Date
function gmst(date) {
  const JD = date.getTime() / 86400000 + 2440587.5;
  const d = JD - 2451545.0;
  const T = d / 36525;
  const g = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T;
  return ((g % 360) + 360) % 360;
}

export function nightVisibility(raDeg, decDeg, lat, lon) {
  if (lat === null || lat === undefined || lon === null || lon === undefined) return null;

  const latR = lat * DEG;
  const decR = decDeg * DEG;
  const minAltR = MIN_ALT_DEG * DEG;

  // Hour angle half-width above minAlt
  const cosH =
    (Math.sin(minAltR) - Math.sin(latR) * Math.sin(decR)) / (Math.cos(latR) * Math.cos(decR));

  if (cosH > 1) return 'hidden'; // never reaches 15°
  if (cosH < -1) return 'circumpolar'; // always above 15°

  const H0 = Math.acos(cosH) / DEG; // HA half-width in degrees

  // LST at UT midnight tonight at observer longitude
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const lst = (((gmst(midnight) + lon) % 360) + 360) % 360;

  // Hour angle of object at midnight
  let HA = lst - raDeg;
  if (HA > 180) HA -= 360;
  if (HA < -180) HA += 360;

  // Object is above minAlt when |HA| < H0.
  // Night spans roughly ±90° of HA around midnight.
  // Visible if the above-horizon window overlaps the night window.
  return Math.abs(HA) < H0 + 90 ? 'visible' : 'hidden';
}
