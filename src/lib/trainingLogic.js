// Training logic — kept separate from UI so the algorithm can evolve independently.
import {
  PHASES, EXERCISES, getExercise, getWorkout, getModeExercises,
  getSchedule, getWeeks, getActiveProgramId, getProgramWorkouts,
} from './programData';
import { loadCurrentWeek, saveCurrentWeek, loadCycleStartAt } from './storage';

// JS getDay: 0=Sun..6=Sat. Schedule is Monday-first (index 0=Mon).
const DOW_TO_SCHEDULE = [6, 0, 1, 2, 3, 4, 5]; // getDay -> schedule index

export const getTodayScheduleIndex = (date = new Date()) => DOW_TO_SCHEDULE[date.getDay()];
export const getTodaySchedule = (date = new Date()) => getSchedule()[getTodayScheduleIndex(date)];


// Plan-led recommendation: the selected program's weekday schedule remains
// the source of truth. Missed sessions are not carried forward as debt and do
// not silently reorder the plan. Time-based options can shorten today's work,
// while the weekly structure stays intact.
export const getPlanLedWorkoutRecommendation = (programId, date = new Date()) => {
  const schedule = getSchedule(programId || getActiveProgramId());
  if (!schedule?.length) return null;

  const todayIndex = getTodayScheduleIndex(date);
  const today = schedule[todayIndex];
  if (today?.workoutId) {
    const workout = getWorkout(today.workoutId);
    if (!workout) return null;
    return {
      workoutId: workout.id,
      workoutName: workout.name,
      scheduledDay: today.day,
      isRestDay: false,
      reason: `Today's scheduled session in your program: ${today.day}.`,
      nextWorkoutId: workout.id,
      nextWorkoutDay: today.day,
    };
  }

  for (let offset = 1; offset <= schedule.length; offset += 1) {
    const nextDay = schedule[(todayIndex + offset) % schedule.length];
    if (!nextDay?.workoutId) continue;
    const workout = getWorkout(nextDay.workoutId);
    if (!workout) continue;
    return {
      workoutId: workout.id,
      workoutName: workout.name,
      scheduledDay: today?.day || null,
      isRestDay: true,
      reason: `Planned recovery day. Next session: ${workout.name} on ${nextDay.day}.`,
      nextWorkoutId: workout.id,
      nextWorkoutDay: nextDay.day,
    };
  }

  return null;
};

export const getPhaseForWeek = (week, programId) => {
  const w = getWeeks(programId).find((x) => x.week === week);
  return w ? PHASES[w.phase] : PHASES.accumulation;
};

export const getWeekMeta = (week, programId) =>
  getWeeks(programId).find((x) => x.week === week) || getWeeks(programId)[0];

// Weekly role / focus for the current phase + week. Drives the Progress
// dashboard messaging and keeps recommendations phase-aware.
const WEEKLY_FOCUS = {
  accumulation: 'Build volume & technique',
  deload: 'Recover & reduce fatigue',
  intensification: 'Advance progressions & load',
  consolidation: 'Hold volume & intensity',
  comparison: 'Re-test vs week 1',
  test: 'Test key skills & strength',
};
export const getWeeklyFocus = (week, programId) => {
  const meta = getWeekMeta(week, programId);
  const phase = getPhaseForWeek(week, programId);
  return { phaseKey: phase.key, label: phase.label, focus: WEEKLY_FOCUS[phase.key] || phase.label, note: meta.note };
};

export const isDeloadWeek = (week, programId) => getWeekMeta(week, programId).phase === 'deload';
export const isTestWeek = (week, programId) => getWeekMeta(week, programId).phase === 'test';

// ── Set count for a given mode + deload ──────────────────────────────────────
// Short / Quick Hit reduce VOLUME (sets), never intensity. Deload also trims
// working sets. Skill and prehab practice remain unchanged.
const modeSetCount = (ex, mode, deload) => {
  let n = ex.sets || 1;
  const isWork = ex.type !== 'skill' && ex.type !== 'prehab';
  if ((mode === 'quick' || mode === 'extremely_short') && isWork) n = Math.max(2, n - 1);
  if (deload && isWork) n = Math.max(1, n - 1);
  return n;
};

