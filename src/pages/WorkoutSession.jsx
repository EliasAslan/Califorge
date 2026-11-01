import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Info, Check, SkipForward, ChevronLeft, ChevronRight, Pause, Play, MoreVertical, Flag, Trash2, AlertCircle } from 'lucide-react';
import { categoryColor, getExercise, MODES } from '@/lib/programData';
import { formatTarget, getLastPerformance, formatLastPerformance, formatClock, getRepRecommendation } from '@/lib/trainingLogic';
import { loadActiveSession, saveActiveSession, clearActiveSession, loadWorkoutLayout, saveWorkoutLayout, STALE_MS } from '@/lib/storage';
import { useSessions } from '@/hooks/useTrainingData';
import ExerciseVisual from '@/components/ExerciseVisual';
import SetInputs, { missingFields } from '@/components/workout/SetInputs';
import WorkoutListLayout from '@/components/workout/WorkoutListLayout';
import RestTimer from '@/components/workout/RestTimer';
import ExerciseNote from '@/components/workout/ExerciseNote';
import ProgressionSelector from '@/components/workout/ProgressionSelector';
import VariationSwitcher from '@/components/workout/VariationSwitcher';

const GREEN = '#22C55E';
const LAYOUTS = [
  { id: 'focus', label: 'Focus' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'list', label: 'List' },
];

