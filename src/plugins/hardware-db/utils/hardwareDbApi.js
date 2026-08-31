/**
 * Client for the TNS Website Hardware DB API.
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

/** Extracts something human-readable out of an API error body. */
export function extractErrorMessage(body, status, fallback) {
  if (body && typeof body === 'object') {
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.error === 'string' && body.error.trim()) {
      const details = Array.isArray(body.details) ? `: ${body.details.join(', ')}` : '';
      return `${body.error}${details}`;
    }
    // Keep compatibility with field-oriented validation responses.
    const firstField = body.data && Object.values(body.data)[0];
    if (firstField && typeof firstField.message === 'string') return firstField.message;
  }
  if (typeof body === 'string' && body.trim()) return body.trim();
  if (status) return `${fallback} (HTTP ${status})`;
  return fallback;
}

export function createHardwareDbApi({
  baseUrl,
  timeout = DEFAULT_TIMEOUT,
  fetchImpl = fetch,
} = {}) {
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
      const response = await fetchImpl(`${root}${path}`, {
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
   * Moderation state is entirely server-owned and intentionally absent here.
   */
  async function submitReport({ reportToken, installId, payload }) {
    return request('/api/hardware-db/submissions', {
      method: 'POST',
      body: {
        schemaVersion: payload?.schemaVersion,
        reportToken,
        installId,
        payload,
      },
    });
  }

  /** Looks up the review state of one's own submission by its token. */
  async function fetchSubmissionStatus(reportToken) {
    const result = await request(
      `/api/hardware-db/submissions/${encodeURIComponent(reportToken)}/status`
    );
    return result?.status || null;
  }

  /**
   * Fetches approved devices and adapts them to the existing local knowledge
   * index shape.
   */
  async function fetchKnowledge({ signal } = {}) {
    const result = await request('/api/hardware-db?pageSize=100', { signal });
    const items = Array.isArray(result?.items) ? result.items : [];

    return {
      entries: items.map((item) => ({
        id: String(item.id),
        driver: item.driverInfo || item.indiDriver || item.name,
        status: item.userStatus,
        reportCount: 1,
        expand: {
          device: {
            category: item.category,
            vendor: item.manufacturer || '',
            model: item.model || item.displayName || item.name,
            aliases: [item.name, item.displayName].filter(Boolean),
          },
        },
      })),
      notes: items
        .filter((item) => item.notes)
        .map((item) => ({
          id: `note-${item.id}`,
          entry: String(item.id),
          text: item.notes,
        })),
    };
  }

  return { submitReport, fetchSubmissionStatus, fetchKnowledge };
}