// ── Build a single exercise entry (shared by scheduled + custom sessions) ────
const buildExerciseEntry = (exId, mode, deload, timeBudgetMin = null) => {
  const ex = getExercise(exId);
  if (!ex) return null;
  const setCount = modeSetCount(ex, mode, deload);
  const sets = Array.from({ length: setCount }, (_, i) => ({
    index: i,
    targetReps: ex.targetReps ? [...ex.targetReps] : null,
    targetSec: ex.targetSec ? [...ex.targetSec] : null,
    holdSec: ex.holdSec ?? null,
    actualReps: null,
    actualSec: null,
    weight: null,
    rpe: null,
    rir: null,
    progression: null,
    completed: false,
    skipped: false,
    completedAt: null,
  }));
  return {
    exerciseId: ex.id,
    originalId: ex.id,
    name: ex.name,
    variation: ex.variation,
    visualId: ex.visualId,
    category: ex.category,
    type: ex.type,
    perSide: !!ex.perSide,
    durationMin: (ex.type === 'skill' || ex.type === 'prehab') && timeBudgetMin && parseMin(ex.durationMin) > Number(timeBudgetMin)
      ? String(Math.floor(Number(timeBudgetMin)))
      : (ex.durationMin || null),
    restSec: ex.restSec || null,
    rpe: ex.rpe || null,
    rir: ex.rir || null,
    progression: null,
    note: '',
    sets,
  };
};

// ── Build a live session from a workout + current week + mode ────────────────
// context = { sessions, enjoyment } — used for intelligent Short/Quick Hit selection.
export const buildSession = (workoutId, week, mode = 'full', context = {}) => {
  const workout = getWorkout(workoutId);
  if (!workout) return null;
  const deload = isDeloadWeek(week);
  const exIds = Array.isArray(context.exerciseIds)
    ? context.exerciseIds
    : getModeExercises(workout, mode, context);
  const exercises = exIds.map((id) => buildExerciseEntry(id, mode, deload, context.timeBudgetMin)).filter(Boolean);

  return {
    id: `s_${Date.now()}`,
    workoutId,
    workoutName: workout.name,
    workoutCategory: workout.category,
    programId: context.programId || getActiveProgramId(),
    week,
    mode,
    timeBudgetMin: Number.isFinite(Number(context.timeBudgetMin)) && Number(context.timeBudgetMin) > 0 ? Number(context.timeBudgetMin) : null,
    // Keep the template's intended day label even when the athlete moves it
    // to a different calendar day or chooses it manually from Home.
    dayLabel: getSchedule().find((day) => day.workoutId === workoutId)?.short || 'FLEX',
    startedAt: Date.now(),
    activeMs: 0,
    resumeAt: Date.now(),
    lastActivityAt: Date.now(),
    paused: false,
    finishedAt: null,
    exercises,
    cursor: { exerciseIndex: 0, setIndex: 0 },
    phase: 'work', // 'work' | 'rest'
    restEndsAt: null,
  };
};

// ── Build a session from an arbitrary list of exercise ids (custom workouts) ──
export const buildCustomSession = (name, exerciseIds, week, mode = 'full', programId = getActiveProgramId()) => {
  const deload = isDeloadWeek(week);
  const exercises = exerciseIds.map((id) => buildExerciseEntry(id, mode, deload)).filter(Boolean);

  return {
    id: `s_${Date.now()}`,
    workoutId: `custom_${Date.now()}`,
    workoutName: name,
    workoutCategory: exercises[0]?.category || 'push',
    programId,
    week,
    mode,
    dayLabel: 'CUSTOM',
    startedAt: Date.now(),
    activeMs: 0,
    resumeAt: Date.now(),
    lastActivityAt: Date.now(),
    paused: false,
    finishedAt: null,
    exercises,
    cursor: { exerciseIndex: 0, setIndex: 0 },
    phase: 'work',
    restEndsAt: null,
  };
};

// ── Duration estimate ────────────────────────────────────────────────────────
const parseMin = (s) => {
  if (!s) return 0;
  const nums = String(s).match(/\d+/g);
  if (!nums) return 0;
  return nums.map(Number).reduce((a, b) => a + b, 0) / nums.length;
};

