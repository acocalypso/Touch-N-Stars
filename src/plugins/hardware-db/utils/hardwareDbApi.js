/**
 * Client for the PocketBase instance that stores the hardware knowledge base.
 *
 * Deliberately built on `fetch` rather than axios: the global axios interceptor
 * in src/utils/errorHandler.js resolves network failures into a fake
 * `{ Success: false, StatusCode: 500 }` response and raises a toast. Both are
 * wrong here — this plugin talks to a public server that is simply unreachable
 * whenever the user sits on a PINS access point without internet, and that must
 * degrade quietly.
 *
 * Built as an injectable factory (same shape as the logfile-collector's
 * createDiagnosticsApi) so the calling code stays testable without HTTP mocks.
 */

const DEFAULT_TIMEOUT = 15000;

export const COLLECTIONS = Object.freeze({
  submissions: 'hw_submissions',
  submissionStatus: 'hw_submission_status',
  entries: 'hw_entries',
  notes: 'hw_notes',
});

/** Extracts something human-readable out of a PocketBase error body. */
export function extractErrorMessage(body, status, fallback) {
  if (body && typeof body === 'object') {
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    // PocketBase reports per-field validation errors under `data`.
    const firstField = body.data && Object.values(body.data)[0];
    if (firstField && typeof firstField.message === 'string') return firstField.message;
  }
  if (typeof body === 'string' && body.trim()) return body.trim();
  if (status) return `${fallback} (HTTP ${status})`;
  return fallback;
}

export function createHardwareDbApi({ baseUrl, timeout = DEFAULT_TIMEOUT } = {}) {
  const root = String(baseUrl || '').replace(/\/+$/, '');

  async function request(path, { method = 'GET', body, signal } = {}) {
    if (!root) throw new Error('Hardware database URL is not configured');

    // Compose the caller's signal with our own timeout so a hanging request
    // cannot pin the UI in a loading state forever.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort);

    try {
      const response = await fetch(`${root}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const text = await response.text();
      let parsed = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = text;
      }

      if (!response.ok) {
        const error = new Error(
          extractErrorMessage(parsed, response.status, 'Hardware database request failed')
        );
        error.httpStatus = response.status;
        throw error;
      }

      return parsed;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }

  /**
   * Creates a submission. It lands with status "pending" and stays invisible
   * until it is reviewed — the create rule is public, the read rules are not.
   *
   * `status` is sent explicitly because the server-side create rule pins it to
   * "pending". Without that rule anyone could post a record that is already
   * approved and walk straight past the review queue; the client therefore has
   * to state the only value the rule accepts.
   */
  async function submitReport({ reportToken, installId, payload }) {
    return request(`/api/collections/${COLLECTIONS.submissions}/records`, {
      method: 'POST',
      body: {
        schemaVersion: payload?.schemaVersion,
        reportToken,
        installId,
        payload,
        status: 'pending',
      },
    });
  }

  /** Looks up the review state of one's own submission by its token. */
  async function fetchSubmissionStatus(reportToken) {
    const filter = encodeURIComponent(`reportToken="${reportToken}"`);
    const result = await request(
      `/api/collections/${COLLECTIONS.submissionStatus}/records?perPage=1&filter=${filter}`
    );
    return result?.items?.[0]?.status || null;
  }

  /**
   * Fetches the published knowledge base: entries with their device, plus the
   * approved notes. Two requests rather than one back-relation expand — the
   * expand syntax for reverse relations varies between PocketBase versions,
   * while two small GETs work everywhere.
   */
  async function fetchKnowledge({ signal } = {}) {
    const [entryResult, noteResult] = await Promise.all([
      request(`/api/collections/${COLLECTIONS.entries}/records?perPage=500&expand=device`, {
        signal,
      }),
      request(`/api/collections/${COLLECTIONS.notes}/records?perPage=500`, { signal }),
    ]);

    return {
      entries: Array.isArray(entryResult?.items) ? entryResult.items : [],
      notes: Array.isArray(noteResult?.items) ? noteResult.items : [],
    };
  }

  return { submitReport, fetchSubmissionStatus, fetchKnowledge };
}
