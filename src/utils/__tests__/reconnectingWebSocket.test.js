import test from 'node:test';
import assert from 'node:assert/strict';
import { ReconnectingWebSocket } from '../reconnectingWebSocket.js';

// --- Fake WebSocket ---------------------------------------------------------
// Minimal stand-in for the browser WebSocket. Tests drive the lifecycle
// manually via emitOpen/emitClose/emitMessage/emitError.

const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;
const CONNECTING = 0;

let liveSockets = [];

class FakeWebSocket {
  static get CONNECTING() {
    return CONNECTING;
  }
  static get OPEN() {
    return OPEN;
  }
  static get CLOSING() {
    return CLOSING;
  }
  static get CLOSED() {
    return CLOSED;
  }

  constructor(url) {
    this.url = url;
    this.readyState = CONNECTING;
    this.bufferedAmount = 0;
    this.sent = [];
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    liveSockets.push(this);
  }

  send(data) {
    this.sent.push(data);
  }

  close() {
    if (this.readyState === CLOSED) return;
    this.readyState = CLOSED;
    if (this.onclose) this.onclose({ code: 1000, reason: 'closed by test' });
  }

  emitOpen() {
    this.readyState = OPEN;
    if (this.onopen) this.onopen();
  }

  emitMessage(data) {
    if (this.onmessage) this.onmessage({ data });
  }

  emitError(message = 'boom') {
    if (this.onerror) this.onerror({ message });
  }

  emitClose(code = 1006, reason = 'abnormal') {
    this.readyState = CLOSED;
    if (this.onclose) this.onclose({ code, reason });
  }
}

// --- Controllable timers ----------------------------------------------------

function makeTimers() {
  let nextId = 1;
  const pending = new Map(); // id -> { fn, due }
  let now = 0;

  return {
    setTimeoutFn(fn, ms) {
      const id = nextId++;
      pending.set(id, { fn, due: now + ms });
      return id;
    },
    clearTimeoutFn(id) {
      pending.delete(id);
    },
    // Advance virtual time to now+ms, firing every timer as its due time is
    // reached - including timers scheduled by earlier callbacks in this window.
    // Async so the promise microtask queue (e.g. a rejected connect()'s .finally
    // that clears the dedup pointer) drains between timer callbacks, matching how
    // real timers interleave with microtasks.
    async advance(ms) {
      const target = now + ms;
      let guard = 0;
      while (true) {
        if (++guard > 100000) throw new Error('timer advance did not settle');
        const upcoming = [...pending.entries()]
          .filter(([, t]) => t.due <= target)
          .sort((a, b) => a[1].due - b[1].due);
        if (upcoming.length === 0) break;
        const [id, t] = upcoming[0];
        pending.delete(id);
        now = t.due;
        t.fn();
        // Let queued microtasks (promise .then/.finally) run before the next timer
        await Promise.resolve();
      }
      now = target;
    },
    pendingCount() {
      return pending.size;
    },
  };
}

function setup(t, overrides = {}) {
  liveSockets = [];
  globalThis.WebSocket = FakeWebSocket;
  const timers = makeTimers();
  const statuses = [];
  const rws = new ReconnectingWebSocket({
    name: 'Test',
    getUrl: () => 'ws://localhost:1234/test',
    backoffInitialMs: 500,
    backoffFactor: 1.8,
    backoffMaxMs: 10000,
    connectTimeoutMs: 5000,
    onStatus: (s) => statuses.push(s),
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
    ...overrides,
  });
  // Stop the reconnect loop after the test so its timers/sockets don't leak into
  // the next test (which the node test runner flags as async activity).
  if (t && typeof t.after === 'function') {
    t.after(() => rws.disconnect());
  }
  return { rws, timers, statuses, lastSocket: () => liveSockets[liveSockets.length - 1] };
}

// --- Tests ------------------------------------------------------------------

test('connect resolves on open', async (t) => {
  const { rws, lastSocket } = setup(t);
  const p = rws.connect();
  lastSocket().emitOpen();
  await p;
  assert.equal(rws.isOpen(), true);
});

test('connect rejects on timeout and closes the socket', async (t) => {
  const { rws, timers, lastSocket } = setup(t);
  const p = rws.connect(5000);
  const socket = lastSocket();
  await timers.advance(5000);
  await assert.rejects(p, /connection timeout/);
  assert.equal(socket.readyState, CLOSED);
});

test('connect rejects when socket closes before opening', async (t) => {
  const { rws, lastSocket } = setup(t);
  const p = rws.connect();
  lastSocket().emitClose();
  await assert.rejects(p, /closed before connection was established/);
});

test('concurrent connect() calls piggyback on the same promise', (t) => {
  const { rws } = setup(t);
  const p1 = rws.connect();
  const p2 = rws.connect();
  assert.equal(p1, p2);
});