export const estimateWorkoutDuration = (workoutId, week, mode = 'full', context = {}) => {
  const workout = getWorkout(workoutId);
  if (!workout) return 0;
  const deload = isDeloadWeek(week);
  const exIds = getModeExercises(workout, mode, context);
  let seconds = 0;
  exIds.forEach((id) => {
    const ex = getExercise(id);
    if (!ex) return;
    if (ex.type === 'skill' || ex.type === 'prehab') {
      seconds += parseMin(ex.durationMin) * 60;
      return;
    }
    const sets = modeSetCount(ex, mode, deload);
    const workPerSet = ex.type === 'hold' ? 12 : 35; // approx
    seconds += sets * workPerSet;
    seconds += Math.max(0, sets - 1) * (ex.restSec || 0);
  });
  return Math.round(seconds / 60);
};


const estimateExerciseMinutes = (exercise, week, mode, timeBudgetMin = Infinity) => {
  if (!exercise) return 0;
  if (exercise.type === 'skill' || exercise.type === 'prehab') {
    return Math.min(parseMin(exercise.durationMin), Number(timeBudgetMin) || Infinity);
  }
  const sets = modeSetCount(exercise, mode, isDeloadWeek(week));
  const workSeconds = exercise.type === 'hold' ? 12 : 35;
  const sideFactor = exercise.perSide ? 1.6 : 1;
  const seconds = (sets * workSeconds * sideFactor)
    + Math.max(0, sets - 1) * (exercise.restSec || 0)
    + 60; // setup / transition
  return seconds / 60;
};

export const getModeForTimeBudget = (minutes) => {
  const budget = Number(minutes) || 30;
  if (budget <= 15) return 'extremely_short';
  if (budget <= 30) return 'quick';
  return 'full';
};

// Select a complete, useful subset that fits the available time. Skill work is
// considered first so it does not disappear whenever the session is shortened.
// The estimates are intentionally approximate; the user always controls the plan.
export const getExercisesForTimeBudget = (workout, week, minutes, context = {}) => {
  if (!workout) return [];
  const budget = Math.max(10, Math.min(120, Number(minutes) || 30));
  const mode = getModeForTimeBudget(budget);
  const enjoyment = context.enjoyment || {};
  const candidates = workout.exercises
    .map((id) => {
      const exercise = getExercise(id);
      return {
        id,
        exercise,
        minutes: estimateExerciseMinutes(exercise, week, mode, budget),
        priority: workout.priority?.[id] ?? 99,
        enjoyment: enjoyment[id] ?? 3,
      };
    })
    .filter((item) => item.exercise);

  const skills = candidates.filter((item) => item.exercise.type === 'skill' || item.exercise.type === 'prehab')
    .sort((a, b) => a.priority - b.priority);
  const otherExercises = candidates.filter((item) => item.exercise.type !== 'skill' && item.exercise.type !== 'prehab')
    .sort((a, b) => (a.priority - b.priority) || (b.enjoyment - a.enjoyment));

  const picked = [];
  let usedMinutes = 0;
  for (const item of [...skills, ...otherExercises]) {
    if (picked.length && usedMinutes + item.minutes > budget) continue;
    picked.push(item);
    usedMinutes += item.minutes;
  }

  return picked.sort((a, b) => a.priority - b.priority).map((item) => item.id);
};

export const estimateExercisesDuration = (exerciseIds, week, minutes) => {
  const mode = getModeForTimeBudget(minutes);
  const budget = Math.max(10, Math.min(120, Number(minutes) || 30));
  const total = (exerciseIds || []).reduce((sum, id) =>
    sum + estimateExerciseMinutes(getExercise(id), week, mode, budget), 0);
  return Math.round(total);
};

