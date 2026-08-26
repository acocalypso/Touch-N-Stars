// Every plate solve in NINA and PINS goes through ImageSolver.Solve(), which
// logs a single "Platesolve successful: ... Position Angle: <deg>" line. That
// line is the only choke point the app can observe for solves triggered by the
// sequencer (Center, SolveAndRotate, CenterAfterDriftTrigger, meridian flip),
// so the solved camera rotation is derived from it.
import { positionAngleFromNinaPlateSolve } from '@/integrations/celestiaAtlas/positionAngle';

// The log line is written in the NINA UI culture, so the decimal separator is
// either "." (invariant) or "," (e.g. German).
const PLATESOLVE_SUCCESS_PATTERN =
  /Platesolve successful[\s\S]*?Position\s*Angle\s*:\s*(-?\d+(?:[.,]\d+)?)/i;

/**
 * Extracts the solved sky position angle from a NINA log message.
 *
 * Pure function: returns the angle normalised to [0, 360) via the same
 * conversion the manual "get camera rotation" path uses, or null when the
 * message is not a successful solve or carries no parsable angle.
 */
export function parseSolvedPositionAngle(message) {
  if (typeof message !== 'string') return null;
  const match = PLATESOLVE_SUCCESS_PATTERN.exec(message);
  if (!match) return null;
  return positionAngleFromNinaPlateSolve(match[1].replace(',', '.'));
}

/**
 * Returns the newest successful solve in a log array as
 * `{ angle, timestamp }`, or null when there is none.
 *
 * The backend returns the logs newest-first, but that is not guaranteed, so
 * the newest entry is picked by timestamp.
 */
export function findLatestSolvedRotation(logs) {
  if (!Array.isArray(logs)) return null;
  let latest = null;
  for (const log of logs) {
    if (!log || typeof log.message !== 'string') continue;
    const angle = parseSolvedPositionAngle(log.message);
    if (angle === null) continue;
    const time = new Date(log.timestamp).getTime();
    if (!Number.isFinite(time)) continue;
    if (!latest || time > latest.time) {
      latest = { angle, timestamp: log.timestamp, time };
    }
  }
  if (!latest) return null;
  return { angle: latest.angle, timestamp: latest.timestamp };
}