export default function WorkoutSession() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [missingWarning, setMissingWarning] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [layout, setLayout] = useState(() => loadWorkoutLayout());
  const { data: sessions = [] } = useSessions();

  useEffect(() => {
    const s = loadActiveSession();
    if (!s) { navigate('/'); return; }
    // don't count time the app was closed as active training
    if (s.resumeAt && !s.paused) s.resumeAt = Date.now();
    setSession(s);
    setLoaded(true);
  }, [navigate]);

  useEffect(() => {
    if (session) saveActiveSession(session);
  }, [session]);

  useEffect(() => { saveWorkoutLayout(layout); }, [layout]);

  // live workout timer (active time only; frozen while paused).
  // Auto-pauses if no set has been logged for STALE_MS, capping active time at
  // the last real activity so abandoned/backgrounded sessions can't accumulate.
  useEffect(() => {
    if (!session || session.paused) return;
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

  if (!loaded || !session) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-7 h-7 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;
  }

  const cur = session.exercises[session.cursor.exerciseIndex];
  const set = cur.sets[session.cursor.setIndex];
  const accent = categoryColor(cur.category);
  const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0);
  const doneSets = session.exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0);
  const progress = totalSets ? doneSets / totalSets : 0;
  const elapsed = (session.activeMs || 0) + (session.resumeAt && !session.paused ? now - session.resumeAt : 0);
  const paused = !!session.paused;
  const totalEx = session.exercises.length;

  // flat set list for back/next navigation
  const flat = [];
  session.exercises.forEach((e, ei) => e.sets.forEach((s, si) => flat.push({ ei, si })));
  const curFlatIdx = flat.findIndex((p) => p.ei === session.cursor.exerciseIndex && p.si === session.cursor.setIndex);
  const atFirst = curFlatIdx <= 0;
  const atLast = curFlatIdx >= flat.length - 1;

  const update = (patch) => {
    setMissingWarning(false);
    setSession((prev) => {
      const next = structuredClone(prev);
      const c = next.exercises[next.cursor.exerciseIndex];
      Object.assign(c.sets[next.cursor.setIndex], patch);
      return next;
    });
  };

  const updateExerciseNote = (text) => {
    setSession((prev) => {
      const next = structuredClone(prev);
      next.exercises[next.cursor.exerciseIndex].note = text;
      return next;
    });
  };

  const updateProgression = (lvl) => {
    setSession((prev) => {
      const next = structuredClone(prev);
      const c = next.exercises[next.cursor.exerciseIndex];
      c.sets[next.cursor.setIndex].progression = lvl;
      c.progression = lvl;
      return next;
    });
  };

  const switchExercise = (targetId) => {
    setMissingWarning(false);
    setSession((prev) => {
      const next = structuredClone(prev);
      const c = next.exercises[next.cursor.exerciseIndex];
      const def = getExercise(targetId);
      if (!def) return prev;
      c.originalId = c.originalId || c.exerciseId;
      c.exerciseId = def.id;
      c.name = def.name;
      c.variation = def.variation;
      c.visualId = def.visualId;
      c.category = def.category;
      c.type = def.type;
      c.perSide = !!def.perSide;
      c.durationMin = def.durationMin || null;
      c.restSec = def.restSec || null;
      c.rpe = def.rpe || null;
      c.rir = def.rir || null;
      c.sets.forEach((s) => {
        if (s.completed) return;
        s.targetReps = def.targetReps ? [...def.targetReps] : null;
        s.targetSec = def.targetSec ? [...def.targetSec] : null;
        s.holdSec = def.holdSec ?? null;
        s.actualReps = null;
        s.actualSec = null;
        s.weight = null;
        s.rpe = null;
        s.rir = null;
        s.progression = null;
      });
      c.progression = null;
      return next;
    });
  };

  const moveCursor = (delta) => {
    setMissingWarning(false);
    setSession((prev) => {
      const next = structuredClone(prev);
      const fl = [];
      next.exercises.forEach((e, ei) => e.sets.forEach((s, si) => fl.push({ ei, si })));
      const idx = fl.findIndex((p) => p.ei === next.cursor.exerciseIndex && p.si === next.cursor.setIndex);
      const ni = Math.max(0, Math.min(fl.length - 1, idx + delta));
      next.cursor = { exerciseIndex: fl[ni].ei, setIndex: fl[ni].si };
      next.phase = 'work';
      next.restEndsAt = null;
      next.pendingNext = null;
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

  const advance = (markPatch) => {
    setMissingWarning(false);
    const next = structuredClone(session);
    next.lastActivityAt = Date.now();
    const c = next.exercises[next.cursor.exerciseIndex];
    Object.assign(c.sets[next.cursor.setIndex], markPatch);
    const curProg = c.sets[next.cursor.setIndex].progression || null;

    const nxt = (() => {
      const { exerciseIndex, setIndex } = next.cursor;
      const ex = next.exercises[exerciseIndex];
      if (setIndex + 1 < ex.sets.length) return { exerciseIndex, setIndex: setIndex + 1 };
      if (exerciseIndex + 1 < next.exercises.length) return { exerciseIndex: exerciseIndex + 1, setIndex: 0 };
      return null;
    })();

    if (!nxt) {
      next.finishedAt = Date.now();
      if (next.resumeAt && !next.paused) { next.activeMs = (next.activeMs || 0) + (Date.now() - next.resumeAt); next.resumeAt = null; }
      saveActiveSession(next);
      setSession(next);
      navigate('/summary');
      return;
    }

    // carry the chosen progression forward to the next set of the same exercise
    if (nxt.exerciseIndex === next.cursor.exerciseIndex && curProg) {
      const ns = next.exercises[nxt.exerciseIndex].sets[nxt.setIndex];
      if (!ns.progression) ns.progression = curProg;
    }

    const justFinished = next.exercises[next.cursor.exerciseIndex];
    const useRest = justFinished.restSec && justFinished.type !== 'skill' && justFinished.type !== 'prehab';
    if (useRest) {
      next.phase = 'rest';
      next.restEndsAt = Date.now() + justFinished.restSec * 1000;
      next.pendingNext = nxt;
    } else {
      next.phase = 'work';
      next.cursor = nxt;
      next.restEndsAt = null;
      next.pendingNext = null;
    }
    setSession(next);
  };

  const completeSet = (force = false) => {
    if (paused) return;
    const missing = missingFields(cur.type, set);
    if (missing.length && !force && !missingWarning) {
      setMissingWarning(true);
      return;
    }
    setMissingWarning(false);
    const patch = { completed: true, skipped: false, completedAt: Date.now() };
    advance(patch);
  };

  const skipSet = () => {
    if (paused) return;
    setMissingWarning(false);
    advance({ completed: true, skipped: true, completedAt: Date.now() });
  };

  const finishRest = () => {
    setSession((prev) => {
      const next = structuredClone(prev);
      next.phase = 'work';
      next.cursor = next.pendingNext || next.cursor;
      next.restEndsAt = null;
      next.pendingNext = null;
      return next;
    });
  };

  const adjustRest = (delta) => {
    setSession((prev) => {
      const next = structuredClone(prev);
      next.restEndsAt = Math.max(Date.now(), (next.restEndsAt || Date.now()) + delta * 1000);
      return next;
    });
  };

  const finishWorkout = () => {
    const f = structuredClone(session);
    f.finishedAt = Date.now();
    if (f.resumeAt && !f.paused) { f.activeMs = (f.activeMs || 0) + (Date.now() - f.resumeAt); f.resumeAt = null; }
    saveActiveSession(f);
    setSession(f);
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

  const renderTopBar = (showFinish = true) => (
    <div className="flex items-center justify-between py-1.5">
      <button onClick={exit} aria-label="Exit workout" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
        <X size={17} />
      </button>
      <div className="flex items-center gap-2">
        {paused && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">Paused</span>
        )}
        <span className="text-base font-bold tnum">{formatClock(elapsed)}</span>
      </div>
      <div className="relative">
        <button
          onClick={() => setShowMenu((v) => !v)}
          aria-label="Workout options"
          aria-expanded={showMenu}
          className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <MoreVertical size={17} />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div
              role="menu"
              aria-label="Workout options"
              onKeyDown={(e) => { if (e.key === 'Escape') setShowMenu(false); }}
              className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-border bg-popover shadow-2xl shadow-black/50 overflow-hidden animate-fade-in"
            >
              <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Workout layout</p>
              <div role="group" aria-label="Workout layout">
                {LAYOUTS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={layout === option.id}
                    onClick={() => { setLayout(option.id); setShowMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-left transition-colors ${
                      layout === option.id
                        ? 'bg-card/50 text-foreground'
                        : 'text-muted-foreground hover:bg-card/30 hover:text-foreground'
                    }`}
                  >
                    <span className="flex-1">{option.label}</span>
                    {layout === option.id && <Check size={15} className="text-foreground" />}
                  </button>
                ))}
              </div>
              {showFinish && (
                <button
                  role="menuitem"
                  onClick={() => { setShowMenu(false); finishWorkout(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-left hover:bg-card/60 transition-colors border-t border-border"
                >
                  <Flag size={15} className="text-muted-foreground" /> Finish workout
                </button>
              )}
              <button
                role="menuitem"
                onClick={() => { setShowMenu(false); setConfirmCancel(true); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-left text-red-400 hover:bg-card/60 transition-colors border-t border-border"
              >
                <Trash2 size={15} /> Cancel workout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const confirmCancelModal = confirmCancel && (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-6 animate-fade-in" onClick={() => setConfirmCancel(false)}>
      <div className="w-full max-w-[340px] rounded-2xl border border-border bg-card p-5 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: 'hsl(0 72% 56% / 0.14)' }}>
          <Trash2 size={20} className="text-red-400" />
        </div>
        <h3 className="text-base font-bold">Cancel workout?</h3>
        <p className="text-sm text-muted-foreground mt-1.5">
          Your progress for this session will be discarded. This cannot be undone.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => setConfirmCancel(false)}
            className="h-11 rounded-xl border border-border bg-card/40 text-sm font-semibold"
          >
            Keep workout
          </button>
          <button
            onClick={cancelWorkout}
            className="h-11 rounded-xl text-sm font-semibold"
            style={{ background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
          >
            Cancel workout
          </button>
        </div>
      </div>
    </div>
  );

  // ── REST PHASE ──
  if (session.phase === 'rest') {
    const nextEx = session.pendingNext ? session.exercises[session.pendingNext.exerciseIndex] : null;
    const nextSetIndex = session.pendingNext ? session.pendingNext.setIndex : 0;
    return (
      <div className="min-h-screen flex flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {renderTopBar(false)}
        <div className="flex-1 flex flex-col justify-center">
          <RestTimer restEndsAt={session.restEndsAt} onDone={finishRest} onAdjust={adjustRest} accent={accent} />
          {nextEx && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
              <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-background/60">
                <ExerciseVisual visualId={nextEx.visualId} category={nextEx.category} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Next up · Set {nextSetIndex + 1}/{nextEx.sets.length}</p>
                <p className="text-sm font-semibold truncate">{nextEx.name}</p>
              </div>
            </div>
          )}
        </div>
        {confirmCancelModal}
      </div>
    );
  }

  const selectSetInList = (exerciseIndex, setIndex) => {
    setMissingWarning(false);
    setSession((prev) => {
      const next = structuredClone(prev);
      next.cursor = { exerciseIndex, setIndex };
      next.phase = 'work';
      next.restEndsAt = null;
      next.pendingNext = null;
      return next;
    });
  };

  if (layout === 'list') {
    return (
      <>
        <WorkoutListLayout
          session={session}
          doneSets={doneSets}
          totalSets={totalSets}
          progress={progress}
          paused={paused}
          onSelectSet={selectSetInList}
          update={update}
          completeSet={completeSet}
          skipSet={skipSet}
          togglePause={togglePause}
          renderTopBar={renderTopBar}
          missingWarning={missingWarning}
          onForceComplete={() => completeSet(true)}
          onUpdateProgression={updateProgression}
        />
        {confirmCancelModal}
      </>
    );
  }

  // ── WORK PHASE ──
  const exDef = getExercise(cur.exerciseId);
  const lastPerfData = getLastPerformance(cur.exerciseId, sessions);
  const lastPerf = lastPerfData ? formatLastPerformance(lastPerfData.sets, lastPerfData.type) : null;
  const rec = getRepRecommendation(cur.exerciseId, sessions, session.week);
  const isSkill = cur.type === 'skill' || cur.type === 'prehab';
  const hasLevels = !!exDef?.progressionLevels?.length;
  const missing = missingWarning ? missingFields(cur.type, set) : [];

  // ── MINIMAL LAYOUT ──
  if (layout === 'minimal') {
    return (
      <div data-workout-layout="minimal" className="min-h-screen flex flex-col px-4 sm:px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        {renderTopBar()}

        {/* slim progress bar */}
        <div className="mt-1 mb-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
            <span className="truncate">{session.workoutName}</span>
            <span className="tnum shrink-0">{doneSets}/{totalSets} sets · {Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress * 100}%`, background: 'hsl(var(--foreground))' }} />
          </div>
        </div>

        {/* compact exercise header */}
        <div className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-1.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground tnum">
                Set {session.cursor.setIndex + 1}/{cur.sets.length}
              </span>
              <span className="text-xs text-muted-foreground truncate">{cur.variation || cur.category}</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight truncate mt-0.5">{cur.name}</h2>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 tnum">Ex {session.cursor.exerciseIndex + 1}/{totalEx}</span>
        </div>

        {/* compact target row */}
        <div className="flex items-center justify-between py-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider">Target:</span>
            <span className="font-bold text-foreground text-sm tnum">{formatTarget(exDef)}</span>
          </div>
          {lastPerf && (
            <div className="text-[11px] text-muted-foreground truncate ml-2">
              <span>Last: </span>
              <span className="text-foreground/90 font-medium tnum">{lastPerf}</span>
            </div>
          )}
        </div>

        {/* progression selector if applicable */}
        {hasLevels && (
          <div className="mb-2">
            <ProgressionSelector
              levels={exDef.progressionLevels}
              value={set.progression}
              onChange={updateProgression}
              accent={accent}
            />
          </div>
        )}

        {/* compact set logging */}
        <div className="flex-1 min-h-0 flex flex-col justify-center py-2">
          {isSkill ? (
            <div className="p-2.5 rounded-xl border border-border bg-card/40">
              <p className="text-xs text-muted-foreground mb-2">Practice for <span className="text-foreground font-semibold">{cur.durationMin} min</span>.</p>
              <SetInputs exercise={cur} set={set} update={update} invalid={missing} size="sm" />
            </div>
          ) : (
            <SetInputs exercise={cur} set={set} update={update} invalid={missing} size="sm" />
          )}

          {/* inline validation warning */}
          {missingWarning && (
            <div className="mt-2.5 flex items-center justify-between gap-2 p-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-200 animate-fade-in">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertCircle size={14} className="shrink-0 text-amber-400" />
                <span className="truncate">Enter {missing.join(' & ')} to complete</span>
              </div>
              <button
                type="button"
                onClick={() => completeSet(true)}
                className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-[11px] shrink-0"
              >
                Log anyway
              </button>
            </div>
          )}
        </div>

        {/* actions */}
        <div className="space-y-2 pt-2">
          {paused ? (
            <button
              onClick={togglePause}
              className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
            >
              <Play size={16} fill="currentColor" /> Resume
            </button>
          ) : (
            <button
              onClick={() => completeSet()}
              className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              style={{ background: GREEN, color: '#06180e' }}
            >
              <Check size={16} strokeWidth={2.5} />
              {isSkill ? 'Mark Done' : 'Complete Set'}
            </button>
          )}

          {/* compact navigation / utility bar */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => moveCursor(-1)}
              disabled={atFirst}
              aria-label="Previous set"
              className="h-10 px-3 rounded-lg border border-border bg-card/60 text-xs font-medium inline-flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronLeft size={15} /> Back
            </button>
            <div className="flex-1 flex justify-center gap-1.5">
              {!paused && !isSkill && (
                <button
                  onClick={skipSet}
                  className="h-10 px-3 rounded-lg border border-border bg-card/40 text-xs text-muted-foreground font-medium inline-flex items-center gap-1 hover:text-foreground"
                >
                  <SkipForward size={14} /> Skip
                </button>
              )}
              {!paused && (
                <button
                  onClick={togglePause}
                  className="h-10 px-3 rounded-lg border border-border bg-card/40 text-xs text-muted-foreground font-medium inline-flex items-center gap-1 hover:text-foreground"
                >
                  <Pause size={14} /> Pause
                </button>
              )}
            </div>
            <button
              onClick={() => moveCursor(1)}
              disabled={atLast}
              aria-label="Next set"
              className="h-10 px-3 rounded-lg border border-border bg-card/60 text-xs font-medium inline-flex items-center gap-1 disabled:opacity-40"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {confirmCancelModal}
      </div>
    );
  }

  // ── FOCUS LAYOUT ──
  return (
    <div data-workout-layout="focus" className="min-h-screen flex flex-col px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {renderTopBar()}

      {/* progress */}
      <div className="mt-1 mb-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span className="truncate">{session.workoutName}{session.mode && session.mode !== 'full' ? ` · ${MODES[session.mode]?.label}` : ''}</span>
          <span className="tnum shrink-0 ml-2">{doneSets}/{totalSets} sets · {Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress * 100}%`, background: 'hsl(var(--foreground))' }} />
        </div>
      </div>

      {/* exercise header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-background/60 flex items-center justify-center shrink-0">
          <ExerciseVisual visualId={cur.visualId} category={cur.category} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.15em] tnum bg-muted text-muted-foreground">
            Set {session.cursor.setIndex + 1} / {cur.sets.length}
          </span>
          <h2 className="text-xl font-extrabold tracking-tight leading-tight mt-1 truncate">{cur.name}</h2>
          <p className="text-xs text-muted-foreground truncate">{cur.variation}</p>
        </div>
        <button
          onClick={() => setShowInfo((v) => !v)}
          aria-label="Exercise details"
          aria-expanded={showInfo}
          className="w-9 h-9 rounded-lg border border-border flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Info size={16} />
        </button>
      </div>

      {/* easier / harder variation switch */}
      <VariationSwitcher
        originalId={cur.originalId || cur.exerciseId}
        currentId={cur.exerciseId}
        onSwitch={switchExercise}
      />

      {/* info panel */}
      {showInfo && (
        <div className="mt-2.5 p-3 rounded-xl border border-border bg-card/50 text-xs space-y-1.5 animate-fade-in">
          {exDef.notes && <p className="text-foreground/90">{exDef.notes}</p>}
          <p className="text-muted-foreground">Muscles: {exDef.muscles.join(', ')}</p>
          <p className="text-muted-foreground">Equipment: {exDef.equipment.join(', ')}</p>
          <p className="text-muted-foreground">Progression: {exDef.progression}</p>
        </div>
      )}

      {/* compact target & history card */}
      <div className="mt-3 p-3 rounded-xl border border-border bg-card/50">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Target</p>
            <p className="text-xl font-bold tnum mt-0.5">{formatTarget(exDef)}</p>
          </div>
          {(lastPerf || rec) && (
            <div className="text-right text-xs">
              {lastPerf && (
                <p className="text-muted-foreground">
                  Last: <span className="text-foreground font-medium tnum">{lastPerf}</span>
                </p>
              )}
              {rec && (
                <p className="text-muted-foreground mt-0.5">
                  Suggested: <span className="font-medium text-foreground">{rec.text}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* progression selector (Front Lever / Planche) */}
      {hasLevels && (
        <div className="mt-2.5">
          <ProgressionSelector
            levels={exDef.progressionLevels}
            value={set.progression}
            onChange={updateProgression}
            accent={accent}
          />
        </div>
      )}

      {/* set logging */}
      <div className="mt-3 flex-1 flex flex-col justify-start">
        {isSkill ? (
          <div className="p-3 rounded-xl border border-border bg-card/40">
            <p className="text-xs text-muted-foreground mb-2.5">Practice for <span className="text-foreground font-semibold">{cur.durationMin} min</span>. Log your best hold if you want.</p>
            <SetInputs exercise={cur} set={set} update={update} invalid={missing} size="md" />
          </div>
        ) : (
          <SetInputs exercise={cur} set={set} update={update} invalid={missing} size="md" />
        )}

        {/* inline validation warning */}
        {missingWarning && (
          <div className="mt-2.5 flex items-center justify-between gap-3 p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-200 animate-fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle size={15} className="shrink-0 text-amber-400" />
              <span>No {missing.join(' or ')} entered for this set.</span>
            </div>
            <button
              type="button"
              onClick={() => completeSet(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-xs transition-colors shrink-0"
            >
              Log anyway
            </button>
          </div>
        )}

        <div className="mt-3">
          <ExerciseNote value={cur.note || ''} onChange={updateExerciseNote} accent={accent} />
        </div>
      </div>

      {/* actions */}
      <div className="pt-2 space-y-2">
        {paused ? (
          <button
            onClick={togglePause}
            className="w-full h-12 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
          >
            <Play size={18} fill="currentColor" /> Resume
          </button>
        ) : (
          <button
            onClick={() => completeSet()}
            className="w-full h-12 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            style={{ background: GREEN, color: '#06180e' }}
          >
            <Check size={18} strokeWidth={2.5} />
            {isSkill ? 'Mark Done' : 'Complete Set'}
          </button>
        )}

        {/* compact navigation / secondary utility bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => moveCursor(-1)}
            disabled={atFirst}
            aria-label="Previous set"
            className="h-10 px-3.5 rounded-xl border border-border bg-card/60 text-xs font-medium inline-flex items-center gap-1 disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex-1 flex justify-center gap-2">
            {!paused && !isSkill && (
              <button
                onClick={skipSet}
                className="h-10 px-3 rounded-xl border border-border bg-card/40 text-xs text-muted-foreground font-medium inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <SkipForward size={14} /> Skip
              </button>
            )}
            {!paused && (
              <button
                onClick={togglePause}
                className="h-10 px-3 rounded-xl border border-border bg-card/40 text-xs text-muted-foreground font-medium inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <Pause size={14} /> Pause
              </button>
            )}
          </div>
          <button
            onClick={() => moveCursor(1)}
            disabled={atLast}
            aria-label="Next set"
            className="h-10 px-3.5 rounded-xl border border-border bg-card/60 text-xs font-medium inline-flex items-center gap-1 disabled:opacity-40"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {confirmCancelModal}
    </div>
  );
}