// ── Previous performance ─────────────────────────────────────────────────────
export const sessionsForExercise = (exerciseId, sessions) =>
  sessions
    .filter((s) => s.exercises.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

export const getPreviousSets = (exerciseId, sessions) => {
  const list = sessionsForExercise(exerciseId, sessions);
  if (!list.length) return null;
  const last = list[list.length - 1];
  const entry = last.exercises.find((e) => e.exerciseId === exerciseId);
  return entry ? entry.sets.filter((x) => x.completed) : null;
};

// ── Personal records ────────────────────────────────────────────────────────
export const getPersonalRecord = (exerciseId, sessions) => {
  const list = sessionsForExercise(exerciseId, sessions);
  let best = null;
  list.forEach((s) => {
    const entry = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (!entry) return;
    entry.sets.forEach((set) => {
      if (!set.completed) return;
      const metric = set.weight != null
        ? { value: set.weight, reps: set.actualReps, label: `+${set.weight} kg × ${set.actualReps}` }
        : set.actualSec != null
        ? { value: set.actualSec, label: `${set.actualSec}s` }
        : set.actualReps != null
        ? { value: set.actualReps, label: `${set.actualReps} reps` }
        : null;
      if (!metric) return;
      if (!best || metric.value > best.value) best = metric;
    });
  });
  return best;
};

// ── Progression logic ────────────────────────────────────────────────────────
// Planned progression ≠ earned progression. We only *recommend*.
export const getProgressionStatus = (exerciseId, sessions) => {
  const ex = getExercise(exerciseId);
  if (!ex) return { status: 'new', message: '' };

  const list = sessionsForExercise(exerciseId, sessions);
  if (list.length < 2) {
    return { status: 'new', message: list.length ? 'Baseline established. Keep logging.' : 'No data yet — log this exercise to start tracking.' };
  }

  // Look at the last 2 sessions, top-set performance vs target ceiling.
  const recent = list.slice(-2);
  let topHits = 0;
  let totalSets = 0;
  recent.forEach((s) => {
    const entry = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (!entry) return;
    entry.sets.forEach((set) => {
      if (!set.completed || set.skipped) return;
      totalSets++;
      const ceiling = ex.targetReps ? ex.targetReps[1] : ex.targetSec ? ex.targetSec[1] : null;
      const actual = set.actualReps != null ? set.actualReps : set.actualSec;
      if (ceiling != null && actual != null && actual >= ceiling) topHits++;
    });
  });

  if (totalSets === 0) return { status: 'new', message: 'No completed sets recently.' };

  const ratio = topHits / totalSets;
  if (ratio >= 0.6) {
    return {
      status: 'earned',
      message: 'Progression likely earned — consistently hitting the top of the range with quality.',
    };
  }
  if (ratio >= 0.3) {
    return { status: 'on_track', message: 'On track. Push toward the top of the range before advancing.' };
  }
  return { status: 'building', message: 'Still building. Focus on quality reps and consistency.' };
};

// ── Rep / load recommendation from previous performance ──────────────────────
// Considers the current phase, previous reps, load and performance quality.
// When the top of a range is consistently achieved it suggests extra load or a
// harder variation. Returns a short string + optional target values.
export const getRepRecommendation = (exerciseId, sessions, week, programId) => {
  const ex = getExercise(exerciseId);
  if (!ex) return null;
  const list = sessionsForExercise(exerciseId, sessions);
  if (!list.length) return null;
  const last = list[list.length - 1];
  const entry = last.exercises.find((e) => e.exerciseId === exerciseId);
  const done = entry ? entry.sets.filter((s) => s.completed && !s.skipped) : [];
  if (!done.length) return null;

  const ceiling = ex.targetReps ? ex.targetReps[1] : ex.targetSec ? ex.targetSec[1] : null;
  const topActual = Math.max(
    ...done.map((s) => (s.actualReps != null ? s.actualReps : s.actualSec != null ? s.actualSec : 0))
  );
  const hitCeiling = ceiling != null && topActual >= ceiling;
  const prog = getProgressionStatus(exerciseId, sessions);
  const earned = prog.status === 'earned' || hitCeiling;
  const deload = isDeloadWeek(week, programId);
  const phaseKey = getPhaseForWeek(week, programId).key;

  if (deload) {
    return { text: 'Deload — match last load, fewer sets. No new maxes.' };
  }

  if (phaseKey === 'comparison' || phaseKey === 'test') {
    if (ex.type === 'weighted') return { text: 'Test week — go for a max load at the target reps. Full recovery between sets.' };
    if (ex.type === 'hold' || ex.type === 'reps_hold') return { text: 'Test week — attempt a max hold with full recovery. Compare to week 1.' };
    return { text: 'Test week — go for a rep PR with full recovery between sets.' };
  }

  if (phaseKey === 'consolidation' && earned) {
    return { text: 'Hold your current level — consolidation week. Keep quality high before the comparison week.' };
  }

  if (ex.type === 'weighted') {
    const lastWeight = done[0]?.weight ?? 0;
    if (earned) {
      return { text: `Top of range hit — add ~2.5 kg (last +${lastWeight} kg × ${topActual}).`, weight: lastWeight + 2.5 };
    }
    return { text: `Match last load +${lastWeight} kg, aim ${ex.targetReps[0]}–${ex.targetReps[1]} reps.`, weight: lastWeight };
  }
  if (ex.type === 'hold' || ex.type === 'reps_hold') {
    if (earned) {
      return { text: 'Progression earned — try a harder variation next session.' };
    }
    const range = ex.targetSec ? `${ex.targetSec[0]}–${ex.targetSec[1]}s` : `${ex.targetReps[0]} reps`;
    return { text: `Aim ${range} (last best ${topActual}${ex.type === 'reps_hold' ? ' reps' : 's'}).` };
  }
  // reps
  if (earned) {
    return { text: 'Top of range hit — add a harder variation or +1 rep next time.' };
  }
  return { text: `Aim ${ex.targetReps[0]}–${ex.targetReps[1]} reps (last best ${topActual}).` };
};

// ── Formatting helpers ──────────────────────────────────────────────────────
export const formatTarget = (ex) => {
  if (ex.type === 'skill' || ex.type === 'prehab') return `${ex.durationMin} min`;
  if (ex.type === 'hold') return `${ex.targetSec[0]}–${ex.targetSec[1]} sec`;
  if (ex.type === 'weighted') return `${ex.targetReps[0]}–${ex.targetReps[1]} reps`;
  if (ex.type === 'reps_hold') return `${ex.targetReps[0]} reps + ${ex.holdSec}s hold`;
  return `${ex.targetReps[0]}–${ex.targetReps[1]} reps${ex.perSide ? ' / side' : ''}`;
};

export const formatSetResult = (set, type, opts = {}) => {
  if (!set || !set.completed) return '—';
  const prog = (!opts.hideProgression && set.progression) ? `${set.progression} · ` : '';
  if (type === 'weighted') return `${prog}+${set.weight ?? 0}kg × ${set.actualReps ?? 0}`;
  if (type === 'hold') return `${prog}${set.actualSec ?? 0}s`;
  if (type === 'reps_hold') return `${prog}${set.actualReps ?? 0} + ${set.actualSec ?? 0}s`;
  return `${prog}${set.actualReps ?? 0}`;
};

export const formatRest = (sec) => {
  if (!sec) return '';
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s ? `${m}:${String(s).padStart(2, '0')}` : `${m} min`;
  }
  return `${sec}s`;
};

