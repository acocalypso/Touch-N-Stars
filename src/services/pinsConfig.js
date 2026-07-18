// Central configuration for the PINS daemon connection.
// The token is a shared default device token (not a per-user secret) and can be
// overridden via instance settings or localStorage, see resolvePinsDaemonApiToken()
// in apiService.js.
export const PINS_PORT = 8000;
export const DEFAULT_PINS_DAEMON_API_TOKEN =
  'zZDqJ3IKeFaIZqG2JIFvsxzA5E48GC2gyGVagHFZqC0OMtgoupUDZCPhQDYKm35d';
