import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.has(key) ? store.get(key) : null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};

const db = await import('../src/lib/localDatabase.js');
const storage = await import('../src/lib/storage.js');

await db.deleteAllSessions();
await db.deleteAllCustomWorkouts();

const later = await db.createSession({
  date: '2026-10-12T12:00:00.000Z',
  workoutName: 'Pull',
  exercises: [{ exerciseId: 'pullup', sets: [] }],
});
const earlier = await db.createSession({
  date: '2026-10-10T12:00:00.000Z',
  workoutName: 'Push',
  exercises: [{ exerciseId: 'pushup', sets: [] }],
});
assert.ok(later.id);
assert.deepEqual((await db.listSessions()).map((s) => s.workoutName), ['Push', 'Pull']);

const routine = await db.createCustomWorkout({ name: 'Skill day', exercises: ['pa_handstand'] });
assert.ok(routine.id);
assert.equal((await db.listCustomWorkouts()).length, 1);
await db.deleteCustomWorkout(routine.id);
assert.equal((await db.listCustomWorkouts()).length, 0);

await db.replaceAllTrainingData({
  sessions: [{ id: 'imported-session', date: '2026-10-20T12:00:00.000Z', exercises: [] }],
  customWorkouts: [{ id: 'imported-routine', name: 'Imported', exercises: ['pa_hspu'] }],
});
assert.deepEqual((await db.listSessions()).map((s) => s.id), ['imported-session']);
assert.deepEqual((await db.listCustomWorkouts()).map((w) => w.id), ['imported-routine']);

await assert.rejects(
  db.replaceAllTrainingData({ sessions: [{ exercises: 'not-an-array' }], customWorkouts: [] }),
  /invalid workout session/i,
);
assert.deepEqual((await db.listSessions()).map((s) => s.id), ['imported-session']);

await db.clearAllTrainingData();
assert.equal((await db.listSessions()).length, 0);
assert.equal((await db.listCustomWorkouts()).length, 0);

// Settings, cycle state and an in-progress session are portable too.
storage.saveSettings({ ...storage.DEFAULT_SETTINGS, athleteName: 'Backup athlete' });
storage.saveCurrentWeek(4, 'skill');
storage.saveActiveSession({ id: 'active-session', workoutName: 'Paused pull' });
storage.restoreLocalState({
  settings: { athleteName: 'Restored athlete', activeProgram: 'skill' },
  programWeeks: { skill: 2 },
  programCycleStarts: { skill: '2026-10-01T00:00:00.000Z' },
  activeSession: { id: 'restored-active', workoutName: 'Restored workout' },
});
assert.equal(storage.loadSettings().athleteName, 'Restored athlete');
assert.equal(storage.loadCurrentWeek('skill'), 2);
assert.equal(storage.loadCycleStartAt('skill'), '2026-10-01T00:00:00.000Z');
assert.equal(storage.loadActiveSession().id, 'restored-active');

console.log('APEX local storage checks passed.');
