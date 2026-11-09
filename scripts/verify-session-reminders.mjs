import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Same Node workaround as verify-training-logic.mjs: copy the pure modules to
// a temp dir with explicit .mjs extensions so extensionless imports resolve.
const sourceRoot = path.resolve('src/lib');
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'apex-reminder-test-'));
const modules = [
  'storage.js',
  'appearance.js',
  'exerciseAdaptations.js',
  'programData.js',
  'trainingLogic.js',
  'workoutFeedback.js',
  'sessionReminders.js',
];
try {
  for (const file of modules) {
    let source = await fs.readFile(path.join(sourceRoot, file), 'utf8');
    source = source
      .replaceAll("'./storage.js'", "'./storage.mjs'")
      .replaceAll("'./storage'", "'./storage.mjs'")
      .replaceAll("'./appearance'", "'./appearance.mjs'")
      .replaceAll("'./programData'", "'./programData.mjs'")
      .replaceAll("'./exerciseAdaptations'", "'./exerciseAdaptations.mjs'")
      .replaceAll("'./trainingLogic'", "'./trainingLogic.mjs'")
      .replaceAll("'./workoutFeedback'", "'./workoutFeedback.mjs'");
    await fs.writeFile(path.join(tempRoot, file.replace(/\.js$/, '.mjs')), source);
  }

  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
  globalThis.window = { dispatchEvent: () => true };

  const storage = await import(pathToFileURL(path.join(tempRoot, 'storage.mjs')));
  const reminders = await import(pathToFileURL(path.join(tempRoot, 'sessionReminders.mjs')));
  const { loadSettings, saveSettings, loadLastReminderDay } = storage;
  const { getTodayPlannedSession, isReminderDue, maybeFireSessionReminder, localDayKey } = reminders;

  // Monday 2026-11-09 is a training day (Push A) in the skill program;
  // Sunday 2026-11-08 is a planned rest day.
  const MONDAY_MORNING = new Date(2026, 10, 9, 7, 0);
  const MONDAY_AFTER_REMINDER = new Date(2026, 10, 9, 9, 0);
  const SUNDAY_NOON = new Date(2026, 10, 8, 12, 0);

  assert.equal(loadSettings().reminderTime, '08:00', 'reminder defaults to 08:00');

  const planned = getTodayPlannedSession(MONDAY_MORNING);
  assert.equal(planned?.workoutName, 'Push A', 'Monday plans Push A');
  assert.equal(getTodayPlannedSession(SUNDAY_NOON), null, 'rest days have no session reminder');

  saveSettings({ ...loadSettings(), notifications: false, reminderTime: '08:00' });
  assert.equal(isReminderDue(MONDAY_AFTER_REMINDER), false, 'disabled notifications never fire');

  saveSettings({ ...loadSettings(), notifications: true, reminderTime: '08:00' });
  assert.equal(isReminderDue(MONDAY_MORNING), false, 'not due before the reminder time');
  assert.equal(isReminderDue(SUNDAY_NOON), false, 'not due on a rest day');
  assert.equal(isReminderDue(MONDAY_AFTER_REMINDER), true, 'due after the reminder time on a training day');

  const fired = await maybeFireSessionReminder(MONDAY_AFTER_REMINDER);
  assert.equal(fired?.workoutId, 'push_a', 'reminder fires with today\'s planned session');
  assert.equal(loadLastReminderDay(), localDayKey(MONDAY_AFTER_REMINDER), 'fired day is recorded');
  assert.equal(isReminderDue(MONDAY_AFTER_REMINDER), false, 'only once per day');
  assert.equal(await maybeFireSessionReminder(MONDAY_AFTER_REMINDER), null, 'second check does not refire');

  console.log('APEX session reminder checks passed.');
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}
