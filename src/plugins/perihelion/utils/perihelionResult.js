import i18n from '@/i18n';

/**
 * Turns a Perihelion API response body into the {ok, message} shape every Perihelion
 * action (Quick Track, Add to Sequence, Import/Export/Clear) returns to its caller.
 *
 * Also checks `.Error` alongside `.Message`: the app-wide axios interceptor
 * (`src/utils/errorHandler.js`) intercepts a fully unreachable server and resolves the
 * promise instead of rejecting it, with the failure text under `.Error`, not `.Message` --
 * without this fallback that case reads as a generic "no response" instead of the real reason.
 *
 * @param {object} body
 * @returns {{ ok: boolean, message: string }}
 */
export function describePerihelionResponse(body) {
  return {
    ok: !!body?.Success,
    message: body?.Message ?? body?.Error ?? i18n.global.t('perihelion.status.noResponse'),
  };
}

/**
 * Same shape for the rare case that throws before axios's own promise settles (the
 * interceptor above converts virtually every HTTP/network failure into a resolved response,
 * so this is a fallback path, not the common one).
 *
 * @param {unknown} error
 * @returns {{ ok: boolean, message: string }}
 */
export function describePerihelionError(error) {
  return {
    ok: false,
    message:
      error?.response?.data?.Message ??
      error?.response?.data?.Error ??
      error?.message ??
      i18n.global.t('perihelion.status.unreachable'),
  };
}
