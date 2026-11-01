import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Info, Check, SkipForward, ChevronLeft, ChevronRight, Pause, Play, MoreVertical, Flag, Trash2 } from 'lucide-react';
import { categoryColor, getExercise, MODES } from '@/lib/programData';
import { formatTarget, getLastPerformance, formatLastPerformance, formatClock, getRepRecommendation } from '@/lib/trainingLogic';
import { loadActiveSession, saveActiveSession, clearActiveSession, loadWorkoutLayout, saveWorkoutLayout, STALE_MS } from '@/lib/storage';
import { useSessions } from '@/hooks/useTrainingData';
import ExerciseVisual from '@/components/ExerciseVisual';
import VerticalNumberPicker from '@/components/workout/VerticalNumberPicker';
import WorkoutListLayout from '@/components/workout/WorkoutListLayout';
import RestTimer from '@/components/workout/RestTimer';
import ExerciseNote from '@/components/workout/ExerciseNote';
import ProgressionSelector from '@/components/workout/ProgressionSelector';
import VariationSwitcher from '@/components/workout/VariationSwitcher';

const GREEN = '#22C55E';

export default function WorkoutSession() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
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

  const completeSet = () => {
    if (paused) return;
    const missing = [];
    if (['reps', 'weighted', 'reps_hold'].includes(cur.type) && set.actualReps == null) missing.push('reps');
    if (['hold', 'reps_hold'].includes(cur.type) && set.actualSec == null) missing.push('hold duration');
    if (cur.type === 'weighted' && set.weight == null) missing.push('weight');
    if (missing.length && !window.confirm('No value entered for ' + missing.join(', ') + '. Complete this set without logging ' + (missing.length === 1 ? 'it' : 'them') + '?')) return;
    const patch = { completed: true, skipped: false, completedAt: Date.now() };
    advance(patch);
  };

  const skipSet = () => { if (paused) return; advance({ completed: true, skipped: true, completedAt: Date.now() }); };

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
    <div className="flex items-center justify-between py-2">
      <button onClick={exit} aria-label="Exit workout" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center"><X size={17} /></button>
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
          className="w-9 h-9 rounded-lg border border-border flex items-center justify-center"
        >
          <MoreVertical size={17} />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-11 z-50 w-44 rounded-xl border border-border bg-popover shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">
              {showFinish && (
                <button
                  onClick={() => { setShowMenu(false); finishWorkout(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-3 text-sm font-medium text-left hover:bg-card/60 transition-colors"
                >
                  <Flag size={15} className="text-muted-foreground" /> Finish workout
                </button>
              )}
              <button
                onClick={() => { setShowMenu(false); setConfirmCancel(true); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-3 text-sm font-medium text-left text-red-400 hover:bg-card/60 transition-colors border-t border-border"
              >
                <Trash2 size={15} /> Cancel workout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ── REST PHASE ──
  if (session.phase === 'rest') {
    const nextEx = session.pendingNext ? session.exercises[session.pendingNext.exerciseIndex] : null;
    const nextSetIndex = session.pendingNext ? session.pendingNext.setIndex : 0;
    return (
      <div className="min-h-screen flex flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
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
      </div>
    );
  }

  const selectSetInList = (exerciseIndex, setIndex) => {
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
    return <WorkoutListLayout
      session={session}
      doneSets={doneSets}
      totalSets={totalSets}
      progress={progress}
      paused={paused}
      layout={layout}
      setLayout={setLayout}
      onSelectSet={selectSetInList}
      update={update}
      completeSet={completeSet}
      skipSet={skipSet}
      togglePause={togglePause}
      renderTopBar={renderTopBar}
    />;
  }

  // ── WORK PHASE ──
  const exDef = getExercise(cur.exerciseId);
  const lastPerfData = getLastPerformance(cur.exerciseId, sessions);
  const lastPerf = lastPerfData ? formatLastPerformance(lastPerfData.sets, lastPerfData.type) : null;
  const rec = getRepRecommendation(cur.exerciseId, sessions, session.week);
  const isSkill = cur.type === 'skill' || cur.type === 'prehab';
  const hasLevels = !!exDef?.progressionLevels?.length;

  return (
    <div data-workout-layout={layout} className={`min-h-screen flex flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] ${layout === "minimal" ? "text-sm" : ""}`}>
      {renderTopBar()}

      {/* progress */}
      <div className="mt-1 mb-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span className="truncate">{session.workoutName}{session.mode && session.mode !== 'full' ? ` · ${MODES[session.mode]?.label}` : ''}</span>
          <span className="tnum shrink-0 ml-2">{doneSets}/{totalSets} sets · {Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress * 100}%`, background: 'hsl(var(--foreground))' }} />
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-card/40 mb-3" aria-label="Workout layout">
        {['focus', 'minimal', 'list'].map((mode) => (
          <button key={mode} onClick={() => setLayout(mode)} aria-pressed={layout === mode}
            className={`flex-1 h-8 rounded-lg text-xs font-semibold capitalize transition-colors ${layout === mode ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>{mode}</button>
        ))}
      </div>

      {/* exercise header */}
      <div className="flex items-start gap-3.5">
        <div className={`rounded-xl bg-background/60 flex items-center justify-center shrink-0 ${layout === "minimal" ? "w-11 h-11" : "w-16 h-16"}`}>
          <ExerciseVisual visualId={cur.visualId} category={cur.category} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.15em] tnum bg-muted text-muted-foreground">
            Set {session.cursor.setIndex + 1} / {cur.sets.length}
          </span>
          <h2 className="text-[1.35rem] font-extrabold tracking-tight leading-tight mt-1.5">{cur.name}</h2>
          <p className="text-sm text-muted-foreground">{cur.variation}</p>
        </div>
        <button onClick={() => setShowInfo((v) => !v)} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center shrink-0">
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
        <div className="mt-3 p-3.5 rounded-xl border border-border bg-card/50 text-sm space-y-1.5 animate-fade-in">
          {exDef.notes && <p className="text-foreground/90">{exDef.notes}</p>}
          <p className="text-muted-foreground text-xs">Muscles: {exDef.muscles.join(', ')}</p>
          <p className="text-muted-foreground text-xs">Equipment: {exDef.equipment.join(', ')}</p>
          <p className="text-muted-foreground text-xs">Progression: {exDef.progression}</p>
        </div>
      )}

      {/* target + last performance */}
      <div className={`rounded-xl border border-border bg-card/50 ${layout === "minimal" ? "mt-2 p-2.5" : "mt-4 p-3.5"}`}>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Target</p>
        <p className="text-2xl font-bold tnum mt-0.5">{formatTarget(exDef)}</p>
        {lastPerf && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs">
              <span className="text-muted-foreground">Last time:</span>{' '}
              <span className="text-foreground font-medium tnum">{lastPerf}</span>
            </p>
          </div>
        )}
        {rec && (
          <div className="mt-1.5">
            <p className="text-xs">
              <span className="text-muted-foreground">Suggested:</span>{' '}
              <span className="font-medium text-foreground">{rec.text}</span>
            </p>
          </div>
        )}
      </div>

      {/* progression selector (Front Lever / Planche) */}
      {hasLevels && (
        <div className="mt-3">
          <ProgressionSelector
            levels={exDef.progressionLevels}
            value={set.progression}
            onChange={updateProgression}
            accent={accent}
          />
        </div>
      )}

      {/* inputs */}
      <div className="mt-4 flex-1">
        {isSkill ? (
          <div className="p-4 rounded-xl border border-border bg-card/50 text-center">
            <p className="text-sm text-muted-foreground">Practice for <span className="text-foreground font-semibold">{cur.durationMin} min</span></p>
            <p className="text-xs text-muted-foreground mt-1">Log your best hold below if you like.</p>
            <div className="mt-4 max-w-[220px] mx-auto">
              <VerticalNumberPicker label="Best hold" value={set.actualSec ?? 0} onChange={(v) => update({ actualSec: v })} suffix="s" accent={accent} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {cur.type === 'weighted' && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Weight</p>
                <VerticalNumberPicker value={set.weight ?? 0} onChange={(v) => update({ weight: v })} step={2.5} suffix="kg" accent={accent} />
              </div>
            )}
            {(cur.type === 'reps' || cur.type === 'weighted') && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Reps</p>
                <VerticalNumberPicker value={set.actualReps ?? 0} onChange={(v) => update({ actualReps: v })} accent={accent} />
              </div>
            )}
            {cur.type === 'hold' && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Hold (sec)</p>
                <VerticalNumberPicker value={set.actualSec ?? 0} onChange={(v) => update({ actualSec: v })} accent={accent} />
              </div>
            )}
            {cur.type === 'reps_hold' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Reps</p>
                  <VerticalNumberPicker value={set.actualReps ?? 0} onChange={(v) => update({ actualReps: v })} accent={accent} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Hold (s)</p>
                  <VerticalNumberPicker value={set.actualSec ?? 0} onChange={(v) => update({ actualSec: v })} accent={accent} />
                </div>
              </div>
            )}
            {(cur.rpe || cur.rir) && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  {cur.rpe ? 'RPE' : 'RIR'} {cur.rpe || cur.rir}
                </span>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => update(cur.rpe ? { rpe: String(n + 6) } : { rir: String(n) })}
                      className={`px-2.5 h-7 rounded-md text-xs font-medium border ${set[cur.rpe ? 'rpe' : 'rir'] ? 'border-foreground/30 bg-foreground/5' : 'border-border'}`}
                    >
                      {cur.rpe ? n + 6 : n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="mt-4">
          <ExerciseNote value={cur.note || ''} onChange={updateExerciseNote} accent={accent} />
        </div>
      </div>

      {/* actions */}
      <div className="pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
        {paused ? (
          <button
            onClick={togglePause}
            className="w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
          >
            <Play size={18} fill="currentColor" /> Resume
          </button>
        ) : (
          <button
            onClick={completeSet}
            className="w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            style={{ background: GREEN, color: '#06180e' }}
          >
            <Check size={18} strokeWidth={3} />
            {isSkill ? 'Mark Done' : 'Complete Set'}
          </button>
        )}

        {/* back / next navigation */}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={() => moveCursor(-1)}
            disabled={atFirst}
            className="flex-1 h-11 rounded-xl border border-border bg-card/60 text-sm font-medium inline-flex items-center justify-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <span className="text-[11px] text-muted-foreground tnum whitespace-nowrap px-1 text-center">
            Ex {session.cursor.exerciseIndex + 1}/{totalEx} · Set {session.cursor.setIndex + 1}/{cur.sets.length}
          </span>
          <button
            onClick={() => moveCursor(1)}
            disabled={atLast}
            className="flex-1 h-11 rounded-xl border border-border bg-card/60 text-sm font-medium inline-flex items-center justify-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>

        {/* pause */}
        {!paused && (
          <button
            onClick={togglePause}
            className="w-full mt-2.5 h-11 rounded-xl border border-border bg-card/40 text-sm font-medium inline-flex items-center justify-center gap-2"
          >
            <Pause size={15} /> Pause workout
          </button>
        )}

        {/* skip */}
        {!paused && !isSkill && (
          <button onClick={skipSet} className="w-full mt-2 h-10 text-sm text-muted-foreground font-medium inline-flex items-center justify-center gap-1.5">
            <SkipForward size={15} /> Skip set
          </button>
        )}
      </div>

      {/* cancel confirmation */}
      {confirmCancel && (
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
      )}
    </div>
  );
}