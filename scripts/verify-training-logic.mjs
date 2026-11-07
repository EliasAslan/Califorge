import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Run the pure training-logic modules in Node by making their extensionless
// relative imports explicit. This avoids needing a browser or remote account.
const sourceRoot = path.resolve('src/lib');
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'apex-training-test-'));
const modules = ['storage.js', 'appearance.js', 'programData.js', 'trainingLogic.js'];
try {
  for (const file of modules) {
    let source = await fs.readFile(path.join(sourceRoot, file), 'utf8');
    source = source
      .replaceAll("'./storage'", "'./storage.mjs'")
      .replaceAll("'./appearance'", "'./appearance.mjs'")
      .replaceAll("'./programData'", "'./programData.mjs'");
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
  assert.equal(logic.getPhaseCompletion([completedSession('upper_a', 8), completedSession('upper_b', 8), completedSession('lower_a', 8)], 8, 'hypertrophy').complete, true);
  assert.equal(logic.getPhaseCompletion([completedSession('upper_a', 8), completedSession('upper_b', 8)], 8, 'hypertrophy'), null);

  // Legacy history without a saved cycle-start timestamp should still
  // detect a week-number rollover and keep the previous cycle out of charts.
  storage.saveProgramCycleStarts({});
  const legacyCycles = [
    completedSession('push_a', 7, '2026-08-01T12:00:00.000Z'),
    completedSession('pull_a', 8, '2026-08-08T12:00:00.000Z'),
    completedSession('push_a', 1, '2026-08-15T12:00:00.000Z'),
    completedSession('pull_a', 1, '2026-08-16T12:00:00.000Z'),
  ];
  assert.deepEqual(logic.getCurrentCycleSessions(legacyCycles, 'skill').map((session) => session.week), [1, 1]);
  assert.equal(logic.getCycleWeeks(legacyCycles, 1, 'skill')[7].sets, 0);
  assert.equal(logic.getCycleConsistency(legacyCycles, 1, 'skill').byWeek[7].completed, 0);

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
