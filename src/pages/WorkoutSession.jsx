import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Info, Check, ChevronLeft, ChevronRight, Pause, Play, MoreVertical, Flag, Trash2,
  StickyNote, ArrowLeftRight, Search, Plus, ListPlus, ArrowUpDown, Minus, Clock3, Weight,
} from 'lucide-react';
import { categoryColor, getExercise, LIBRARY_EXERCISES, MODES } from '@/lib/programData';
import { isExerciseEquipmentAvailable } from '@/lib/exerciseAdaptations';
import {
  formatTarget, getLastPerformance, formatLastPerformance, formatClock, getRepRecommendation, applyLoadToExerciseSets,
} from '@/lib/trainingLogic';
import {
  loadActiveSession, saveActiveSession, clearActiveSession, loadWorkoutLayout, saveWorkoutLayout,
  loadExerciseIncrement, saveExerciseIncrement, clearWarmupProgress, loadSettings, STALE_MS,
} from '@/lib/storage';
import { useSessions } from '@/hooks/useTrainingData';
import useConsoleChrome from '@/hooks/useConsoleChrome';
import ExerciseVisual from '@/components/ExerciseVisual';
import SetInputs, { missingFields, EffortRow } from '@/components/workout/SetInputs';
import WorkoutListLayout from '@/components/workout/WorkoutListLayout';
import ProgressionSelector from '@/components/workout/ProgressionSelector';
import VariationSwitcher from '@/components/workout/VariationSwitcher';
import RestState from '@/components/workout/RestState';
import WheelSheet from '@/components/workout/WheelSheet';
import ConsoleSheet from '@/components/workout/ConsoleSheet';
import { triggerFeedback, playRestCountdownSound, playRestCompleteSound, vibrate } from '@/lib/workoutFeedback';
import { withViewTransition } from '@/lib/viewTransition';

const LAYOUTS = [
  { id: 'focus', label: 'Guided' },
  { id: 'list', label: 'Overview' },
];

const FIELD_KEY = { reps: 'actualReps', weight: 'weight', hold: 'actualSec' };
const FIELD_TITLE = { reps: 'Reps', weight: 'Added weight', hold: 'Hold' };
const FIELD_UNIT = { reps: '', weight: 'kg', hold: 's' };
const FIELD_MAX = { reps: 100, weight: 200, hold: 600 };
const DEFAULT_STEP = { reps: 1, weight: 2.5, hold: 5 };
const STEP_OPTIONS = { reps: [1, 2, 5], weight: [1, 2.5, 5, 10], hold: [1, 5, 10, 30] };

const first = (value) => (Array.isArray(value) ? value[0] : value ?? undefined);

const stopExerciseClock = (session, exerciseIndex, now = Date.now()) => {
  const exercise = session?.exercises?.[exerciseIndex];
  if (!exercise?.timingStartedAt) return;
  exercise.durationMs = (exercise.durationMs || 0) + Math.max(0, now - exercise.timingStartedAt);
  exercise.timingStartedAt = null;
};

const startExerciseClock = (session, exerciseIndex, now = Date.now()) => {
  const exercise = session?.exercises?.[exerciseIndex];
  const hasPendingSets = exercise?.sets?.some((set) => !set.completed);
  if (exercise && hasPendingSets && !exercise.timingStartedAt) exercise.timingStartedAt = now;
};

const switchExerciseClock = (session, fromIndex, toIndex, now = Date.now()) => {
  if (fromIndex === toIndex) return;
  stopExerciseClock(session, fromIndex, now);
  startExerciseClock(session, toIndex, now);
};