test('stale socket handlers are ignored after a superseding connect()', async (t) => {
  const { rws, lastSocket } = setup(t);
  const p1 = rws.connect();
  const firstSocket = lastSocket();
  // disconnect drops the dedup pointer so a new connect() is not piggybacked
  rws.disconnect();
  const p2 = rws.connect();
  const secondSocket = lastSocket();
  assert.notEqual(firstSocket, secondSocket);

  // The first (superseded) socket opening must not mark the service connected
  firstSocket.emitOpen();
  assert.equal(rws.isOpen(), false);

  // The current socket opening does
  secondSocket.emitOpen();
  await p2;
  assert.equal(rws.isOpen(), true);
  await assert.rejects(p1);
});

test('backoff grows and is capped, resets on open', async (t) => {
  const { rws, timers, lastSocket } = setup(t);
  rws.connect();
  // Fail the initial attempt -> schedules reconnect at 500
  lastSocket().emitClose();
  assert.equal(timers.pendingCount(), 1);

  // 1st reconnect fires at 500, fails -> next scheduled at 900
  await timers.advance(500);
  lastSocket().emitClose();
  // 2nd reconnect fires at 900, fails -> next scheduled at 1620
  await timers.advance(900);
  lastSocket().emitClose();
  await timers.advance(1620);
  // Now open successfully
  lastSocket().emitOpen();
  assert.equal(rws.isOpen(), true);

  // After success the next failure should start over at 500 again
  lastSocket().emitClose();
  // Fire it - if backoff reset correctly this fires at 500
  await timers.advance(499);
  assert.equal(rws.isOpen(), false); // not yet reconnected (would be 500)
  await timers.advance(1);
  lastSocket().emitOpen();
  assert.equal(rws.isOpen(), true);
});

test('backoff delay is exact per attempt, not just eventually reached', async (t) => {
  // Regression test: connect() must not reset the backoff when it's invoked by
  // the internal reconnect loop, or every attempt silently falls back to
  // backoffInitialMs regardless of how many times it has failed. Unlike the
  // "grows and is capped" test above, this asserts no-dial-yet at each delay
  // boundary instead of only checking cumulative time, so a flat 500ms retry
  // loop cannot pass by accident.
  const { rws, timers, lastSocket } = setup(t);
  const socketsAfter = () => liveSockets.length;

  rws.connect();
  assert.equal(socketsAfter(), 1);
  lastSocket().emitClose(); // schedules reconnect at 500

  await timers.advance(499);
  assert.equal(socketsAfter(), 1, 'must not redial before the 500ms delay elapses');
  await timers.advance(1);
  assert.equal(socketsAfter(), 2, 'redials once the 500ms delay elapses');
  lastSocket().emitClose(); // schedules reconnect at 900

  await timers.advance(899);
  assert.equal(socketsAfter(), 2, 'must not redial before the 900ms delay elapses');
  await timers.advance(1);
  assert.equal(socketsAfter(), 3, 'redials once the 900ms delay elapses');
  lastSocket().emitClose(); // schedules reconnect at 1620

  await timers.advance(1619);
  assert.equal(socketsAfter(), 3, 'must not redial before the 1620ms delay elapses');
  await timers.advance(1);
  assert.equal(socketsAfter(), 4, 'redials once the 1620ms delay elapses');
});

test('manual connect() resets backoff and cancels the pending reconnect timer', (t) => {
  const { rws, timers, lastSocket } = setup(t);
  rws.connect();
  lastSocket().emitClose(); // schedules a reconnect at 500
  assert.equal(timers.pendingCount(), 1);

  // A manual connect() should cancel that timer and dial immediately
  rws.connect();
  assert.equal(timers.pendingCount(), 1); // now it's the connect timeout, not the reconnect
  lastSocket().emitOpen();
  assert.equal(rws.isOpen(), true);
});

test('disconnect() cancels pending reconnect and stops the loop', async (t) => {
  const { rws, timers, lastSocket } = setup(t);
  rws.connect();
  lastSocket().emitClose(); // schedules reconnect
  assert.ok(timers.pendingCount() >= 1);

  rws.disconnect();
  assert.equal(timers.pendingCount(), 0);

  // Advancing time must not produce a new socket
  const before = liveSockets.length;
  await timers.advance(60000);
  assert.equal(liveSockets.length, before);
});

test('disconnect(); connect() dials a fresh socket', async (t) => {
  const { rws, lastSocket } = setup(t);
  const p1 = rws.connect();
  lastSocket().emitOpen();
  await p1;
  const first = lastSocket();

  rws.disconnect();
  const p2 = rws.connect();
  const second = lastSocket();
  assert.notEqual(first, second);
  second.emitOpen();
  await p2;
  assert.equal(rws.isOpen(), true);
});

test('predicate false: no dial, idle recheck keeps the loop alive, resumes when true', async (t) => {
  let allowed = false;
  const { rws, timers, lastSocket } = setup(t, { canReconnect: () => allowed });
  rws.connect();
  const socketsAfterFirstDial = liveSockets.length;
  lastSocket().emitClose(); // gate is closed -> should NOT dial, should idle-recheck

  // Advance a full max-backoff cadence: still no new socket while gate is closed
  await timers.advance(10000);
  assert.equal(liveSockets.length, socketsAfterFirstDial);

  // Open the gate; the next recheck sees canDial and dials (after the backoff).
  allowed = true;
  await timers.advance(11000);
  assert.ok(liveSockets.length > socketsAfterFirstDial, 'dialed again once gate opened');
  // Open the freshly dialed socket to prove the loop recovered the connection.
  lastSocket().emitOpen();
  assert.equal(rws.isOpen(), true);
});

