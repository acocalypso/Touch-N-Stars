import test from 'node:test';
import assert from 'node:assert/strict';

const { buildFlipTestSequence, toInputCoordinates } =
  await import('@/utils/meridianFlipTestSequence');

function findAll(node, predicate, out = []) {
  if (Array.isArray(node)) node.forEach((n) => findAll(n, predicate, out));
  else if (node && typeof node === 'object') {
    if (predicate(node)) out.push(node);
    Object.values(node).forEach((v) => findAll(v, predicate, out));
  }
  return out;
}

const byType = (fragment) => (n) => typeof n.$type === 'string' && n.$type.includes(fragment);

test('toInputCoordinates splits RA and Dec, including negative declinations', () => {
  assert.deepEqual(toInputCoordinates(20.5, -12.25), {
    RAHours: 20,
    RAMinutes: 30,
    RASeconds: 0,
    NegativeDec: true,
    DecDegrees: 12,
    DecMinutes: 15,
    DecSeconds: 0,
  });
  assert.equal(toInputCoordinates(24.25, 0).RAHours, 0);
});

test('buildFlipTestSequence: slew, tracking, wait loop and the flip trigger on the root', () => {
  const seq = buildFlipTestSequence({ raHours: 21, decDeg: 20, waitSeconds: 300, waitCount: 7 });

  const [slew] = findAll(seq, byType('SlewScopeToRaDec'));
  assert.equal(slew.Coordinates.RAHours, 21);
  assert.equal(slew.Coordinates.DecDegrees, 20);
  assert.equal(findAll(seq, byType('SetTracking'))[0].TrackingMode, 0);
  assert.equal(findAll(seq, byType('WaitForTimeSpan'))[0].Time, 300);
  assert.equal(findAll(seq, byType('LoopCondition'))[0].Iterations, 7);

  assert.equal(seq.Triggers.$values.length, 1);
  assert.ok(seq.Triggers.$values[0].$type.includes('MeridianFlipTrigger'));
});

test('buildFlipTestSequence: every $ref points to an existing $id', () => {
  const seq = buildFlipTestSequence({ raHours: 1, decDeg: 5, waitSeconds: 60, waitCount: 3 });
  const ids = new Set(findAll(seq, (n) => '$id' in n).map((n) => n.$id));
  const refs = findAll(seq, (n) => '$ref' in n).map((n) => n.$ref);
  assert.ok(refs.length > 0);
  for (const ref of refs) assert.ok(ids.has(ref), `dangling $ref ${ref}`);
  assert.equal(ids.size, findAll(seq, (n) => '$id' in n).length, 'duplicate $id');
});
