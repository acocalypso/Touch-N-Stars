import test from 'node:test';
import assert from 'node:assert/strict';
import { aiOutputPath } from '../phd2AIPaths.js';

test('outputs remain in the server-reported profile folder with the appropriate extension', () => {
  const directory = '/home/pi/Documents/PHD2/instance-1/profile-3/';
  assert.equal(aiOutputPath(directory, 'export', '123-1'), directory + 'export-123-1.json');
  assert.equal(aiOutputPath(directory, 'recording', '123-2'), directory + 'recording-123-2.csv');
});
test('Windows and UNC destinations keep their host path syntax', () => {
  for (const directory of ['C:\\Users\\Aco\\Documents\\PHD2', '\\\\server\\models']) {
    assert.equal(aiOutputPath(directory, 'export', '123-1'), directory + '\\export-123-1.json');
  }
});
test('missing host directories and unsupported file types cannot produce destinations', () => {
  assert.throws(() => aiOutputPath('', 'export', '123-1'));
  assert.throws(() => aiOutputPath('/models', 'unknown', '123-1'));
});
