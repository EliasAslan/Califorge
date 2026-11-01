import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Info, Check, SkipForward, Pause, Play, MoreVertical, Flag, Trash2,
  StickyNote,
} from 'lucide-react';
import { categoryColor, getExercise, MODES } from '@/lib/programData';
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
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [missingAt, setMissingAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [layout, setLayout] = useState(() => loadWorkoutLayout());
  const [sheet, setSheet] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showCue, setShowCue] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [, setIncrementTick] = useState(0);
  const { data: sessions = [] } = useSessions();
  useConsoleChrome();

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

  const isRest = session.phase === 'rest';
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
    setMissingAt(null);
    setSession((prev) => {
      const next = structuredClone(prev);
      const exercise = next.exercises[targetCursor.exerciseIndex];
      const definition = getExercise(targetId);
      if (!definition) return prev;
      exercise.originalId = exercise.originalId || exercise.exerciseId;
      exercise.exerciseId = definition.id;
      exercise.name = definition.name;
      exercise.variation = definition.variation;
      exercise.visualId = definition.visualId;
      exercise.category = definition.category;
      exercise.type = definition.type;
      exercise.perSide = !!definition.perSide;
      exercise.durationMin = definition.durationMin || null;
      exercise.restSec = definition.restSec || null;
      exercise.rpe = definition.rpe || null;
      exercise.rir = definition.rir || null;
      exercise.sets.forEach((s) => {
        if (s.completed) return;
        s.targetReps = definition.targetReps ? [...definition.targetReps] : null;
        s.targetSec = definition.targetSec ? [...definition.targetSec] : null;
        s.holdSec = definition.holdSec ?? null;
        s.actualReps = null;
        s.actualSec = null;
        s.weight = null;
        s.rpe = null;
        s.rir = null;
        s.progression = null;
      });
      exercise.progression = null;
      return next;
    });
  };

  const togglePause = () => {
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
      navigate('/summary');
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
    advance({ completed: true, skipped: false, completedAt: Date.now() }, { exerciseIndex, setIndex });
  };

  const skipSetAt = (exerciseIndex, setIndex) => {
    if (paused) return;
    setMissingAt(null);
    advance({ completed: true, skipped: true, completedAt: Date.now() }, { exerciseIndex, setIndex });
  };

  const finishWorkout = () => {
    const finished = structuredClone(session);
    finished.finishedAt = Date.now();
    if (finished.resumeAt && !finished.paused) {
      finished.activeMs = (finished.activeMs || 0) + (Date.now() - finished.resumeAt);
      finished.resumeAt = null;
    }
    saveActiveSession(finished);
    setSession(finished);
    navigate('/summary');
  };

  const exit = () => {
    if (doneSets > 0 && !window.confirm('Leave the workout? Your progress is saved so you can resume.')) return;
    navigate('/');
  };

  const cancelWorkout = () => {
    clearActiveSession();
    setConfirmCancel(false);
    navigate('/');
  };

  const selectSetInList = (exerciseIndex, setIndex) => {
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
                className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-[var(--console-line)] bg-[var(--console-surface)] p-1 shadow-2xl shadow-black/60"
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
                    setConfirmCancel(true);
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

  const confirmCancelModal = confirmCancel && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6"
      onClick={() => setConfirmCancel(false)}
    >
      <div
        className="w-full max-w-[340px] rounded-2xl border border-[var(--console-line)] bg-[var(--console-surface)] p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--console-oxide)_16%,transparent)]">
          <Trash2 size={18} className="text-[var(--console-oxide)]" />
        </div>
        <h3 className="text-[16px] font-bold text-[var(--console-chalk)]">Cancel workout?</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--console-steel)]">
          Your progress for this session will be discarded. This cannot be undone.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setConfirmCancel(false)}
            className="h-11 rounded-xl border border-[var(--console-line)] text-[13px] font-semibold text-[var(--console-chalk)]"
          >
            Keep workout
          </button>
          <button
            type="button"
            onClick={cancelWorkout}
            className="h-11 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: 'var(--console-oxide)' }}
          >
            Cancel workout
          </button>
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

  // ── REST: the same screen, one state at a time ──
  if (isRest) {
    const nextSetIndex = targetCursor.setIndex;
    const justFinished = session.exercises[session.cursor.exerciseIndex];
    return (
      <div className="console-page">
        <div className="console-shell" data-workout-layout="focus" style={{ '--console-signal': accent }}>
          {renderTopBar()}
          <RestState
            restEndsAt={session.restEndsAt || Date.now()}
            totalDurationSec={justFinished?.restSec || 90}
            nextExercise={cur}
            nextSetIndex={nextSetIndex}
            onDone={finishRest}
            onAdjust={adjustRest}
            accent={accent}
          />
        </div>
        {sheets}
        {confirmCancelModal}
      </div>
    );
  }

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
          />
        </div>
        {sheets}
        {confirmCancelModal}
      </div>
    );
  }

  // ── FOCUS: the console ──
  return (
    <div className="console-page">
      <div className="console-shell" data-workout-layout="focus" style={{ '--console-signal': accent }}>
        {renderTopBar()}

        <main className="min-h-0 overflow-y-auto">
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
              {set.completed ? (set.skipped ? ' · Skipped' : ' · Logged') : ' · Ready to log'}
            </p>

            {hasLevels && (
              <ProgressionSelector
                levels={exDef.progressionLevels}
                value={set.progression}
                onChange={updateProgression}
                accent={accent}
              />
            )}

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
            {!paused ? (
              <button type="button" onClick={togglePause} className="console-text-action">
                <Pause size={13} /> Pause
              </button>
            ) : (
              <span />
            )}
            {!paused && !isSkill ? (
              <button
                type="button"
                onClick={() => skipSetAt(targetCursor.exerciseIndex, targetCursor.setIndex)}
                className="console-text-action"
              >
                <SkipForward size={13} /> Skip set
              </button>
            ) : (
              <span />
            )}
            <button type="button" onClick={() => setShowCue(true)} className="console-text-action">
              <Info size={13} /> Form cue
            </button>
            <button type="button" onClick={() => setShowNote(true)} className="console-text-action">
              <StickyNote size={13} /> Note
            </button>
          </div>
        </footer>
      </div>

      {sheets}
      {confirmCancelModal}
    </div>
  );
}
