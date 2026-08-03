import apiPinsService from '@/services/apiPinsService';

/**
 * Shared helpers for PINS daemon jobs (`POST /...` -> jobId -> `GET /jobs/{id}`).
 * Extracted from views/pins.vue so the setup wizard tracks jobs the same way.
 */

/**
 * @param {unknown} data - raw response of a job-creating daemon call
 * @returns {string|number|null} the job id, or null when the response carries none
 */
export function parseJobIdFromResponse(data) {
  if (data && typeof data === 'object' && data.jobId) {
    return data.jobId;
  }
  if (typeof data === 'string' || typeof data === 'number') {
    return data;
  }
  return null;
}

export function isJobSuccess(result) {
  const statusValue = String(result?.status || '').toLowerCase();
  return (
    statusValue === 'success' ||
    statusValue === 'completed' ||
    result?.exit_code === 0 ||
    result?.exitCode === 0 ||
    result?.success === true
  );
}

export function isJobFailed(result) {
  const statusValue = String(result?.status || '').toLowerCase();
  return (
    statusValue === 'failed' ||
    (typeof result?.exit_code === 'number' && result.exit_code !== 0) ||
    (typeof result?.exitCode === 'number' && result.exitCode !== 0) ||
    result?.success === false
  );
}

/**
 * Polls `/jobs/{id}` until the job succeeded, failed, or the attempt budget ran out.
 *
 * @param {string|number} id - job id returned by the daemon
 * @param {{ intervalMs?: number, maxAttempts?: number, onStatusChange?: (status: string) => void }} [options]
 *   onStatusChange fires only when the status string actually changes, so callers
 *   can log transitions without spamming one line per poll.
 * @returns {Promise<{ success: boolean, result: object }>}
 */
export async function pollJobUntilFinished(
  id,
  { intervalMs = 2000, maxAttempts = 120, onStatusChange } = {}
) {
  let lastStatus = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = (await apiPinsService.getPinsDaemonJob(id)) || {};
    const currentStatus = String(result.status || '').toLowerCase();

    if (currentStatus && currentStatus !== lastStatus) {
      onStatusChange?.(currentStatus);
      lastStatus = currentStatus;
    }

    if (isJobSuccess(result)) {
      return { success: true, result };
    }

    if (isJobFailed(result)) {
      return { success: false, result };
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return { success: false, result: { status: 'timeout' } };
}
