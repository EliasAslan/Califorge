import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Info, Check, ChevronLeft, ChevronRight, Pause, Play, MoreVertical, Flag, Trash2,
  StickyNote, ArrowLeftRight, Search,
} from 'lucide-react';
import { categoryColor, getExercise, LIBRARY_EXERCISES, MODES } from '@/lib/programData';
import {
  formatTarget, getLastPerformance, formatLastPerformance, formatClock, getRepRecommendation,
} from '@/lib/trainingLogic';
import {
  loadActiveSession, saveActiveSession, clearActiveSession, loadWorkoutLayout, saveWorkoutLayout,
  loadExerciseIncrement, saveExerciseIncrement, STALE_MS,
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
import { triggerFeedback } from '@/lib/workoutFeedback';
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
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [, setIncrementTick] = useState(0);
  const [stageAnimate, setStageAnimate] = useState(false);
  const stageMountedRef = useRef(false);
  const isRestPhase = session?.phase === 'rest';
  const { data: sessions = [] } = useSessions();
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
    if (stored.resumeAt && !stored.paused) stored.resumeAt = Date.now();
    setSession(stored);
    setLoaded(true);
  }, [navigate]);

  useEffect(() => {
    if (session) saveActiveSession(session);
  }, [session]);

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
      next.phase = 'work';
      next.cursor = next.pendingNext || next.cursor;
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
    setShowMenu(false);
    setShowCue(false);
    setExerciseQuery('');
    setShowExercisePicker(true);
  };

  const matchingExercises = LIBRARY_EXERCISES
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
      } else {
        if (next.resumeAt) next.activeMs = (next.activeMs || 0) + (Date.now() - next.resumeAt);
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
      if (next.resumeAt && !next.paused) {
        next.activeMs = (next.activeMs || 0) + (Date.now() - next.resumeAt);
        next.resumeAt = null;
      }
      saveActiveSession(next);
      setSession(next);
      withViewTransition(() => navigate('/summary'), 'console-in');
      return;
    }

    // carry the chosen progression forward to the next set of the same exercise
    if (upcoming.exerciseIndex === cursor.exerciseIndex && carriedProgression) {
      const nextSet = next.exercises[upcoming.exerciseIndex].sets[upcoming.setIndex];
      if (!nextSet.progression) nextSet.progression = carriedProgression;
    }

    const justFinished = next.exercises[cursor.exerciseIndex];
    const useRest = justFinished.restSec && justFinished.type !== 'skill' && justFinished.type !== 'prehab';
    if (useRest) {
      next.phase = 'rest';
      next.restEndsAt = Date.now() + justFinished.restSec * 1000;
      next.pendingNext = upcoming;
    } else {
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
    finished.finishedAt = Date.now();
    if (finished.resumeAt && !finished.paused) {
      finished.activeMs = (finished.activeMs || 0) + (Date.now() - finished.resumeAt);
      finished.resumeAt = null;
    }
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
  const sheetSeed = sheetField === 'weight'
    ? 0
    : first(sheetSet?.targetReps) ?? first(sheetSet?.targetSec) ?? first(sheetSet?.holdSec) ?? 0;
  const sheetStep = sheetExercise && sheetField
    ? loadExerciseIncrement(sheetExercise.exerciseId, sheetField, DEFAULT_STEP[sheetField])
    : 1;
  const sheetUnit = sheetField ? FIELD_UNIT[sheetField] : '';
  const sheetPresets = (() => {
    if (!sheetField || !sheetSet) return [];
    if (sheetField === 'weight') {
      const lastWeight = sheetLast?.sets?.[0]?.weight;
      return [
        { label: 'Bodyweight', value: 0 },
        ...(Number.isFinite(lastWeight) ? [{ label: `Last ${lastWeight} kg`, value: lastWeight }] : []),
      ];
    }
    const lastValue = sheetLast?.sets?.[0]?.[FIELD_KEY[sheetField]];
    return [
      { label: `Target ${sheetSeed}${sheetUnit}`, value: sheetSeed },
      ...(Number.isFinite(lastValue) && lastValue !== sheetSeed
        ? [{ label: `Last ${lastValue}${sheetUnit}`, value: lastValue }]
        : []),
    ];
  })();

  const commitSheet = (value) => {
    if (!sheet) return;
    updateAt(sheet.exerciseIndex, sheet.setIndex, { [FIELD_KEY[sheet.field]]: value });
  };

  const changeSheetStep = (step) => {
    if (!sheetExercise || !sheetField) return;
    saveExerciseIncrement(sheetExercise.exerciseId, sheetField, step);
    setIncrementTick((tick) => tick + 1);
  };

  const renderTopBar = () => (
    <header className="console-rail">
      <button
        type="button"
        onClick={exit}
        aria-label="Exit workout"
        className="console-icon-button"
      >
        <X size={17} />
      </button>

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
          />
          <button
            type="button"
            onClick={openExercisePicker}
            disabled={!cur.sets.some((s) => !s.completed)}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--console-line)] px-3.5 py-3 text-left text-[12px] font-semibold text-[var(--console-chalk)] transition-colors hover:bg-[var(--console-surface-2)] disabled:opacity-40"
          >
            <span>Choose a different exercise</span>
            <ArrowLeftRight size={14} />
          </button>
        </div>
      </ConsoleSheet>

      <ConsoleSheet
        open={showExercisePicker}
        onOpenChange={setShowExercisePicker}
        title="Change exercise"
        description="Choose an exercise for the remaining sets"
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
                  onClick={() => switchExercise(exercise.id)}
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
                <section className="console-hero">
            <div className="console-watermark" aria-hidden="true">
              <ExerciseVisual
                visualId={cur.visualId}
                category={cur.category}
                color="var(--console-chalk)"
                className="h-full w-full"
              />
            </div>
            <span className="console-signal" aria-hidden="true" />
            <p className="console-category">{cur.category}</p>
            <h1 className="console-title">{cur.name}</h1>
            <p className="mt-1 text-[13px] text-[var(--console-steel)]">{cur.variation}</p>
            <p className="console-set-context">
              Set {targetCursor.setIndex + 1} of {cur.sets.length}
              {set.completed
                ? set.skipped
                  ? ', skipped'
                  : ', logged'
                : ', ready to log'}
            </p>

            {hasLevels && (
              <ProgressionSelector
                levels={exDef.progressionLevels}
                value={set.progression}
                onChange={updateProgression}
                accent={accent}
              />
            )}

            {cur.sets.length > 1 && (
              <div className="console-ladder" aria-label={`${cur.name} set progress`}>
                {cur.sets.map((rowSet, index) => {
                  const isCurrent = index === targetCursor.setIndex;
                  const state = rowSet.completed ? 'is-past' : '';
                  return (
                    <div
                      key={rowSet.id || index}
                      className={`console-ladder-step ${state} ${isCurrent ? 'is-current' : ''}`}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      <div className="console-ladder-bar" />
                      <span className="console-ladder-label">
                        {rowSet.completed ? 'Done' : `Set ${index + 1}`}
                      </span>
                    </div>
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