test('getUrl() returning null: connect rejects and creates no socket', async (t) => {
  let url = null;
  const { rws, lastSocket } = setup(t, { getUrl: () => url });

  const p = rws.connect();
  await assert.rejects(p, /no URL available/);
  assert.equal(liveSockets.length, 0, 'no socket created while URL is null');

  // Once a URL exists, connect() dials normally
  url = 'ws://localhost:9/x';
  const p2 = rws.connect();
  assert.equal(liveSockets.length, 1);
  lastSocket().emitOpen();
  await p2;
  assert.equal(rws.isOpen(), true);
});

test('connect() with a null URL from the very first attempt self-heals without a second manual connect()', async (t) => {
  // Regression test: unlike the test above (which recovers via a second manual
  // connect() call), a real caller like a mounting page only calls connect()
  // once. If that first attempt hits a null URL (e.g. the API port handshake
  // hasn't finished yet), the reconnect loop must arm itself here - onclose
  // never fires to do it, since no socket was ever created.
  let url = null;
  const { rws, timers, lastSocket } = setup(t, { getUrl: () => url });

  const p = rws.connect();
  await assert.rejects(p, /no URL available/);
  assert.equal(liveSockets.length, 0, 'no socket created while URL is null');
  assert.equal(timers.pendingCount(), 1, 'an idle-recheck timer must be armed');

  // URL becomes available later, purely through the idle-recheck loop - no
  // second connect() call from the caller. The recheck fires at the max-backoff
  // cadence (10000ms), then schedules the actual dial after one more backoff
  // delay, so give it more than 10000ms total.
  url = 'ws://localhost:9/x';
  await timers.advance(11000);
  assert.equal(liveSockets.length, 1, 'the idle recheck dialed on its own once the URL appeared');
  lastSocket().emitOpen();
  assert.equal(rws.isOpen(), true);
});

test('idle recheck keeps the loop alive while getUrl() is null, then dials', async (t) => {
  let url = 'ws://localhost:9/x';
  const { rws, timers, lastSocket } = setup(t, { getUrl: () => url });
  rws.connect();
  const socketsAfterFirstDial = liveSockets.length;

  // URL disappears, then the socket drops -> gate closed via null URL
  url = null;
  lastSocket().emitClose();
  await timers.advance(10000);
  assert.equal(liveSockets.length, socketsAfterFirstDial, 'no dial while URL null');

  // URL comes back; the next idle recheck sees canDial and dials (after the backoff).
  url = 'ws://localhost:9/x';
  await timers.advance(11000);
  assert.ok(liveSockets.length > socketsAfterFirstDial, 'dialed again once URL returned');
  lastSocket().emitOpen();
  assert.equal(rws.isOpen(), true);
});

test('send() returns false and does not throw when not open', (t) => {
  const { rws } = setup(t);
  assert.doesNotThrow(() => {
    const ok = rws.send({ hello: 'world' });
    assert.equal(ok, false);
  });
});

test('send() stringifies objects and returns true when open', async (t) => {
  const { rws, lastSocket } = setup(t);
  const p = rws.connect();
  lastSocket().emitOpen();
  await p;
  const ok = rws.send({ action: 'subscribe', eventType: 'IMAGE-SAVE' });
  assert.equal(ok, true);
  assert.equal(lastSocket().sent[0], '{"action":"subscribe","eventType":"IMAGE-SAVE"}');
});

test('lastMessageAt is updated on message', async (t) => {
  const { rws, lastSocket } = setup(t);
  const p = rws.connect();
  lastSocket().emitOpen();
  await p;
  const before = rws.lastMessageAt;
  assert.ok(before !== null);
  await new Promise((r) => setTimeout(r, 2));
  lastSocket().emitMessage('{"foo":1}');
  assert.ok(rws.lastMessageAt >= before);
});

test('onMessage receives parsed JSON and raw strings', async (t) => {
  const received = [];
  const { rws, lastSocket } = setup(t, { onMessage: (m) => received.push(m) });
  const p = rws.connect();
  lastSocket().emitOpen();
  await p;
  lastSocket().emitMessage('{"a":1}');
  lastSocket().emitMessage('plain text');
  assert.deepEqual(received[0], { a: 1 });
  assert.equal(received[1], 'plain text');
});

test('onOpen / onClose callbacks fire', async (t) => {
  const events = [];
  const { rws, lastSocket } = setup(t, {
    onOpen: () => events.push('open'),
    onClose: () => events.push('close'),
  });
  const p = rws.connect();
  lastSocket().emitOpen();
  await p;
  rws.disconnect();
  assert.deepEqual(events, ['open', 'close']);
});
