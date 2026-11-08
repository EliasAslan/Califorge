import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Run the pure training-logic modules in Node by making their extensionless
// relative imports explicit. This avoids needing a browser or remote account.
const sourceRoot = path.resolve('src/lib');
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'apex-training-test-'));
const modules = ['storage.js', 'appearance.js', 'exerciseAdaptations.js', 'programData.js', 'trainingLogic.js'];
try {
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

  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };

  const logic = await import(pathToFileURL(path.join(tempRoot, 'trainingLogic.mjs')));
  const programs = await import(pathToFileURL(path.join(tempRoot, 'programData.mjs')));
  const storage = await import(pathToFileURL(path.join(tempRoot, 'storage.mjs')));
  const adaptations = await import(pathToFileURL(path.join(tempRoot, 'exerciseAdaptations.mjs')));
  const completedSession = (workoutId, week = 1, date = '2026-10-01T12:00:00.000Z') => ({
    workoutId,
    workoutName: programs.getWorkout(workoutId)?.name || workoutId,
    week,
    date,
    exercises: [{ sets: [{ completed: true, skipped: false }, { completed: true, skipped: false }] }],
  });

  // Home uses a plan-led recommendation: the weekday program remains the
  // default even if a previous scheduled workout was missed or completed out
  // of order. Rest days remain recovery by default and point to the next day.
  const mondayPlan = logic.getPlanLedWorkoutRecommendation('skill', new Date(2026, 9, 26, 12));
  assert.equal(mondayPlan.workoutId, 'push_a');
  assert.equal(mondayPlan.isRestDay, false);
  // The recommendation is schedule-derived, so a missed earlier weekday or
  // an out-of-order optional session cannot rewrite today's prescribed block.
  assert.equal(logic.getPlanLedWorkoutRecommendation('skill', new Date(2026, 9, 26, 12)).workoutId, 'push_a');
  const wednesdayPlan = logic.getPlanLedWorkoutRecommendation('skill', new Date(2026, 9, 28, 12));
  assert.equal(wednesdayPlan.isRestDay, true);
  assert.equal(wednesdayPlan.nextWorkoutId, 'legs_core');
  assert.equal(wednesdayPlan.nextWorkoutDay, 'Thursday');
  const hypertrophyTuesday = logic.getPlanLedWorkoutRecommendation('hypertrophy', new Date(2026, 9, 27, 12));
  assert.equal(hypertrophyTuesday.workoutId, 'upper_a');
  assert.equal(hypertrophyTuesday.isRestDay, false);

  // Time selection preserves the user's stated handstand / HSPU priorities.
  const pushA = programs.getWorkout('push_a');
  const ten = logic.getExercisesForTimeBudget(pushA, 1, 10);
  const fifteen = logic.getExercisesForTimeBudget(pushA, 1, 15);
  const twentyFive = logic.getExercisesForTimeBudget(pushA, 1, 25);
  assert.deepEqual(ten, ['pa_handstand']);
  assert.deepEqual(fifteen, ['pa_handstand']);
  assert.ok(twentyFive.includes('pa_handstand'));
  assert.ok(twentyFive.includes('pa_hspu'));
  assert.ok(logic.estimateExercisesDuration(twentyFive, 1, 25) <= 25);

  // The same planner drives the estimate and the session plan. Longer
  // budgets add useful volume without spilling over the selected duration.
  const forty = logic.planWorkoutForTimeBudget(pushA, 1, 40, { equipment: storage.loadSettings().equipment });
  const sixty = logic.planWorkoutForTimeBudget(pushA, 1, 60, { equipment: storage.loadSettings().equipment });
  assert.ok(forty.exercisePlan.length > 0);
  assert.ok(forty.estimatedMinutes <= 40);
  assert.ok(sixty.estimatedMinutes <= 60);
  assert.ok(sixty.estimatedMinutes > forty.estimatedMinutes);
  assert.ok(
    sixty.exercisePlan.length > forty.exercisePlan.length
      || sixty.exercisePlan.reduce((sum, item) => sum + item.sets, 0) > forty.exercisePlan.reduce((sum, item) => sum + item.sets, 0),
    'A longer budget should add exercises or sets',
  );

  const timedHistory = [
    { date: '2026-10-01', exercises: [{ exerciseId: 'pa_handstand', durationMs: 180000, sets: [{ completed: true, skipped: false }, { completed: true, skipped: false }] }] },
    { date: '2026-10-08', exercises: [{ exerciseId: 'pa_handstand', durationMs: 180000, sets: [{ completed: true, skipped: false }, { completed: true, skipped: false }] }] },
    { date: '2026-10-15', exercises: [{ exerciseId: 'pa_handstand', durationMs: 900000, sets: [{ completed: true, skipped: false }, { completed: true, skipped: false }] }] },
  ];
  assert.deepEqual(logic.getPersonalExerciseSecondsPerSet('pa_handstand', timedHistory), { seconds: 90, sampleCount: 3 });
  assert.equal(logic.getPersonalExerciseSecondsPerSet('pa_handstand', [timedHistory[0]]), null);

  // A floor-only travel setup should never receive movements that still
  // require unavailable gear. Alternative resolution must also avoid duplicate
  // substitute movements when multiple originals map to the same fallback.
  const allScheduledExerciseIds = [...new Set(Object.values(programs.PROGRAMS)
    .flatMap((program) => Object.values(program.workouts).flatMap((workout) => workout.exercises)))];
  for (const exerciseId of allScheduledExerciseIds) {
    const alternatives = adaptations.getExerciseAlternativeIds(exerciseId);
    assert.ok(alternatives.length > 0, `Missing alternatives for ${exerciseId}`);
    assert.ok(alternatives.every((alternativeId) => programs.getExercise(alternativeId)), `Unresolved alternative for ${exerciseId}`);
  }

  const customFloorPlan = logic.getEquipmentCompatibleExercisePlan(
    ['pa_ringdips', 'pa_planche', 'pa_handstand', 'pb_pppu', 'h_deep_pp_pushup'],
    ['Floor'],
    'full',
    1,
  );
  assert.ok(customFloorPlan.every((item) => adaptations.isExerciseEquipmentAvailable(item.id, ['Floor'])));
  assert.equal(customFloorPlan.length, new Set(customFloorPlan.map((item) => item.id)).size);
  assert.deepEqual(customFloorPlan.map((item) => item.id), [
    'alt_close_grip_pushup',
    'alt_planche_lean_floor',
    'pa_handstand',
    'pb_pppu',
    'alt_pushup',
  ]);

  const pullB = programs.getWorkout('pull_b');
  const floorOnly = logic.planWorkoutForTimeBudget(pullB, 1, 60, { equipment: ['Floor'] });
  assert.ok(floorOnly.exercisePlan.length > 0);
  assert.equal(floorOnly.exerciseIds.length, new Set(floorOnly.exerciseIds).size);
  assert.ok(floorOnly.exercisePlan.every((item) => adaptations.isExerciseEquipmentAvailable(item.id, ['Floor'])));
  assert.ok(floorOnly.exerciseIds.includes('alt_prone_lat_hold'));

  // Planned substitutions retain the source movement for future variation
  // choices, while the session uses the alternative's actual training model.
  const substituted = logic.buildSession('push_a', 1, 'full', {
    programId: 'skill',
    exercisePlan: [{ id: 'alt_planche_lean_floor', originalId: 'pa_planche', sets: 2 }],
    timeBudgetMin: 40,
  });
  assert.equal(substituted.exercises[0].exerciseId, 'alt_planche_lean_floor');
  assert.equal(substituted.exercises[0].originalId, 'pa_planche');
  assert.equal(substituted.exercises[0].sets.length, 2);

  // Progress records and notable-improvement summaries must include the
  // actual alternative movement performed, rather than only template IDs.
  const alternativeHistory = [
    {
      workoutId: 'push_a',
      programId: 'skill',
      week: 1,
      date: '2026-10-01T12:00:00.000Z',
      exercises: [{
        exerciseId: 'alt_planche_lean_floor',
        sets: [{ completed: true, skipped: false, actualSec: 8 }],
      }],
    },
    {
      workoutId: 'push_a',
      programId: 'skill',
      week: 1,
      date: '2026-10-08T12:00:00.000Z',
      exercises: [{
        exerciseId: 'alt_planche_lean_floor',
        sets: [{ completed: true, skipped: false, actualSec: 15 }],
      }],
    },
  ];
  const alternativeRecord = logic.getAllPersonalRecords(alternativeHistory)
    .find((record) => record.exerciseId === 'alt_planche_lean_floor');
  assert.equal(alternativeRecord?.record.value, 15);
  const alternativeImprovement = logic.getProgramImprovements(alternativeHistory, 'skill')
    .find((item) => item.exerciseId === 'alt_planche_lean_floor');
  assert.deepEqual(
    { from: alternativeImprovement?.from, to: alternativeImprovement?.to, delta: alternativeImprovement?.delta },
    { from: 8, to: 15, delta: 7 },
  );

  // Changing one exercise's load updates every pending set but preserves
  // completed history and can still edit an already-completed set alone.
  const weightedEntry = {
    sets: [
      { completed: true, skipped: false, weight: 5 },
      { completed: false, skipped: false, weight: null },
      { completed: false, skipped: false, weight: null },
    ],
  };
  const loadedEntry = logic.applyLoadToExerciseSets(weightedEntry, 1, 10);
  assert.deepEqual(loadedEntry.sets.map((set) => set.weight), [5, 10, 10]);
  const editedCompleted = logic.applyLoadToExerciseSets(loadedEntry, 0, 7);
  assert.deepEqual(editedCompleted.sets.map((set) => set.weight), [7, 10, 10]);

  // Short mode trims one working set (except skill/prehab) while preserving
  // the normal exercise definition and target values.
  const shortSession = logic.buildSession('push_a', 1, 'quick', {
    exerciseIds: ['pa_hspu'],
    timeBudgetMin: 25,
  });
  assert.equal(shortSession.exercises[0].sets.length, 3);
  assert.equal(shortSession.timeBudgetMin, 25);
  assert.equal(shortSession.dayLabel, 'MON');
  const tenMinuteSession = logic.buildSession('push_a', 1, 'extremely_short', {
    exerciseIds: ten,
    timeBudgetMin: 10,
  });
  assert.equal(tenMinuteSession.exercises[0].durationMin, '10');

  // 60% of distinct weekly workouts advances the cycle; each workout needs
  // at least two completed sets. Repeats, partial and skipped sessions do not count.
  storage.saveCurrentWeek(1, 'skill');
  const repeatedOnly = [completedSession('push_a'), completedSession('push_a'), completedSession('push_a')];
  assert.equal(logic.maybeAdvanceWeek(repeatedOnly, 'skill').advanced, false);
  const skippedOnly = [{ ...completedSession('pull_a'), exercises: [{ sets: [{ completed: true, skipped: true }, { completed: true, skipped: true }] }] }];
  assert.equal(logic.maybeAdvanceWeek(skippedOnly, 'skill').advanced, false);
  const partialOnly = [{ ...completedSession('pull_a'), exercises: [{ sets: [{ completed: true, skipped: false }] }] }];
  assert.equal(logic.maybeAdvanceWeek(partialOnly, 'skill').advanced, false);
  const twoPatterns = [completedSession('push_a'), completedSession('pull_a')];
  assert.equal(logic.maybeAdvanceWeek(twoPatterns, 'skill').advanced, false);
  const noPullPattern = [completedSession('push_a'), completedSession('push_b'), completedSession('legs_core')];
  assert.equal(logic.maybeAdvanceWeek(noPullPattern, 'skill').advanced, false);
  const varied = [completedSession('push_a'), completedSession('pull_a'), completedSession('legs_core')];
  const advance = logic.maybeAdvanceWeek(varied, 'skill');
  assert.equal(advance.advanced, true);
  assert.equal(advance.week, 2);
  const consistency = logic.getCycleConsistency(varied, 1, 'skill');
  assert.equal(consistency.byWeek[0].completed, 3);

  const weekEight = [
    completedSession('push_a', 8),
    completedSession('pull_a', 8),
    completedSession('legs_core', 8),
  ];
  assert.equal(logic.getPhaseCompletion(weekEight, 8, 'skill').complete, true);
  assert.equal(logic.getRequiredWorkoutsPerWeek('hypertrophy'), 3);
  // The cycle-aware filter must be at Week 8 before checking Week 8 history.
  storage.saveCurrentWeek(8, 'hypertrophy');
  assert.equal(logic.getPhaseCompletion([completedSession('upper_a', 8), completedSession('upper_b', 8), completedSession('lower_a', 8)], 8, 'hypertrophy').complete, true);
  assert.equal(logic.getPhaseCompletion([completedSession('upper_a', 8), completedSession('upper_b', 8)], 8, 'hypertrophy'), null);

  // Legacy history without a saved cycle-start timestamp should still
  // detect a week-number rollover and keep the previous cycle out of charts.
  storage.saveProgramCycleStarts({});
  storage.saveCurrentWeek(1, 'skill');
  const legacyCycles = [
    completedSession('push_a', 7, '2026-08-01T12:00:00.000Z'),
    completedSession('pull_a', 8, '2026-08-08T12:00:00.000Z'),
    completedSession('push_a', 1, '2026-08-15T12:00:00.000Z'),
    completedSession('pull_a', 1, '2026-08-16T12:00:00.000Z'),
  ];
  assert.deepEqual(logic.getCurrentCycleSessions(legacyCycles, 'skill').map((session) => session.week), [1, 1]);
  assert.equal(logic.getCycleWeeks(legacyCycles, 1, 'skill')[7].sets, 0);
  assert.equal(logic.getCycleConsistency(legacyCycles, 1, 'skill').byWeek[7].completed, 0);
  const waitingForWeekOne = [
    completedSession('push_a', 7, '2026-07-25T12:00:00.000Z'),
    completedSession('pull_a', 8, '2026-08-01T12:00:00.000Z'),
  ];
  assert.equal(logic.getCurrentCycleSessions(waitingForWeekOne, 'skill').length, 0);

  // Starting a new cycle isolates same-numbered weeks from previous cycles,
  // including cycle-specific progress tracking.
  storage.startNewCycle('skill');
  assert.equal(logic.getCurrentCycleSessions(varied, 'skill').length, 0);
  const afterRestart = [
    completedSession('push_a', 1, new Date(Date.now() + 1000).toISOString()),
  ];
  assert.equal(logic.maybeAdvanceWeek([...varied, ...afterRestart], 'skill').advanced, false);
  const currentCycleSessions = [
    ...afterRestart,
    completedSession('pull_a', 1, new Date(Date.now() + 2000).toISOString()),
    completedSession('legs_core', 1, new Date(Date.now() + 3000).toISOString()),
  ];
  assert.equal(logic.maybeAdvanceWeek([...varied, ...currentCycleSessions], 'skill').advanced, true);

  console.log('APEX training logic checks passed.');
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}
