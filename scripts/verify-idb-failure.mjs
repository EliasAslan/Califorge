import assert from 'node:assert/strict';

const fallbackRows = [{ id: 'must-not-be-read', date: '2026-10-01', exercises: [] }];
const storage = new Map([
  ['apex.local.v1.sessions', JSON.stringify(fallbackRows)],
  ['apex.local.v1.customWorkouts', '[]'],
]);
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};

// Simulate a browser where IndexedDB exists but opening it fails. APEX must
// surface the failure rather than silently reading an unrelated fallback store.
globalThis.indexedDB = {
  open() {
    const request = {};
    queueMicrotask(() => {
      request.error = new Error('simulated IndexedDB permission error');
      request.onerror?.();
    });
    return request;
  },
};

const { listSessions } = await import('../src/lib/localDatabase.js');
await assert.rejects(listSessions(), /Could not open APEX local storage/);
assert.equal(storage.get('apex.local.v1.sessions'), JSON.stringify(fallbackRows),
  'IndexedDB failures must not silently switch to localStorage data.');

console.log('APEX IndexedDB failure handling checks passed.');
