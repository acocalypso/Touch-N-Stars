/**
 * App-wide abort signal for HTTP requests.
 *
 * Android kills TCP connections while the app is backgrounded, but the WebView
 * does not know: requests fired before (or across) a background phase sit as
 * zombies in the per-host connection pool for up to ~90s. Since the browser
 * allows only ~6 connections per host, fresh probe requests after resume queue
 * behind those corpses and can stall for the full request timeout.
 *
 * The global axios request interceptor (errorHandler.js) attaches the current
 * signal to every request that does not bring its own. abortInFlightRequests()
 * is called on app resume to fail all stale requests immediately and free the
 * connection slots for the reconnect handshake.
 */

let controller = new AbortController();

export function getHttpAbortSignal() {
  return controller.signal;
}

export function abortInFlightRequests(reason = 'app-resume') {
  const stale = controller;
  controller = new AbortController();
  stale.abort(reason);
}