// Compact duration label, e.g. "32m" or "1h 5m"
export const formatDuration = (sec) => {
  if (sec == null) return '';
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${r}s`;
};

// Clock-style label from milliseconds, e.g. "32:14" or "1:05:02"
export const formatClock = (ms) => {
  const s = Math.max(0, Math.floor((ms || 0) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(r).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

// ── Metric extraction (shared by PR / recent-best / trend) ───────────────────
const setMetric = (set, type) => {
  if (type === 'weighted') {
    if (set.weight == null) return null;
    return { value: set.weight, label: `+${set.weight} kg × ${set.actualReps ?? 0}` };
  }
  if (type === 'hold' || type === 'reps_hold') {
    if (set.actualSec == null) return null;
    return { value: set.actualSec, label: `${set.actualSec}s` };
  }
  if (set.actualReps == null) return null;
  return { value: set.actualReps, label: `${set.actualReps} reps` };
};

// ── Last performance (most recent session, performed sets only) ──────────────
export const getLastPerformance = (exerciseId, sessions) => {
  const list = sessionsForExercise(exerciseId, sessions);
  if (!list.length) return null;
  const last = list[list.length - 1];
  const entry = last.exercises.find((e) => e.exerciseId === exerciseId);
  if (!entry) return null;
  const done = entry.sets.filter((x) => x.completed && !x.skipped);
  if (!done.length) return null;
  return { date: last.date, sets: done, type: entry.type };
};

export const formatLastPerformance = (sets, type) => {
  if (!sets || !sets.length) return null;
  if (type === 'weighted') {
    const w = sets[0].weight ?? 0;
    const reps = sets.map((s) => s.actualReps ?? 0).join(' / ');
    return w > 0 ? `+${w} kg, ${reps}` : `${reps} reps`;
  }
  if (type === 'hold') return sets.map((s) => `${s.actualSec ?? 0}s`).join(' / ');
  if (type === 'reps_hold') return sets.map((s) => `${s.actualReps ?? 0}+${s.actualSec ?? 0}s`).join(' / ');
  return sets.map((s) => `${s.actualReps ?? 0}`).join(' / ');
};

// ── Recent best (best metric in the last n sessions) ──────────────────────────
export const getRecentBest = (exerciseId, sessions, n = 3) => {
  const ex = getExercise(exerciseId);
  if (!ex) return null;
  const list = sessionsForExercise(exerciseId, sessions).slice(-n);
  let best = null;
  list.forEach((s) => {
    const entry = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (!entry) return;
    entry.sets.forEach((set) => {
      if (!set.completed || set.skipped) return;
      const m = setMetric(set, ex.type);
      if (!m) return;
      if (!best || m.value > best.value) best = m;
    });
  });
  return best;
};

// ── Training statistics ──────────────────────────────────────────────────────
export const getTrainingStats = (sessions) => {
  const total = sessions.length;
  const totalSets = sessions.reduce(
    (n, s) => n + s.exercises.reduce((m, e) => m + e.sets.filter((x) => x.completed && !x.skipped).length, 0),
    0
  );
  const now = Date.now();
  const last7 = sessions.filter((s) => new Date(s.date).getTime() >= now - 7 * 86400000).length;
  let avgPerWeek = 0;
  if (total > 0) {
    const first = Math.min(...sessions.map((s) => new Date(s.date).getTime()));
    const weeks = Math.max(1, (now - first) / (7 * 86400000));
    avgPerWeek = total / weeks;
  }
  return { total, totalSets, last7, avgPerWeek };
};

// ── Progress over time (best metric per session) ─────────────────────────────
export const getExerciseTrend = (exerciseId, sessions) => {
  const ex = getExercise(exerciseId);
  if (!ex) return [];
  return sessionsForExercise(exerciseId, sessions)
    .map((s) => {
      const entry = s.exercises.find((e) => e.exerciseId === exerciseId);
      if (!entry) return null;
      let best = null;
      entry.sets.forEach((set) => {
        if (!set.completed || set.skipped) return;
        const m = setMetric(set, ex.type);
        if (!m) return;
        if (best == null || m.value > best) best = m.value;
      });
      if (best == null) return null;
      return { date: s.date, value: best };
    })
    .filter(Boolean);
};

// ── Calendar + cycle helpers (Progress dashboard) ──────────────────────────
export const startOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
};
export const isSameDay = (a, b) => a.toDateString() === b.toDateString();

export const getWeekSessions = (sessions, week) => sessions.filter((s) => s.week === week);

export const getWeekSummary = (sessions, week) => {
  const ws = getWeekSessions(sessions, week);
  const workouts = ws.length;
  const sets = ws.reduce((n, s) => n + s.exercises.reduce((m, e) => m + e.sets.filter((x) => x.completed && !x.skipped).length, 0), 0);
  const durationSec = ws.reduce((n, s) => n + (s.durationSec || 0), 0);
  return { workouts, sets, durationSec };
};

export const getCycleWeeks = (sessions, currentWeek, programId) => {
  const cycleSessions = getCurrentCycleSessions(sessions, programId);
  return getWeeks(programId).map((w) => ({ week: w.week, phase: w.phase, isCurrent: w.week === currentWeek, ...getWeekSummary(cycleSessions, w.week) }));
};

export const plannedPerWeek = (programId) => getSchedule(programId).filter((d) => !d.rest).length;

export const getCycleConsistency = (sessions, currentWeek, programId) => {
  const programSessions = getCurrentCycleSessions(sessions, programId);
  const ppw = plannedPerWeek(programId);
  const byWeek = [];
  let completed = 0, planned = 0;
  for (let w = 1; w <= 8; w++) {
    const done = getCompletedWorkoutIdsForWeek(programSessions, w, programId).size;
    byWeek.push({ week: w, completed: done, planned: ppw });
    if (w <= currentWeek) { completed += done; planned += ppw; }
  }
  const percent = planned ? Math.round((completed / planned) * 100) : 0;
  return { completed, planned, percent, byWeek, plannedPerWeek: ppw };
};

export const getAllPersonalRecords = (sessions) =>
  Object.values(EXERCISES)
    .map((ex) => {
      const list = sessionsForExercise(ex.id, sessions);
      let best = null;
      list.forEach((s) => {
        const entry = s.exercises.find((e) => e.exerciseId === ex.id);
        if (!entry) return;
        entry.sets.forEach((set) => {
          if (!set.completed) return;
          const m = setMetric(set, ex.type);
          if (!m) return;
          if (!best || m.value > best.value) best = { ...m, date: s.date };
        });
      });
      if (!best) return null;
      return { exerciseId: ex.id, name: ex.name, category: ex.category, type: ex.type, visualId: ex.visualId, record: best };
    })
    .filter(Boolean);

export const countPersonalRecords = (sessions) => getAllPersonalRecords(sessions).length;

// ── Program-scoped helpers (phase switching + completion) ─────────────────────
export const getProgramSessions = (sessions, programId) => {
  const ids = new Set(Object.keys(getProgramWorkouts(programId)));
  return sessions.filter((session) =>
    ids.has(session.workoutId) && (!session.programId || session.programId === programId)
  );
};

// A cycle week should require exposure to most of the program, not perfect
// attendance. Requiring 60% of distinct planned workouts keeps variety while
// avoiding the old all-or-nothing rule that could stall a user after one miss.
// A workout needs at least two completed working sets to count as program exposure;
// shorter skill-only practice still counts in daily activity, just not phase credit.
export const getRequiredWorkoutsPerWeek = (programId) => {
  const planned = plannedPerWeek(programId);
  return planned ? Math.max(1, Math.ceil(planned * 0.6)) : 0;
};

export const getCurrentCycleSessions = (sessions, programId) => {
  const programSessions = getProgramSessions(sessions, programId)
    .slice()
    .sort((a, b) => new Date(a.date || a.finishedAt || a.startedAt || 0) - new Date(b.date || b.finishedAt || b.startedAt || 0));
  const cycleStartAt = loadCycleStartAt(programId);
  if (cycleStartAt) {
    const cycleStartMs = new Date(cycleStartAt).getTime();
    if (Number.isFinite(cycleStartMs)) {
      return programSessions.filter((session) => {
        const sessionDate = new Date(session.date || session.finishedAt || session.startedAt || 0).getTime();
        return Number.isFinite(sessionDate) && sessionDate >= cycleStartMs;
      });
    }
  }

  // Older installs may have workout history from a previous cycle but no
  // saved cycle-start timestamp. Detect the latest week-number reset (e.g.
  // Week 8 -> Week 1) so old cycle data cannot leak into the new overview.
  let latestCycleStart = 0;
  for (let index = 1; index < programSessions.length; index += 1) {
    const previousWeek = Number(programSessions[index - 1].week);
    const nextWeek = Number(programSessions[index].week);
    if (Number.isFinite(previousWeek) && Number.isFinite(nextWeek) && nextWeek < previousWeek) {
      latestCycleStart = index;
    }
  }
  return programSessions.slice(latestCycleStart);
};

const getCompletedWorkoutIdsForWeek = (sessions, week, programId) => {
  const plannedIds = new Set(getSchedule(programId).filter((day) => day.workoutId).map((day) => day.workoutId));
  return new Set(getCurrentCycleSessions(sessions, programId)
    .filter((session) => session.week === week && plannedIds.has(session.workoutId))
    .filter((session) => session.exercises?.reduce((count, exercise) =>
      count + (exercise.sets?.filter((set) => set.completed && !set.skipped).length || 0), 0
    ) >= 2)
    .map((session) => session.workoutId));
};

const hasProgramPatternCoverage = (completedWorkoutIds, programId) => {
  const requiredCategories = new Set(getSchedule(programId)
    .filter((day) => day.workoutId)
    .map((day) => getWorkout(day.workoutId)?.category)
    .filter(Boolean));
  const completedCategories = new Set([...completedWorkoutIds]
    .map((id) => getWorkout(id)?.category)
    .filter(Boolean));
  return [...requiredCategories].every((category) => completedCategories.has(category));
};

// Week 8 is considered complete once the athlete has trained a broad enough
// sample of the program. Repeating one workout cannot satisfy the requirement.
export const getPhaseCompletion = (sessions, currentWeek, programId) => {
  if (currentWeek < 8) return null;
  const required = getRequiredWorkoutsPerWeek(programId);
  const completedIds = getCompletedWorkoutIdsForWeek(sessions, 8, programId);
  if (required > 0 && completedIds.size >= required && hasProgramPatternCoverage(completedIds, programId)) {
    return {
      complete: true,
      plannedPerWeek: plannedPerWeek(programId),
      requiredWorkouts: required,
      completedWorkouts: completedIds.size,
    };
  }
  return null;
};

// Advance when the user has completed enough distinct sessions to experience
// the program's main training patterns. One missed workout no longer freezes
// the cycle, and duplicate sessions of the same type do not count as variety.
export const maybeAdvanceWeek = (sessions, programId) => {
  const pid = programId || getActiveProgramId();
  const currentWeek = loadCurrentWeek(pid);
  if (currentWeek >= 8) return { week: currentWeek, advanced: false };
  const required = getRequiredWorkoutsPerWeek(pid);
  if (!required) return { week: currentWeek, advanced: false };
  const completedIds = getCompletedWorkoutIdsForWeek(sessions, currentWeek, pid);
  if (completedIds.size >= required && hasProgramPatternCoverage(completedIds, pid)) {
    const next = currentWeek + 1;
    saveCurrentWeek(next, pid);
    return { week: next, advanced: true, completedWorkouts: completedIds.size, requiredWorkouts: required };
  }
  return { week: currentWeek, advanced: false, completedWorkouts: completedIds.size, requiredWorkouts: required };
};

// Notable improvements: compare early (first session) vs late (last session) best metric.
export const getProgramImprovements = (sessions, programId) => {
  const workouts = getProgramWorkouts(programId);
  const ids = Object.keys(workouts);
  const programSessions = getProgramSessions(sessions, programId).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const out = [];
  ids.forEach((wid) => {
    const w = workouts[wid];
    w.exercises.forEach((exId) => {
      const ex = getExercise(exId);
      if (!ex) return;
      const list = sessionsForExercise(exId, programSessions);
      if (list.length < 2) return;
      const first = list[0];
      const last = list[list.length - 1];
      const bestOf = (sess) => {
        const entry = sess.exercises.find((e) => e.exerciseId === exId);
        if (!entry) return null;
        let best = null;
        entry.sets.forEach((set) => {
          if (!set.completed || set.skipped) return;
          const m = setMetric(set, ex.type);
          if (!m) return;
          if (best == null || m.value > best) best = m.value;
        });
        return best;
      };
      const from = bestOf(first);
      const to = bestOf(last);
      if (from == null || to == null) return;
      const delta = to - from;
      if (delta <= 0) return;
      const unit = ex.type === 'weighted' ? 'kg' : (ex.type === 'hold' || ex.type === 'reps_hold') ? 's' : 'reps';
      out.push({
        exerciseId: exId,
        name: ex.name,
        category: ex.category,
        visualId: ex.visualId,
        from,
        to,
        delta,
        unit,
        type: ex.type,
      });
    });
  });
  return out.sort((a, b) => b.delta - a.delta).slice(0, 4);
};


export const isSkillType = (type) => type === 'skill' || type === 'prehab';

export const missingFields = (type, set = {}) => {
  const missing = [];
  if (['reps', 'weighted', 'reps_hold'].includes(type) && set.actualReps == null) missing.push('reps');
  if (['hold', 'reps_hold'].includes(type) && set.actualSec == null) missing.push('hold');
  if (type === 'weighted' && set.weight == null) missing.push('weight');
  return missing;
};
