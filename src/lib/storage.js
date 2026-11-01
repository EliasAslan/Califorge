// Local preferences and the active workout live in localStorage.
// Completed sessions and custom workouts are stored separately in IndexedDB.
const PREFIX = 'cali.v1.';

const get = (key, fallback) => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const set = (key, value) => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full / unavailable */
  }
};

const remove = (key) => {
  try { localStorage.removeItem(PREFIX + key); } catch { /* noop */ }
};

// ── Active (in-progress) session — kept locally for reliable recovery ──
// A session is considered "stale" (abandoned) if no set has been logged for
// STALE_MS while the timer is running. On load we cap the accumulated active
// time to the last real activity and freeze the timer, so backgrounded or
// forgotten sessions can't rack up hundreds of hours of phantom duration.
export const STALE_MS = 3 * 60 * 60 * 1000; // 3 hours

export const loadActiveSession = () => {
  const s = get('activeSession', null);
  if (!s) return s;
  const now = Date.now();
  if (s.resumeAt && !s.paused && s.lastActivityAt && (now - s.lastActivityAt) > STALE_MS) {
    s.activeMs = (s.activeMs || 0) + Math.max(0, s.lastActivityAt - s.resumeAt);
    s.resumeAt = null;
    s.paused = true;
    set('activeSession', s);
  }
  return s;
};
// The bottom dock listens for this so an in-progress strip never goes stale
// after a session is started, paused, resumed or discarded.
const notifySessionChanged = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('califorge:session-changed'));
};

export const saveActiveSession = (session) => {
  set('activeSession', session);
  notifySessionChanged();
};
export const clearActiveSession = () => {
  remove('activeSession');
  notifySessionChanged();
};

// ── Current week (tracked per active training program) ───────────────────────
// Stored as a map { [programId]: week } so switching phases preserves each
// program's progress. Falls back to the legacy single 'currentWeek' value for
// the skill program on first load.
const loadProgramWeeks = () => get('programWeeks', {});
const saveProgramWeeks = (m) => set('programWeeks', m);
export const loadAllProgramWeeks = () => loadProgramWeeks();

export const loadCurrentWeek = (programId) => {
  const pid = programId || get('settings', {}).activeProgram || 'skill';
  const weeks = loadProgramWeeks();
  if (weeks[pid] != null) return Math.min(8, Math.max(1, weeks[pid]));
  if (pid === 'skill') return Math.min(8, Math.max(1, get('currentWeek', 1)));
  return 1;
};
export const saveCurrentWeek = (w, programId) => {
  const pid = programId || get('settings', {}).activeProgram || 'skill';
  const weeks = loadProgramWeeks();
  weeks[pid] = Math.min(8, Math.max(1, w));
  saveProgramWeeks(weeks);
};


// Keep historical cycles separate even though their week numbers repeat.
// This prevents old Week 1 sessions from advancing a newly restarted cycle.
const loadCycleStarts = () => get('programCycleStarts', {});
export const loadProgramCycleStarts = () => loadCycleStarts();
export const saveProgramCycleStarts = (starts) => set('programCycleStarts', starts || {});
export const loadCycleStartAt = (programId) => {
  const pid = programId || get('settings', {}).activeProgram || 'skill';
  return loadCycleStarts()[pid] || null;
};
export const startNewCycle = (programId) => {
  const pid = programId || get('settings', {}).activeProgram || 'skill';
  saveCurrentWeek(1, pid);
  const starts = loadCycleStarts();
  starts[pid] = new Date().toISOString();
  set('programCycleStarts', starts);
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  units: 'kg',
  bodyweight: 70,
  equipment: ['Parallettes', 'Rings', 'Pull-up bar', 'Resistance bands', 'Dumbbells'],
  notifications: false,
  reduceMotion: false,
  restSound: true,
  restVibration: true,
  athleteName: 'Athlete',
  theme: 'dark',
  accent: 'blue',
  activeProgram: 'skill',
  enjoyment: {}, // { [exerciseId]: 1–5 }
};

export const loadSettings = () => ({ ...DEFAULT_SETTINGS, ...get('settings', {}) });
export const saveSettings = (settings) => set('settings', settings);

// Last-used workout presentation; separate from session data.
// "minimal" was retired — existing users fall back to the Focus console.
export const loadWorkoutLayout = () => {
  const layout = get('workoutLayout', 'focus');
  return ['focus', 'list'].includes(layout) ? layout : 'focus';
};
export const saveWorkoutLayout = (layout) => {
  if (['focus', 'list'].includes(layout)) set('workoutLayout', layout);
};

// Per-exercise logging steps, set explicitly in the wheel sheet.
// Shape: { [exerciseId]: { weight?: number, reps?: number, hold?: number } }
export const loadExerciseIncrements = () => {
  const stored = get('exerciseIncrements', {});
  return stored && typeof stored === 'object' ? stored : {};
};
export const loadExerciseIncrement = (exerciseId, field, fallback) => {
  const value = loadExerciseIncrements()[exerciseId]?.[field];
  return Number.isFinite(value) && value > 0 ? value : fallback;
};
export const saveExerciseIncrement = (exerciseId, field, step) => {
  if (!exerciseId || !field || !Number.isFinite(step) || step <= 0) return;
  const all = loadExerciseIncrements();
  all[exerciseId] = { ...(all[exerciseId] || {}), [field]: step };
  set('exerciseIncrements', all);
};

// ── Enjoyment ratings (1–5 per exercise) ──────────────────────────────────────
export const getEnjoyment = () => loadSettings().enjoyment || {};
export const getEnjoymentFor = (id) => getEnjoyment()[id] ?? null;
export const setEnjoymentFor = (id, value) => {
  const s = loadSettings();
  const enjoyment = { ...(s.enjoyment || {}) };
  if (value == null) delete enjoyment[id];
  else enjoyment[id] = value;
  saveSettings({ ...s, enjoyment });
};

// ── Local preference and active-session reset (training records live in IndexedDB) ─
export const clearLocalData = () => {
  remove('activeSession');
  remove('settings');
  remove('workoutLayout');
  remove('currentWeek');
  remove('programWeeks');
  remove('programCycleStarts');
};
// Restore only known local preference keys from a user-selected backup.
export const restoreLocalState = (backup = {}) => {
  if (backup.settings && typeof backup.settings === 'object') saveSettings({ ...DEFAULT_SETTINGS, ...backup.settings });
  if (backup.programWeeks && typeof backup.programWeeks === 'object') saveProgramWeeks(backup.programWeeks);
  else if (Number.isFinite(Number(backup.currentWeek))) saveCurrentWeek(Number(backup.currentWeek), backup.settings?.activeProgram || 'skill');
  if (backup.programCycleStarts && typeof backup.programCycleStarts === 'object') saveProgramCycleStarts(backup.programCycleStarts);
  if (backup.activeSession && typeof backup.activeSession === 'object') saveActiveSession(backup.activeSession);
  else clearActiveSession();
};
