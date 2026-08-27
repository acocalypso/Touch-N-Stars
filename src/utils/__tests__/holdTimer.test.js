import test from 'node:test';
import assert from 'node:assert/strict';
import { createHoldTimer } from '@/utils/holdTimer';

// Controllable clock + interval, same approach as reconnectingWebSocket.test.js:
// the timer under test never touches the real event loop.
function makeClock() {
  let currentTime = 0;
  const intervals = new Map();
  let nextId = 1;

  return {
    now: () => currentTime,
    setIntervalFn(fn, ms) {
      const id = nextId++;
      intervals.set(id, { fn, ms, nextRun: currentTime + ms });
      return id;
    },
    clearIntervalFn(id) {
      intervals.delete(id);
    },
    pendingCount: () => intervals.size,
    // Advances time in tick-sized steps so every scheduled run fires in order.
    advance(ms) {
      const target = currentTime + ms;
      for (;;) {
        let due = null;
        for (const [id, entry] of intervals) {
          if (entry.nextRun <= target && (due === null || entry.nextRun < due[1].nextRun)) {
            due = [id, entry];
          }
        }
        if (!due) break;
        const [id, entry] = due;
        currentTime = entry.nextRun;
        entry.nextRun = currentTime + entry.ms;
        entry.fn();
        // The callback may have cleared itself (completion).
        if (!intervals.has(id)) continue;
      }
      currentTime = target;
    },
    // Simulates a throttled WebView: no tick fires until well past the deadline.
    skipTo(ms) {
      currentTime += ms;
      for (const entry of intervals.values()) {
        entry.nextRun = currentTime;
      }
    },
  };
}

function setup(overrides = {}) {
  const clock = makeClock();
  const progress = [];
  let completions = 0;
  const timer = createHoldTimer({
    durationMs: 2000,
    tickMs: 50,
    onProgress: (value) => progress.push(value),
    onComplete: () => {
      completions += 1;
    },
    now: clock.now,
    setIntervalFn: clock.setIntervalFn,
    clearIntervalFn: clock.clearIntervalFn,
    ...overrides,
  });
  return { clock, timer, progress, completions: () => completions };
}

test('rejects a non-positive duration', () => {
  assert.throws(() => createHoldTimer({ durationMs: 0 }));
});

test('reports rising progress while held', () => {
  const { clock, timer, progress, completions } = setup();

  timer.start();
  assert.equal(progress.at(-1), 0);

  clock.advance(500);
  assert.equal(progress.at(-1), 0.25);

  clock.advance(500);
  assert.equal(progress.at(-1), 0.5);
  assert.equal(completions(), 0);
});

test('completes exactly once after the full duration', () => {
  const { clock, timer, progress, completions } = setup();

  timer.start();
  clock.advance(2000);

  assert.equal(completions(), 1);
  assert.equal(progress.at(-1), 1);
  assert.equal(timer.isRunning(), false);
  assert.equal(clock.pendingCount(), 0);

  clock.advance(2000);
  assert.equal(completions(), 1);
});

test('resets and never completes when released early', () => {
  const { clock, timer, progress, completions } = setup();

  timer.start();
  clock.advance(1900);
  timer.cancel();

  assert.equal(progress.at(-1), 0);
  assert.equal(timer.isRunning(), false);

  clock.advance(5000);
  assert.equal(completions(), 0);
});

test('a throttled tick does not stretch the hold', () => {
  const { clock, timer, completions } = setup();

  timer.start();
  // A single, very late tick: elapsed time decides, not the tick count.
  clock.skipTo(2500);
  clock.advance(0);

  assert.equal(completions(), 1);
});

test('restarts from zero when start() is called again', () => {
  const { clock, timer, progress, completions } = setup();

  timer.start();
  clock.advance(1500);
  timer.start();
  assert.equal(progress.at(-1), 0);

  clock.advance(1500);
  assert.equal(completions(), 0);

  clock.advance(500);
  assert.equal(completions(), 1);
});

test('stops firing after dispose()', () => {
  const { clock, timer, completions } = setup();

  timer.start();
  timer.dispose();
  clock.advance(5000);
  assert.equal(completions(), 0);
  assert.equal(clock.pendingCount(), 0);

  // A disposed timer stays dead even if a stray handler calls start() again.
  timer.start();
  clock.advance(5000);
  assert.equal(completions(), 0);
});
