import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// 1. Storage tests for workout layout preference
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};

const storage = await import('../src/lib/storage.js');

assert.equal(storage.loadWorkoutLayout(), 'focus', 'Default layout should be focus');

// The retired "minimal" layout falls back to the Focus console.
storage.saveWorkoutLayout('minimal');
assert.equal(storage.loadWorkoutLayout(), 'focus', 'Retired minimal layout should fall back to focus');

storage.saveWorkoutLayout('list');
assert.equal(storage.loadWorkoutLayout(), 'list', 'Layout preference should persist list');

storage.saveWorkoutLayout('focus');
assert.equal(storage.loadWorkoutLayout(), 'focus', 'Layout preference should persist focus');

// Invalid layout should fallback to focus
storage.saveWorkoutLayout('invalid-mode');
assert.equal(storage.loadWorkoutLayout(), 'focus', 'Invalid layout should fallback to focus');

// Per-exercise increments are explicit and remembered.
assert.equal(storage.loadExerciseIncrement('ex_pushup', 'weight', 2.5), 2.5, 'Default weight step');
storage.saveExerciseIncrement('ex_pushup', 'weight', 5);
assert.equal(storage.loadExerciseIncrement('ex_pushup', 'weight', 2.5), 5, 'Weight step should persist');
assert.equal(storage.loadExerciseIncrement('ex_pushup', 'reps', 1), 1, 'Other fields keep their defaults');
storage.saveExerciseIncrement('ex_pushup', 'hold', 10);
assert.equal(storage.loadExerciseIncrement('ex_pushup', 'hold', 5), 10, 'Hold step should persist');

// Warm-up progress survives route/tab changes but expires after the local day.
storage.saveWarmupProgress('push_a', ['wrist', 'hips', 'wrist', '']);
assert.deepEqual(storage.loadWarmupProgress('push_a'), ['wrist', 'hips'], 'Warm-up checks should be deduplicated and persisted');
const warmupStorageKey = 'cali.v1.warmupProgress';
const warmupData = JSON.parse(store.get(warmupStorageKey));
warmupData.push_a.date = '2000-01-01';
store.set(warmupStorageKey, JSON.stringify(warmupData));
assert.deepEqual(storage.loadWarmupProgress('push_a'), [], 'Previous-day warm-up checks should be discarded');
storage.saveWarmupProgress('push_a', ['handstand']);
storage.clearWarmupProgress();
assert.deepEqual(storage.loadWarmupProgress('push_a'), [], 'Finishing a workout should clear warm-up checks');


