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

  // Workout menu: Add set and Set added weight are quick access outside the
  // Manage group; Manage holds Change/Add/Reorder exercise.
  const manageHeaderAt = workoutSessionSource.search(/\n\s*Manage\s*\n/);
  assert.ok(manageHeaderAt > 0, 'Menu should have a Manage group header');
  const quickAccess = workoutSessionSource.slice(0, manageHeaderAt);
  const manageGroup = workoutSessionSource.slice(
    manageHeaderAt,
    workoutSessionSource.indexOf('Finish workout', manageHeaderAt),
  );
  assert.ok(quickAccess.includes('Add set'), 'Add set must be quick access before Manage');
  assert.ok(quickAccess.includes('Set added weight'), 'Set added weight must be quick access before Manage');
  for (const label of ['Change exercise', 'Add exercise', 'Reorder exercises']) {
    assert.ok(manageGroup.includes(label), `${label} must be inside Manage`);
  }
  assert.ok(!manageGroup.includes('Add set'), 'Add set must not be inside Manage');
  assert.ok(!manageGroup.includes('Set added weight'), 'Set added weight must not be inside Manage');
  assert.match(workoutSessionSource, /openSheet\('weight'\)/, 'Set added weight opens the weight wheel for the current set');

  // Weight tracking appears on the exercise inputs once a load is set for it
  // (session- and exercise-scoped), and never for skill practice.
  const setInputsSource = await fs.readFile(path.resolve('src/components/workout/SetInputs.jsx'), 'utf8');
  assert.match(setInputsSource, /weightTracked/, 'SetInputs should derive weight tracking from the exercise sets');
  assert.match(setInputsSource, /label="Added weight"/, 'Weight tracking should render an Added weight row');

  // The watermark title zone reserves two lines so short exercise names do
  // not pull the meta block and set ladder up into the background figure.
  const cssSource = await fs.readFile(path.resolve('src/index.css'), 'utf8');
  assert.match(cssSource, /\.console-watermark-title \{[^}]*min-height:/, 'Watermark title should reserve a fixed height');

  // The ladder uses compact spacing when a progression selector already
  // fills the gap, or when the figure is horizontal (front lever / rows).
  // These bigger gaps are watermark-only; badge mode keeps tight spacing.
  assert.match(cssSource, /\.console-ladder \{[\s\S]*?margin-top: 14px;/, 'Base ladder spacing stays tight for badge mode');
  assert.match(cssSource, /\.console-hero-watermark \.console-ladder \{\s*margin-top: 52px;/, 'Watermark ladder clearance should exist');
  assert.match(cssSource, /\.console-hero-watermark \.console-ladder\.is-compact \{[\s\S]*?margin-top:/, 'Compact ladder spacing should exist');
  assert.match(workoutSessionSource, /'frontlever', 'flrow', 'ringrow'\]/, 'Horizontal figures should use compact ladder spacing');

  console.log('Workout session UI and logic checks passed.');
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}