export default function WorkoutSession() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmMode, setConfirmMode] = useState(null);
  const [missingAt, setMissingAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [layout, setLayout] = useState(() => loadWorkoutLayout());
  const [sheet, setSheet] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showCue, setShowCue] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('replace');
  const [reorderMode, setReorderMode] = useState(false);
  const [layoutBeforeReorder, setLayoutBeforeReorder] = useState(null);
  const [showOverviewRestAdjust, setShowOverviewRestAdjust] = useState(false);
  const overviewRestFiredRef = useRef(false);
  const overviewRestSecondRef = useRef(null);
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [, setIncrementTick] = useState(0);
  const [stageAnimate, setStageAnimate] = useState(false);
  const visualMode = loadSettings().workoutVisualMode || 'badge';
  const stageMountedRef = useRef(false);
  const isRestPhase = session?.phase === 'rest';
  const { data: sessions = [] } = useSessions();
  const availableEquipment = loadSettings().equipment || [];
  useConsoleChrome();

  // Animate the console stage when the workout state or layout changes, but
  // not on the initial mount: the route takeover already handles that.
  useLayoutEffect(() => {
    if (!loaded) return undefined;
    if (!stageMountedRef.current) {
      stageMountedRef.current = true;
      return undefined;
    }
    setStageAnimate(true);
    const timer = setTimeout(() => setStageAnimate(false), 240);
    return () => clearTimeout(timer);
  }, [isRestPhase, layout, loaded]);

  useEffect(() => {
    const stored = loadActiveSession();
    if (!stored) {
      navigate('/');
      return;
    }
    // don't count time the app was closed as active training
    if (stored.resumeAt && !stored.paused) {
      const resumedAt = Date.now();
      stored.resumeAt = resumedAt;
      const activeExercise = stored.exercises?.[stored.cursor?.exerciseIndex ?? 0];
      if (activeExercise?.sets?.some((set) => !set.completed)) {
        activeExercise.timingStartedAt = resumedAt;
      }
    }
    setSession(stored);
    setLoaded(true);
  }, [navigate]);

  useEffect(() => {
    if (session) saveActiveSession(session);
  }, [session]);

  // Keep the display awake only while this workout screen is mounted.
  // Reacquire after Android Chrome releases the lock when the tab is hidden.
  useEffect(() => {
    if (!loaded || !('wakeLock' in navigator)) return undefined;
    let sentinel = null;
    let cancelled = false;
    const requestLock = async () => {
      if (cancelled || document.visibilityState !== 'visible' || sentinel) return;
      try {
        sentinel = await navigator.wakeLock.request('screen');
        sentinel.addEventListener('release', () => { sentinel = null; });
      } catch {
        // Unsupported, denied, or battery-saver restricted: keep normal timeout behavior.
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestLock();
    };
    requestLock();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (sentinel) sentinel.release().catch(() => {});
      sentinel = null;
    };
  }, [loaded]);

  useEffect(() => {
    saveWorkoutLayout(layout);
  }, [layout]);

  // live workout timer (active time only; frozen while paused).
  useEffect(() => {
    if (!session || session.paused) return undefined;
    const id = setInterval(() => {
      setNow(Date.now());
      setSession((prev) => {
        if (!prev || prev.paused || !prev.resumeAt || !prev.lastActivityAt) return prev;
        if (Date.now() - prev.lastActivityAt > STALE_MS) {
          const next = structuredClone(prev);
          stopExerciseClock(next, prev.cursor?.exerciseIndex ?? 0, prev.lastActivityAt);
          next.activeMs = (next.activeMs || 0) + Math.max(0, prev.lastActivityAt - prev.resumeAt);
          next.resumeAt = null;
          next.paused = true;
          return next;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [session]);

  const finishRest = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const nextCursor = next.pendingNext || next.cursor;
      switchExerciseClock(next, next.cursor?.exerciseIndex, nextCursor.exerciseIndex);
      next.phase = 'work';
      next.cursor = nextCursor;
      next.restEndsAt = null;
      next.pendingNext = null;
      return next;
    });
  }, []);

  const adjustRest = useCallback((delta) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.restEndsAt = Math.max(Date.now(), (next.restEndsAt || Date.now()) + delta * 1000);
      return next;
    });
  }, []);

  // Overview keeps the exercise list visible during rest, with the same
  // countdown behavior and completion cues as the focused rest screen.
  useEffect(() => {
    if (layout !== 'list' || !session || session.phase !== 'rest' || !session.restEndsAt) {
      overviewRestFiredRef.current = false;
      overviewRestSecondRef.current = null;
      setShowOverviewRestAdjust(false);
      return undefined;
    }
    overviewRestFiredRef.current = false;
    overviewRestSecondRef.current = null;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((session.restEndsAt - Date.now()) / 1000));
      setNow(Date.now());
      if (remaining >= 1 && remaining <= 5 && remaining !== overviewRestSecondRef.current) {
        playRestCountdownSound(remaining);
        vibrate([remaining === 5 ? 18 : remaining === 4 ? 28 : 42]);
      }
      overviewRestSecondRef.current = remaining;
      if (remaining <= 0 && !overviewRestFiredRef.current) {
        overviewRestFiredRef.current = true;
        playRestCompleteSound();
        vibrate([110, 55, 110, 55, 190]);
        finishRest();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [layout, session?.phase, session?.restEndsAt, finishRest]);

  if (!loaded || !session) {
    return (
      <div className="console-page flex min-h-dvh items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--console-line)] border-t-[var(--console-chalk)]" />
      </div>
    );
  }

  const isRest = isRestPhase;
  const targetCursor = isRest && session.pendingNext ? session.pendingNext : session.cursor;
  const cur = session.exercises[targetCursor.exerciseIndex];
  const set = cur.sets[targetCursor.setIndex];
  const accent = categoryColor(cur.category);
  const totalSets = session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const doneSets = session.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((s) => s.completed).length,
    0,
  );
  const progress = totalSets ? doneSets / totalSets : 0;
  const elapsed = (session.activeMs || 0) + (session.resumeAt && !session.paused ? now - session.resumeAt : 0);
  const paused = !!session.paused;
  const focusKey = `${targetCursor.exerciseIndex}:${targetCursor.setIndex}`;
  const showMissing = missingAt === focusKey;
  const missing = showMissing ? missingFields(cur.type, set) : [];
  const isSkill = cur.type === 'skill' || cur.type === 'prehab';

  const exDef = getExercise(cur.exerciseId);
  const lastPerfData = getLastPerformance(cur.exerciseId, sessions);
  const lastPerf = lastPerfData ? formatLastPerformance(lastPerfData.sets, lastPerfData.type) : null;
  const rec = getRepRecommendation(cur.exerciseId, sessions, session.week);
  const hasLevels = !!exDef?.progressionLevels?.length;
  const nextLoad = rec?.weight != null ? `+${rec.weight} kg` : null;

  const updateAt = (exerciseIndex, setIndex, patch) => {
    setMissingAt(null);
    setSession((prev) => {
      const next = structuredClone(prev);
      Object.assign(next.exercises[exerciseIndex].sets[setIndex], patch);
      return next;
    });
  };

  const update = (patch) => updateAt(targetCursor.exerciseIndex, targetCursor.setIndex, patch);

  const updateExerciseNote = (text) => {
    setSession((prev) => {
      const next = structuredClone(prev);
      next.exercises[targetCursor.exerciseIndex].note = text;
      return next;
    });
  };

  const updateProgression = (level) => {
    setSession((prev) => {
      const next = structuredClone(prev);
      const exercise = next.exercises[targetCursor.exerciseIndex];
      exercise.sets[targetCursor.setIndex].progression = level;
      exercise.progression = level;
      return next;
    });
  };

  const switchExercise = (targetId) => {
    const definition = getExercise(targetId);
    if (!definition) return;
    triggerFeedback('selection');
    setMissingAt(null);
    setShowExercisePicker(false);
    setShowCue(false);
    setSession((prev) => {
      const next = structuredClone(prev);
      const exerciseIndex = targetCursor.exerciseIndex;
      const exercise = next.exercises[exerciseIndex];
      if (!exercise || exercise.exerciseId === targetId) return prev;

      stopExerciseClock(next, exerciseIndex);
      const completedSets = exercise.sets.filter((s) => s.completed);
      const pendingSets = exercise.sets.filter((s) => !s.completed);
      if (!pendingSets.length) return prev;

      const makeReplacement = (source, sets) => ({
        ...source,
        plannedExerciseId: source.plannedExerciseId || source.originalId || source.exerciseId,
        originalId: source.originalId || source.exerciseId,
        exerciseId: definition.id,
        name: definition.name,
        variation: definition.variation,
        visualId: definition.visualId,
        category: definition.category,
        type: definition.type,
        perSide: !!definition.perSide,
        durationMin: definition.durationMin || null,
        restSec: definition.restSec || null,
        rpe: definition.rpe || null,
        rir: definition.rir || null,
        progression: null,
        substitutedFrom: source.name,
        substitutedBy: undefined,
        durationMs: 0,
        timingStartedAt: Date.now(),
        sets: sets.map((s) => ({
          ...s,
          targetReps: definition.targetReps ? [...definition.targetReps] : null,
          targetSec: definition.targetSec ? [...definition.targetSec] : null,
          holdSec: definition.holdSec ?? null,
          actualReps: null,
          actualSec: null,
          weight: null,
          rpe: null,
          rir: null,
          progression: null,
          completed: false,
          skipped: false,
          completedAt: null,
        })),
      });

      if (completedSets.length) {
        const completedEntry = {
          ...exercise,
          sets: completedSets,
          substitutedBy: definition.name,
        };
        const replacementEntry = makeReplacement(exercise, pendingSets);
        next.exercises.splice(exerciseIndex, 1, completedEntry, replacementEntry);
        next.cursor = { exerciseIndex: exerciseIndex + 1, setIndex: 0 };
      } else {
        next.exercises[exerciseIndex] = makeReplacement(exercise, exercise.sets);
        next.cursor = {
          exerciseIndex,
          setIndex: Math.min(targetCursor.setIndex, next.exercises[exerciseIndex].sets.length - 1),
        };
      }

      next.phase = 'work';
      next.restEndsAt = null;
      next.pendingNext = null;
      return next;
    });
  };

  const openExercisePicker = () => {
    setPickerMode('replace');
    setShowMenu(false);
    setShowCue(false);
    setExerciseQuery('');
    setShowExercisePicker(true);
  };

  const openAddExercisePicker = () => {
    setPickerMode('add');
    setShowMenu(false);
    setShowCue(false);
    setExerciseQuery('');
    setShowExercisePicker(true);
  };

  const addSetToCurrentExercise = () => {
    setShowMenu(false);
    triggerFeedback('selection');
    setSession((prev) => {
      const next = structuredClone(prev);
      const exerciseIndex = targetCursor.exerciseIndex;
      const exercise = next.exercises[exerciseIndex];
      if (!exercise) return prev;
      const template = exercise.sets[exercise.sets.length - 1] || {};
      exercise.sets.push({
        ...template,
        id: `added_${Date.now()}_${exercise.sets.length}`,
        index: exercise.sets.length,
        actualReps: null,
        actualSec: null,
        rpe: null,
        rir: null,
        completed: false,
        skipped: false,
        completedAt: null,
        suggestedReps: null,
      });
      next.cursor = { exerciseIndex, setIndex: exercise.sets.length - 1 };
      next.phase = 'work';
      next.restEndsAt = null;
      next.pendingNext = null;
      startExerciseClock(next, exerciseIndex);
      return next;
    });
  };

  const addExerciseToSession = (definition) => {
    if (!definition) return;
    triggerFeedback('selection');
    setShowExercisePicker(false);
    setSession((prev) => {
      const next = structuredClone(prev);
      const now = Date.now();
      const setCount = Math.max(1, Number(definition.sets) || 3);
      const sets = Array.from({ length: setCount }, (_, index) => ({
        id: `added_${now}_${index}`,
        index,
        targetReps: definition.targetReps ? [...definition.targetReps] : null,
        targetSec: definition.targetSec ? [...definition.targetSec] : null,
        holdSec: definition.holdSec ?? null,
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
      next.exercises.push({
        exerciseId: definition.id,
        originalId: definition.id,
        plannedExerciseId: null,
        name: definition.name,
        variation: definition.variation,
        visualId: definition.visualId,
        category: definition.category,
        type: definition.type,
        perSide: !!definition.perSide,
        durationMin: definition.durationMin || null,
        restSec: definition.restSec || null,
        rpe: definition.rpe || null,
        rir: definition.rir || null,
        progression: null,
        note: '',
        durationMs: 0,
        timingStartedAt: null,
        sets,
      });
      // Append without interrupting the exercise currently in progress.
      next.lastActivityAt = now;
      return next;
    });
  };

  const handleExercisePick = (exercise) => {
    if (pickerMode === 'add') addExerciseToSession(exercise);
    else switchExercise(exercise.id);
  };

  const addSetAt = (exerciseIndex) => {
    triggerFeedback('selection');
    setSession((prev) => {
      const next = structuredClone(prev);
      const exercise = next.exercises[exerciseIndex];
      if (!exercise) return prev;
      const template = exercise.sets[exercise.sets.length - 1] || {};
      const nextIndex = exercise.sets.length;
      exercise.sets.push({
        ...template,
        id: `added_${Date.now()}_${exerciseIndex}_${nextIndex}`,
        index: nextIndex,
        actualReps: null,
        actualSec: null,
        weight: template.weight ?? null,
        rpe: null,
        rir: null,
        completed: false,
        skipped: false,
        completedAt: null,
        suggestedReps: null,
      });
      return next;
    });
  };

  const removeSetAt = (exerciseIndex, setIndex) => {
    triggerFeedback('selection');
    setSession((prev) => {
      const next = structuredClone(prev);
      const exercise = next.exercises[exerciseIndex];
      if (!exercise || exercise.sets.length <= 1 || !exercise.sets[setIndex]) return prev;
      exercise.sets.splice(setIndex, 1);
      exercise.sets.forEach((item, index) => { item.index = index; });
      const remap = (cursor) => {
        if (!cursor || cursor.exerciseIndex !== exerciseIndex) return cursor;
        if (cursor.setIndex > setIndex) return { ...cursor, setIndex: cursor.setIndex - 1 };
        if (cursor.setIndex === setIndex) return {
          ...cursor,
          setIndex: Math.min(setIndex, exercise.sets.length - 1),
        };
        return cursor;
      };
      next.cursor = remap(next.cursor);
      next.pendingNext = remap(next.pendingNext);
      return next;
    });
  };

  const moveExerciseInSession = (exerciseIndex, delta) => {
    const targetIndex = exerciseIndex + delta;
    if (targetIndex < 0 || targetIndex >= session.exercises.length) return;
    triggerFeedback('selection');
    setSession((prev) => {
      const next = structuredClone(prev);
      const [moved] = next.exercises.splice(exerciseIndex, 1);
      next.exercises.splice(targetIndex, 0, moved);
      const remap = (cursor) => {
        if (!cursor) return cursor;
        if (cursor.exerciseIndex === exerciseIndex) return { ...cursor, exerciseIndex: targetIndex };
        if (exerciseIndex < targetIndex && cursor.exerciseIndex > exerciseIndex && cursor.exerciseIndex <= targetIndex) {
          return { ...cursor, exerciseIndex: cursor.exerciseIndex - 1 };
        }
        if (targetIndex < exerciseIndex && cursor.exerciseIndex >= targetIndex && cursor.exerciseIndex < exerciseIndex) {
          return { ...cursor, exerciseIndex: cursor.exerciseIndex + 1 };
        }
        return cursor;
      };
      next.cursor = remap(next.cursor);
      next.pendingNext = remap(next.pendingNext);
      return next;
    });
  };

  const matchingExercises = LIBRARY_EXERCISES
    .filter((exercise) => isExerciseEquipmentAvailable(exercise.id, availableEquipment))
    .filter((exercise) => {
      const query = exerciseQuery.trim().toLowerCase();
      if (!query) return true;
      return [exercise.name, exercise.variation, exercise.category, ...(exercise.equipment || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const togglePause = () => {
    triggerFeedback('confirm');
    setSession((prev) => {
      const next = structuredClone(prev);
      if (next.paused) {
        next.paused = false;
        next.resumeAt = Date.now();
        next.lastActivityAt = Date.now();
        startExerciseClock(next, next.cursor?.exerciseIndex ?? 0);
      } else {
        if (next.resumeAt) next.activeMs = (next.activeMs || 0) + (Date.now() - next.resumeAt);
        stopExerciseClock(next, next.cursor?.exerciseIndex ?? 0);
        next.resumeAt = null;
        next.paused = true;
      }
      return next;
    });
  };

  const advance = (markPatch, cursor = session.cursor) => {
    const next = structuredClone(session);
    next.lastActivityAt = Date.now();
    next.cursor = { exerciseIndex: cursor.exerciseIndex, setIndex: cursor.setIndex };
    const exercise = next.exercises[cursor.exerciseIndex];
    Object.assign(exercise.sets[cursor.setIndex], markPatch);
    const carriedProgression = exercise.sets[cursor.setIndex].progression || null;

    const upcoming = (() => {
      const { exerciseIndex, setIndex } = cursor;
      const current = next.exercises[exerciseIndex];
      if (setIndex + 1 < current.sets.length) return { exerciseIndex, setIndex: setIndex + 1 };
      if (exerciseIndex + 1 < next.exercises.length) return { exerciseIndex: exerciseIndex + 1, setIndex: 0 };
      return null;
    })();

    if (!upcoming) {
      next.finishedAt = Date.now();
      stopExerciseClock(next, cursor.exerciseIndex);
      if (next.resumeAt && !next.paused) {
        next.activeMs = (next.activeMs || 0) + (Date.now() - next.resumeAt);
        next.resumeAt = null;
      }
      clearWarmupProgress();
      saveActiveSession(next);
      setSession(next);
      withViewTransition(() => navigate('/summary'), 'console-in');
      return;
    }

    // Carry the chosen progression and offer the previous rep result as a
    // one-tap suggestion for the next set. The athlete still confirms it.
    if (upcoming.exerciseIndex === cursor.exerciseIndex) {
      const nextSet = next.exercises[upcoming.exerciseIndex].sets[upcoming.setIndex];
      const justLoggedSet = next.exercises[cursor.exerciseIndex].sets[cursor.setIndex];
      if (carriedProgression && !nextSet.progression) nextSet.progression = carriedProgression;
      if (justLoggedSet.actualReps != null && nextSet.actualReps == null) {
        nextSet.suggestedReps = justLoggedSet.actualReps;
      }
    }

    const justFinished = next.exercises[cursor.exerciseIndex];
    const useRest = justFinished.restSec && justFinished.type !== 'skill' && justFinished.type !== 'prehab';
    if (useRest) {
      next.phase = 'rest';
      next.restEndsAt = Date.now() + justFinished.restSec * 1000;
      next.pendingNext = upcoming;
    } else {
      if (upcoming.exerciseIndex !== cursor.exerciseIndex) {
        switchExerciseClock(next, cursor.exerciseIndex, upcoming.exerciseIndex);
      }
      next.phase = 'work';
      next.cursor = upcoming;
      next.restEndsAt = null;
      next.pendingNext = null;
    }
    setSession(next);
  };

  const completeSetAt = (exerciseIndex, setIndex, force = false) => {
    if (paused) return;
    const exercise = session.exercises[exerciseIndex];
    const targetSet = exercise.sets[setIndex];
    const key = `${exerciseIndex}:${setIndex}`;
    const missingFieldsForSet = missingFields(exercise.type, targetSet);
    if (missingFieldsForSet.length && !force && missingAt !== key) {
      setMissingAt(key);
      return;
    }
    setMissingAt(null);
    const isFinalSet =
      exerciseIndex === session.exercises.length - 1 &&
      setIndex === exercise.sets.length - 1;
    triggerFeedback(isFinalSet ? 'workoutFinish' : 'setComplete');
    advance({ completed: true, skipped: false, completedAt: Date.now() }, { exerciseIndex, setIndex });
  };

  const skipSetAt = (exerciseIndex, setIndex) => {
    if (paused) return;
    triggerFeedback('selection');
    setMissingAt(null);
    advance({ completed: true, skipped: true, completedAt: Date.now() }, { exerciseIndex, setIndex });
  };

  const finishWorkout = () => {
    triggerFeedback('workoutFinish');
    const finished = structuredClone(session);
    stopExerciseClock(finished, finished.cursor?.exerciseIndex ?? 0);
    finished.finishedAt = Date.now();
    if (finished.resumeAt && !finished.paused) {
      finished.activeMs = (finished.activeMs || 0) + (Date.now() - finished.resumeAt);
      finished.resumeAt = null;
    }
    clearWarmupProgress();
    saveActiveSession(finished);
    setSession(finished);
    withViewTransition(() => navigate('/summary'), 'console-in');
  };

  const exit = () => {
    if (doneSets > 0) {
      setConfirmMode('leave');
      return;
    }
    withViewTransition(() => navigate('/'), 'console-out');
  };

  const cancelWorkout = () => {
    clearActiveSession();
    setConfirmMode(null);
    withViewTransition(() => navigate('/'), 'console-out');
  };

  const selectSetInList = (exerciseIndex, setIndex) => {
    triggerFeedback('selection');
    setMissingAt(null);
    setSession((prev) => {
      const next = structuredClone(prev);
      switchExerciseClock(next, next.cursor?.exerciseIndex, exerciseIndex);
      next.cursor = { exerciseIndex, setIndex };
      next.phase = 'work';
      next.restEndsAt = null;
      next.pendingNext = null;
      return next;
    });
  };

  const moveToExercise = (delta) => {
    const currentIndex = targetCursor.exerciseIndex;
    const nextIndex = currentIndex + delta;
    if (nextIndex < 0 || nextIndex >= session.exercises.length) return;
    triggerFeedback('selection');
    const nextExercise = session.exercises[nextIndex];
    setMissingAt(null);
    setSession((prev) => {
      const next = structuredClone(prev);
      switchExerciseClock(next, next.cursor?.exerciseIndex, nextIndex);
      next.cursor = {
        exerciseIndex: nextIndex,
        setIndex: delta > 0 ? 0 : Math.max(0, nextExercise.sets.length - 1),
      };
      next.phase = 'work';
      next.restEndsAt = null;
      next.pendingNext = null;
      return next;
    });
  };

  const openSheet = (field, exerciseIndex = targetCursor.exerciseIndex, setIndex = targetCursor.setIndex) => {
    setSheet({ field, exerciseIndex, setIndex });
    setSheetOpen(true);
  };

  const sheetExercise = sheet ? session.exercises[sheet.exerciseIndex] : null;
  const sheetSet = sheetExercise ? sheetExercise.sets[sheet.setIndex] : null;
  const sheetField = sheet?.field;
  const sheetLast = sheetExercise ? getLastPerformance(sheetExercise.exerciseId, sessions) : null;
  const sheetRecommendation = sheetExercise
    ? getRepRecommendation(sheetExercise.exerciseId, sessions, session.week, session.programId)
    : null;
  const currentExerciseWeight = sheetExercise?.sets.find((entry) => Number.isFinite(entry.weight))?.weight;
  const previousSessionWeight = sheetLast?.sets?.find((entry) => Number.isFinite(entry.weight))?.weight;
  const suggestedWeight = sheetRecommendation?.weight;
  const sheetWeightSeed = currentExerciseWeight ?? suggestedWeight ?? previousSessionWeight ?? 0;
  const sheetSeed = sheetField === 'weight'
    ? sheetWeightSeed
    : sheetSet?.suggestedReps ?? first(sheetSet?.targetReps) ?? first(sheetSet?.targetSec) ?? first(sheetSet?.holdSec) ?? 0;
  const previousSetReps = sheetExercise?.sets
    .slice(0, sheet?.setIndex ?? 0)
    .reverse()
    .find((entry) => entry.completed && !entry.skipped && Number.isFinite(entry.actualReps))
    ?.actualReps;
  const sheetStep = sheetExercise && sheetField
    ? loadExerciseIncrement(sheetExercise.exerciseId, sheetField, DEFAULT_STEP[sheetField])
    : 1;
  const sheetUnit = sheetField ? FIELD_UNIT[sheetField] : '';
  const sheetPresets = (() => {
    if (!sheetField || !sheetSet) return [];
    if (sheetField === 'weight') {
      const lastWeight = previousSessionWeight;
      return [
        { label: 'Bodyweight', value: 0 },
        ...(Number.isFinite(lastWeight) ? [{ label: `Last ${lastWeight} kg`, value: lastWeight }] : []),
        ...(Number.isFinite(suggestedWeight) && suggestedWeight !== sheetSeed
          ? [{ label: `Suggested +${suggestedWeight} kg`, value: suggestedWeight }]
          : []),
      ];
    }
    const lastValue = sheetLast?.sets?.find((entry) => Number.isFinite(entry[FIELD_KEY[sheetField]]))?.[FIELD_KEY[sheetField]];
    return [
      { label: `Target ${sheetSeed}${sheetUnit}`, value: sheetSeed },
      ...(Number.isFinite(previousSetReps) && sheetField === 'reps' && previousSetReps !== sheetSeed
        ? [{ label: `Previous set ${previousSetReps}`, value: previousSetReps }]
        : []),
      ...(Number.isFinite(lastValue) && lastValue !== sheetSeed
        ? [{ label: `Last ${lastValue}${sheetUnit}`, value: lastValue }]
        : []),
    ];
  })();

  const commitSheet = (value) => {
    if (!sheet) return;
    if (sheet.field !== 'weight') {
      updateAt(sheet.exerciseIndex, sheet.setIndex, {
        [FIELD_KEY[sheet.field]]: value,
        ...(sheet.field === 'reps' ? { suggestedReps: null } : {}),
      });
      return;
    }

    setMissingAt(null);
    setSession((prev) => {
      const next = structuredClone(prev);
      const exercise = next.exercises[sheet.exerciseIndex];
      if (!exercise?.sets?.[sheet.setIndex]) return prev;
      // One load selection configures every remaining set, while already
      // completed sets retain the load that was actually performed.
      next.exercises[sheet.exerciseIndex] = applyLoadToExerciseSets(exercise, sheet.setIndex, value);
      next.lastActivityAt = Date.now();
      return next;
    });
  };

  const changeSheetStep = (step) => {
    if (!sheetExercise || !sheetField) return;
    saveExerciseIncrement(sheetExercise.exerciseId, sheetField, step);
    setIncrementTick((tick) => tick + 1);
  };

  const renderTopBar = () => (
    <header className="console-rail">
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={exit}
          aria-label="Exit workout"
          className="console-icon-button"
        >
          <X size={17} />
        </button>
        {layout === 'list' && isRest && (() => {
          const remainingSec = Math.max(0, Math.ceil(((session.restEndsAt || Date.now()) - now) / 1000));
          const plannedRestSec = Math.max(1, Number(session.exercises[session.cursor.exerciseIndex]?.restSec) || remainingSec || 1);
          const restProgress = Math.min(1, Math.max(0, 1 - remainingSec / plannedRestSec));
          return (
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => setShowOverviewRestAdjust((open) => !open)}
                aria-expanded={showOverviewRestAdjust}
                aria-label={showOverviewRestAdjust ? 'Hide rest timer card' : 'Open rest timer controls'}
                className="flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold tabular-nums transition-all duration-200"
                style={{
                  borderColor: 'color-mix(in srgb, var(--brand) 42%, transparent)',
                  background: 'color-mix(in srgb, var(--brand) 16%, var(--console-surface))',
                  color: 'var(--brand)',
                  boxShadow: showOverviewRestAdjust ? '0 0 0 2px color-mix(in srgb, var(--brand) 16%, transparent)' : 'none',
                }}
              >
                <Clock3 size={13} strokeWidth={2.3} />
                {formatClock(remainingSec * 1000)}
              </button>
              {showOverviewRestAdjust && (
                <div
                  role="group"
                  aria-label="Rest timer controls"
                  className="console-menu-enter absolute left-0 top-10 z-50 w-[min(320px,calc(100vw-24px))] rounded-2xl border p-4 shadow-2xl shadow-black/50"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--brand) 28%, var(--console-line))',
                    background: 'var(--console-surface)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--brand)' }}>
                      <Clock3 size={14} /> Rest timer
                    </div>
                    <span className="text-[10px] font-medium text-[var(--console-steel)]">Overview</span>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-[42px] font-extrabold leading-none tracking-[-0.055em] tabular-nums text-[var(--console-chalk)]">
                      {formatClock(remainingSec * 1000)}
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: 'var(--console-line)' }}>
                      <div
                        className="h-full rounded-full transition-[width] duration-300 ease-linear"
                        style={{ width: `${restProgress * 100}%`, background: 'var(--brand)' }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-[var(--console-steel)]">
                      <span>Rest progress</span>
                      <span>{Math.round(restProgress * 100)}%</span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => adjustRest(-30)}
                      aria-label="Reduce rest by 30 seconds"
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border text-[13px] font-bold transition-transform active:scale-[0.97]"
                      style={{
                        borderColor: 'color-mix(in srgb, var(--brand) 36%, transparent)',
                        background: 'color-mix(in srgb, var(--brand) 13%, var(--console-surface-2))',
                        color: 'var(--brand)',
                      }}
                    >
                      <Minus size={16} /> 30 sec
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustRest(30)}
                      aria-label="Add 30 seconds of rest"
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border text-[13px] font-bold transition-transform active:scale-[0.97]"
                      style={{
                        borderColor: 'color-mix(in srgb, var(--brand) 36%, transparent)',
                        background: 'color-mix(in srgb, var(--brand) 13%, var(--console-surface-2))',
                        color: 'var(--brand)',
                      }}
                    >
                      <Plus size={16} /> 30 sec
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOverviewRestAdjust(false);
                      finishRest();
                    }}
                    className="mt-2 flex h-9 w-full items-center justify-center rounded-lg text-[11px] font-semibold text-[var(--console-steel)] transition-colors hover:bg-[var(--console-surface-2)] hover:text-[var(--console-chalk)]"
                  >
                    Skip timer
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <div className="min-w-0 flex-1 text-center">
        <p className="truncate text-[12px] font-semibold text-[var(--console-chalk)]">
          {session.workoutName}
        </p>
        {!isRest && (
          <p className="mt-0.5 text-[10px] font-medium tabular-nums text-[var(--console-steel)]">
            {doneSets} of {totalSets} sets
            {session.mode && session.mode !== 'full' ? ` (${MODES[session.mode]?.label})` : ''}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[15px] font-semibold tabular-nums tracking-[-0.02em] text-[var(--console-chalk)]">
          {formatClock(elapsed)}
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((open) => !open)}
            aria-label="Workout options"
            aria-expanded={showMenu}
            className="console-icon-button"
          >
            <MoreVertical size={17} />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div
                role="menu"
                aria-label="Workout options"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setShowMenu(false);
                }}
                className="console-menu-enter absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-[var(--console-line)] bg-[var(--console-surface)] p-1 shadow-2xl shadow-black/60"
              >
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold text-[var(--console-steel)]">
                  View
                </p>
                {LAYOUTS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={layout === option.id}
                    onClick={() => {
                      setLayout(option.id);
                      setShowMenu(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-semibold ${
                      layout === option.id
                        ? 'bg-[var(--console-surface-2)] text-[var(--console-chalk)]'
                        : 'text-[var(--console-steel)] hover:text-[var(--console-chalk)]'
                    }`}
                  >
                    <span className="flex-1">{option.label}</span>
                    {layout === option.id && <Check size={13} />}
                  </button>
                ))}
                {/* Quick access: frequent in-workout actions live outside the
                    Manage group so they are always one tap away. */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={addSetToCurrentExercise}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold text-[var(--console-steel)] hover:bg-[var(--console-surface-2)] hover:text-[var(--console-chalk)]"
                >
                  <Plus size={14} /> Add set
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    // Opens the weight wheel for the current set; picking a
                    // load applies it to every remaining set of this exercise
                    // (applyLoadToExerciseSets), so the added weight is tracked.
                    setShowMenu(false);
                    openSheet('weight');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold text-[var(--console-steel)] hover:bg-[var(--console-surface-2)] hover:text-[var(--console-chalk)]"
                >
                  <Weight size={14} /> Set added weight
                </button>
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold text-[var(--console-steel)]">
                  Manage
                </p>
                <button
                  type="button"
                  role="menuitem"
                  onClick={openExercisePicker}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold text-[var(--console-steel)] hover:bg-[var(--console-surface-2)] hover:text-[var(--console-chalk)]"
                >
                  <ArrowLeftRight size={14} /> Change exercise
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={openAddExercisePicker}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold text-[var(--console-steel)] hover:bg-[var(--console-surface-2)] hover:text-[var(--console-chalk)]"
                >
                  <ListPlus size={14} /> Add exercise
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    if (reorderMode) {
                      setReorderMode(false);
                      if (layoutBeforeReorder) setLayout(layoutBeforeReorder);
                      setLayoutBeforeReorder(null);
                    } else {
                      setLayoutBeforeReorder(layout);
                      setLayout('list');
                      setReorderMode(true);
                    }
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold text-[var(--console-steel)] hover:bg-[var(--console-surface-2)] hover:text-[var(--console-chalk)]"
                >
                  <ArrowUpDown size={14} /> {reorderMode ? 'Done reordering' : 'Reorder exercises'}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowMenu(false);
                    finishWorkout();
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-[var(--console-line)] px-3 py-2.5 text-left text-[12px] font-semibold text-[var(--console-steel)] hover:text-[var(--console-chalk)]"
                >
                  <Flag size={14} /> Finish workout
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowMenu(false);
                    setConfirmMode('cancel');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold text-[var(--console-oxide)] hover:bg-[var(--console-surface-2)]"
                >
                  <Trash2 size={14} /> Cancel workout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );

  const confirmLeave = confirmMode === 'leave';
  const confirmModal = confirmMode && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6"
      onClick={() => setConfirmMode(null)}
    >
      <div
        className="w-full max-w-[340px] rounded-2xl border border-[var(--console-line)] bg-[var(--console-surface)] p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: confirmLeave
              ? 'color-mix(in srgb, var(--console-chalk) 10%, transparent)'
              : 'color-mix(in srgb, var(--console-oxide) 16%, transparent)',
          }}
        >
          {confirmLeave ? (
            <X size={18} className="text-[var(--console-chalk)]" />
          ) : (
            <Trash2 size={18} className="text-[var(--console-oxide)]" />
          )}
        </div>
        <h3 className="text-[16px] font-bold text-[var(--console-chalk)]">
          {confirmLeave ? 'Leave workout?' : 'Cancel workout?'}
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--console-steel)]">
          {confirmLeave
            ? 'Your progress is saved. You can resume from the dock.'
            : 'Your progress for this session will be discarded. This cannot be undone.'}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setConfirmMode(null)}
            className="h-11 rounded-xl border border-[var(--console-line)] text-[13px] font-semibold text-[var(--console-chalk)]"
          >
            Keep training
          </button>
          {confirmLeave ? (
            <button
              type="button"
              onClick={() => {
                setConfirmMode(null);
                withViewTransition(() => navigate('/'), 'console-out');
              }}
              className="h-11 rounded-xl bg-[var(--console-chalk)] text-[13px] font-semibold text-[var(--console-bg)]"
            >
              Leave workout
            </button>
          ) : (
            <button
              type="button"
              onClick={cancelWorkout}
              className="h-11 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: 'var(--console-oxide)' }}
            >
              Cancel workout
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const sheets = (
    <>
      {sheet && sheetSet && sheetField && (
        <WheelSheet
          key={`${sheet.exerciseIndex}-${sheet.setIndex}-${sheetField}`}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={FIELD_TITLE[sheetField]}
          description={`${sheetExercise.name}, set ${sheet.setIndex + 1}`}
          unit={sheetUnit}
          value={sheetSet[FIELD_KEY[sheetField]]}
          seed={sheetSeed}
          min={0}
          max={FIELD_MAX[sheetField]}
          step={sheetStep}
          presets={sheetPresets}
          stepOptions={STEP_OPTIONS[sheetField]}
          onStepChange={changeSheetStep}
          onCommit={commitSheet}
        />
      )}

      <ConsoleSheet
        open={showCue}
        onOpenChange={setShowCue}
        title={cur.name}
        description="Form cue and exercise details"
        footer={
          <button type="button" onClick={() => setShowCue(false)} className="console-primary">
            Done
          </button>
        }
      >
        <div className="space-y-4 pb-2">
          {rec?.text && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--console-steel)]">Coach</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--console-chalk)]">{rec.text}</p>
            </div>
          )}
          {exDef?.notes && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--console-steel)]">Form cue</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--console-chalk)]">{exDef.notes}</p>
            </div>
          )}
          {exDef?.muscles?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--console-steel)]">Muscles</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--console-chalk)]">
                {exDef.muscles.join(', ')}
              </p>
            </div>
          )}
          {exDef?.equipment?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--console-steel)]">Equipment</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--console-chalk)]">
                {exDef.equipment.join(', ')}
              </p>
            </div>
          )}
          <VariationSwitcher
            originalId={cur.originalId || cur.exerciseId}
            currentId={cur.exerciseId}
            onSwitch={switchExercise}
            equipment={availableEquipment}
          />
          <button
            type="button"
            onClick={openExercisePicker}
            disabled={!cur.sets.some((s) => !s.completed)}
            className="group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold text-[var(--console-steel)] transition-colors hover:bg-[var(--console-surface-2)] hover:text-[var(--console-chalk)] disabled:opacity-35"
          >
            <ArrowLeftRight size={13} className="shrink-0 opacity-75 transition-transform group-hover:rotate-180" />
            <span className="flex-1">Choose a different exercise</span>
            <span className="text-[10px] font-medium opacity-60">Replace</span>
          </button>
        </div>
      </ConsoleSheet>

      <ConsoleSheet
        open={showExercisePicker}
        onOpenChange={setShowExercisePicker}
        title={pickerMode === 'add' ? 'Add exercise' : 'Change exercise'}
        description={pickerMode === 'add' ? 'Add a movement to the end of this workout' : 'Choose an exercise for the remaining sets'}
      >
        <div className="space-y-3 pb-2">
          <p className="text-[11px] leading-relaxed text-[var(--console-steel)]">
            Completed sets stay attached to the exercise you actually performed. Remaining sets move to the new exercise and are tracked separately.
          </p>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--console-steel)]" />
            <input
              type="search"
              value={exerciseQuery}
              onChange={(event) => setExerciseQuery(event.target.value)}
              placeholder="Search exercises or equipment"
              className="h-11 w-full rounded-xl border border-[var(--console-line)] bg-transparent pl-9 pr-3 text-[13px] text-[var(--console-chalk)] outline-none placeholder:text-[var(--console-steel)] focus:border-[var(--console-chalk)]"
            />
          </div>
          {!cur.sets.some((s) => !s.completed) && (
            <p className="rounded-lg bg-[var(--console-surface-2)] p-3 text-[12px] text-[var(--console-steel)]">
              All sets for this exercise are already completed. Choose the next exercise instead.
            </p>
          )}
          <div className="max-h-[48dvh] space-y-1 overflow-y-auto">
            {matchingExercises.map((exercise) => {
              const isCurrent = exercise.id === cur.exerciseId;
              return (
                <button
                  key={exercise.id}
                  type="button"
                  disabled={isCurrent || !cur.sets.some((s) => !s.completed)}
                  onClick={() => handleExercisePick(exercise)}
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition-colors hover:border-[var(--console-line)] hover:bg-[var(--console-surface-2)] disabled:cursor-default disabled:opacity-45"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[var(--console-chalk)]">{exercise.name}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-[var(--console-steel)]">
                      {exercise.variation} · {exercise.category} · {exercise.difficulty || 'General'}
                    </span>
                  </span>
                  {isCurrent && <span className="text-[10px] font-semibold text-[var(--console-steel)]">Current</span>}
                </button>
              );
            })}
            {matchingExercises.length === 0 && (
              <p className="py-8 text-center text-[12px] text-[var(--console-steel)]">No matching exercises.</p>
            )}
          </div>
        </div>
      </ConsoleSheet>

      <ConsoleSheet
        open={showNote}
        onOpenChange={setShowNote}
        title="Exercise note"
        description="A short note for this exercise"
        footer={
          <button type="button" onClick={() => setShowNote(false)} className="console-primary">
            Done
          </button>
        }
      >
        <textarea
          value={cur.note || ''}
          onChange={(event) => updateExerciseNote(event.target.value)}
          placeholder="How did this feel? Anything to remember…"
          rows={6}
          className="w-full resize-none border border-[var(--console-line)] bg-transparent p-3 text-[14px] leading-relaxed text-[var(--console-chalk)] outline-none placeholder:text-[var(--console-steel)] focus:border-[var(--console-chalk)]"
        />
      </ConsoleSheet>
    </>
  );

  const nextSetIndex = targetCursor.setIndex;
  const justFinished = session.exercises[session.cursor.exerciseIndex];

  // ── LIST: editable overview ──
  if (layout === 'list') {
    return (
      <div className="console-page">
        <div className="console-shell" data-workout-layout="list">
          <WorkoutListLayout
            session={session}
            doneSets={doneSets}
            totalSets={totalSets}
            progress={progress}
            paused={paused}
            onSelectSet={selectSetInList}
            openSheet={openSheet}
            updateAt={updateAt}
            onCompleteAt={completeSetAt}
            onSkipAt={skipSetAt}
            reorderMode={reorderMode}
            onMoveExercise={moveExerciseInSession}
            onAddSet={addSetAt}
            onRemoveSet={removeSetAt}
            togglePause={togglePause}
            renderTopBar={renderTopBar}
            missingAt={missingAt}
            animate={stageAnimate}
          />
        </div>
        {sheets}
        {confirmModal}
      </div>
    );
  }

  // ── FOCUS / REST: one console, one state at a time ──
  return (
    <div className="console-page">
      <div
        className="console-shell"
        data-workout-layout="focus"
        data-workout-state={isRest ? 'rest' : 'focus'}
        style={{ '--console-signal': accent }}
      >
        {renderTopBar()}

        <div
          key={isRest ? 'rest' : 'focus'}
          className={`console-stage ${stageAnimate ? 'console-stage-enter' : ''}`}
        >
          {isRest ? (
            <RestState
              restEndsAt={session.restEndsAt || Date.now()}
              totalDurationSec={justFinished?.restSec || 90}
              nextExercise={cur}
              nextSetIndex={nextSetIndex}
              onDone={finishRest}
              onAdjust={adjustRest}
              accent={accent}
            />
          ) : (
            <>
              <main className="min-h-0 flex-1 overflow-y-auto">
                <section className={`console-hero ${visualMode === 'watermark' ? 'console-hero-watermark' : 'console-hero-badge-mode'}`}>
            {visualMode === 'watermark' ? (
              <>
                <div className="console-watermark-stage">
                  <div className="console-watermark" aria-hidden="true">
                    <ExerciseVisual visualId={cur.visualId} category={cur.category} className="h-full w-full" />
                  </div>
                  <div className="console-watermark-title">
                    <h1 className="console-title">{cur.name}</h1>
                  </div>
                </div>
                <div className="console-watermark-meta">
                  <span className="console-signal" aria-hidden="true" />
                  <p className="console-category">{cur.category}</p>
                  <p className="mt-1 text-[13px] text-[var(--console-steel)]">{cur.variation}</p>
                  <p className="console-set-context">Set {targetCursor.setIndex + 1} of {cur.sets.length}{set.completed ? (set.skipped ? ', skipped' : ', logged') : ', ready to log'}</p>
                </div>
              </>
            ) : (
              <div className="console-hero-body">
                <div className="console-hero-with-badge">
                  <div className="console-hero-badge" aria-hidden="true">
                    <ExerciseVisual visualId={cur.visualId} category={cur.category} className="h-full w-full" />
                  </div>
                  <div className="console-hero-copy">
                    <span className="console-signal" aria-hidden="true" />
                    <p className="console-category">{cur.category}</p>
                    <h1 className="console-title">{cur.name}</h1>
                    <p className="mt-1 text-[13px] text-[var(--console-steel)]">{cur.variation}</p>
                  </div>
                </div>
                <p className="console-set-context">Set {targetCursor.setIndex + 1} of {cur.sets.length}{set.completed ? (set.skipped ? ', skipped' : ', logged') : ', ready to log'}</p>
              </div>
            )}

            {hasLevels && (
              <ProgressionSelector
                levels={exDef.progressionLevels}
                value={set.progression}
                onChange={updateProgression}
                accent={accent}
                compact={['frontlever', 'flrow', 'ringrow'].includes(cur.visualId)}
              />
            )}

            {cur.sets.length > 1 && (
              <div
                className="console-ladder"
                aria-label={`${cur.name} set progress`}
              >
                {cur.sets.map((rowSet, index) => {
                  const isCurrent = index === targetCursor.setIndex;
                  const state = rowSet.completed ? 'is-past' : '';
                  return (
                    <button
                      key={rowSet.id || index}
                      type="button"
                      className={`console-ladder-step ${state} ${isCurrent ? 'is-current' : ''}`}
                      aria-label={`Go to set ${index + 1}${rowSet.completed ? ', completed' : ''}`}
                      aria-current={isCurrent ? 'step' : undefined}
                      aria-pressed={isCurrent}
                      disabled={paused}
                      onClick={() => selectSetInList(targetCursor.exerciseIndex, index)}
                    >
                      <span className="console-ladder-bar" />
                      <span className="console-ladder-label">
                        {rowSet.completed ? 'Done' : `Set ${index + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="console-readout-row">
              <div className="console-readout-cell">
                <span className="console-readout-label">Target</span>
                <span className="console-readout-value">{exDef ? formatTarget(exDef) : '—'}</span>
              </div>
              {lastPerf && (
                <div className="console-readout-cell">
                  <span className="console-readout-label">Last</span>
                  <span className="console-readout-value">{lastPerf}</span>
                </div>
              )}
              {nextLoad && (
                <div className="console-readout-cell">
                  <span className="console-readout-label">Next</span>
                  <span className="console-readout-value">{nextLoad}</span>
                </div>
              )}
            </div>
          </section>

          <section className="console-input">
            <SetInputs exercise={cur} set={set} onOpen={openSheet} />
            <EffortRow exercise={cur} set={set} update={update} />
            {showMissing && missing.length > 0 && (
              <div className="console-warning">
                <span>No {missing.join(' or ')} entered for this set.</span>
                <button
                  type="button"
                  onClick={() => completeSetAt(targetCursor.exerciseIndex, targetCursor.setIndex, true)}
                  className="shrink-0 border-b border-[#E3B56B] text-[12px] font-semibold text-[#E3B56B]"
                >
                  Log anyway
                </button>
              </div>
            )}
          </section>

          <section className="console-tools" aria-label="Session tools">
            <div className="console-tools-heading">
              <span>Session tools</span>
              <span>{lastPerf ? `Last time: ${lastPerf}` : 'First time logging this exercise'}</span>
            </div>
            {rec?.text && (
              <p className="console-tools-coach">
                <Info size={13} aria-hidden="true" />
                <span>{rec.text}</span>
              </p>
            )}
            <div className="console-tools-actions">
              <button type="button" onClick={() => setShowCue(true)} className="console-tool-button">
                <Info size={15} aria-hidden="true" /> Form cue
              </button>
              <button type="button" onClick={() => setShowNote(true)} className="console-tool-button">
                <StickyNote size={15} aria-hidden="true" /> Note
              </button>
            </div>
          </section>
        </main>

        <footer className="console-action">
          {paused ? (
            <button type="button" onClick={togglePause} className="console-primary">
              <Play size={17} fill="currentColor" /> Resume workout
            </button>
          ) : (
            <button
              type="button"
              onClick={() => completeSetAt(targetCursor.exerciseIndex, targetCursor.setIndex)}
              className="console-primary"
            >
              <Check size={18} strokeWidth={2.6} /> {isSkill ? 'Mark done' : 'Complete set'}
            </button>
          )}

          <div className="console-secondary-actions">
            <button
              type="button"
              onClick={() => moveToExercise(-1)}
              disabled={paused || targetCursor.exerciseIndex === 0}
              className="console-text-action"
              aria-label="Previous exercise"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              type="button"
              onClick={togglePause}
              className="console-text-action"
            >
              {paused ? <Play size={13} /> : <Pause size={13} />}
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={() => moveToExercise(1)}
              disabled={paused || targetCursor.exerciseIndex === session.exercises.length - 1}
              className="console-text-action"
              aria-label="Next exercise"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
              </footer>
            </>
          )}
        </div>
      </div>

      {sheets}
      {confirmModal}
    </div>
  );
}