// 2. Pure training-logic validation checks
const sourceRoot = path.resolve('src/lib');
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'apex-training-ui-test-'));
try {
  const modules = ['storage.js', 'appearance.js', 'exerciseAdaptations.js', 'programData.js', 'trainingLogic.js'];
  for (const file of modules) {
    let source = await fs.readFile(path.join(sourceRoot, file), 'utf8');
    source = source
      .replaceAll("'./storage'", "'./storage.mjs'")
      .replaceAll("'./appearance'", "'./appearance.mjs'")
      .replaceAll("'./programData'", "'./programData.mjs'")
      .replaceAll("'./exerciseAdaptations'", "'./exerciseAdaptations.mjs'");
    const outputName = file.replace(/\.js$/, '.mjs');
    await fs.writeFile(path.join(tempRoot, outputName), source);
  }

  const logic = await import(pathToFileURL(path.join(tempRoot, 'trainingLogic.mjs')));
  const { missingFields, isSkillType, applyLoadToExerciseSets } = logic;

  // reps
  assert.deepEqual(missingFields('reps', { actualReps: null }), ['reps'], 'Reps missing should be detected');
  assert.deepEqual(missingFields('reps', { actualReps: 0 }), [], 'Reps 0 should be valid (not missing)');
  assert.deepEqual(missingFields('reps', { actualReps: 10 }), [], 'Reps 10 should be valid');

  // hold
  assert.deepEqual(missingFields('hold', { actualSec: null }), ['hold'], 'Hold missing should be detected');
  assert.deepEqual(missingFields('hold', { actualSec: 0 }), [], 'Hold 0s should be valid (not missing)');
  assert.deepEqual(missingFields('hold', { actualSec: 30 }), [], 'Hold 30s should be valid');

  // weighted
  assert.deepEqual(missingFields('weighted', { actualReps: null, weight: null }), ['reps', 'weight'], 'Both missing in weighted');
  assert.deepEqual(missingFields('weighted', { actualReps: 8, weight: null }), ['weight'], 'Weight missing in weighted');
  assert.deepEqual(missingFields('weighted', { actualReps: null, weight: 10 }), ['reps'], 'Reps missing in weighted');
  assert.deepEqual(missingFields('weighted', { actualReps: 8, weight: 0 }), [], 'Bodyweight (0 kg) should be valid');
  assert.deepEqual(missingFields('weighted', { actualReps: 8, weight: 15 }), [], 'Valid weighted reps and weight');

  // reps_hold
  assert.deepEqual(missingFields('reps_hold', { actualReps: null, actualSec: null }), ['reps', 'hold'], 'Both missing in reps_hold');
  assert.deepEqual(missingFields('reps_hold', { actualReps: 5, actualSec: null }), ['hold'], 'Hold missing in reps_hold');
  assert.deepEqual(missingFields('reps_hold', { actualReps: null, actualSec: 10 }), ['reps'], 'Reps missing in reps_hold');
  assert.deepEqual(missingFields('reps_hold', { actualReps: 5, actualSec: 10 }), [], 'Valid reps_hold');

  // skill and prehab (holds are optional)
  assert.equal(isSkillType('skill'), true);
  assert.equal(isSkillType('prehab'), true);
  assert.equal(isSkillType('reps'), false);
  assert.deepEqual(missingFields('skill', { actualSec: null }), [], 'Skill hold is optional');
  assert.deepEqual(missingFields('prehab', { actualSec: null }), [], 'Prehab hold is optional');

  const loadExample = {
    sets: [
      { completed: true, skipped: false, weight: 5 },
      { completed: false, skipped: false, weight: null },
      { completed: false, skipped: false, weight: null },
    ],
  };
  const loaded = applyLoadToExerciseSets(loadExample, 1, 10);
  assert.deepEqual(loaded.sets.map((set) => set.weight), [5, 10, 10], 'Load should carry to pending sets only');
  const correctedCompleted = applyLoadToExerciseSets(loaded, 0, 7);
  assert.deepEqual(correctedCompleted.sets.map((set) => set.weight), [7, 10, 10], 'Editing a completed set should not rewrite later sets');

  // Session-only editing must append without stealing the active cursor or clock.
  const workoutSessionSource = await fs.readFile(path.resolve('src/pages/WorkoutSession.jsx'), 'utf8');
  const addExerciseHandler = workoutSessionSource.slice(
    workoutSessionSource.indexOf('const addExerciseToSession'),
    workoutSessionSource.indexOf('const handleExercisePick'),
  );
  assert.match(addExerciseHandler, /next\.exercises\.push\(/, 'Add exercise should append to this session');
  assert.doesNotMatch(addExerciseHandler, /next\.cursor\s*=/, 'Appending an exercise must preserve the current exercise and set');
  assert.match(addExerciseHandler, /timingStartedAt: null/, 'The appended exercise should not start timing before it becomes active');
  assert.doesNotMatch(addExerciseHandler, /stopExerciseClock/, 'Appending must not stop the current exercise clock');

  // Reorder mode remembers the layout the user came from and restores it on exit.
  assert.match(workoutSessionSource, /const \[layoutBeforeReorder, setLayoutBeforeReorder\] = useState\(null\)/);
  assert.match(workoutSessionSource, /if \(layoutBeforeReorder\) setLayout\(layoutBeforeReorder\)/);
  assert.match(workoutSessionSource, /setLayoutBeforeReorder\(layout\)/);

  console.log('Workout session UI and logic checks passed.');
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}
