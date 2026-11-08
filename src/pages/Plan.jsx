import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerFeedback } from '@/lib/workoutFeedback';
import { getSchedule, getActiveProgram, getWorkout, categoryColor } from '@/lib/programData';
import { getPhaseForWeek, getWeekMeta, isDeloadWeek, isTestWeek, buildSession, planWorkoutForTimeBudget } from '@/lib/trainingLogic';
import { loadCurrentWeek, saveCurrentWeek, startNewCycle, loadActiveSession, saveActiveSession, getEnjoyment, loadSettings } from '@/lib/storage';
import { useSessions } from '@/hooks/useTrainingData';
import { Dumbbell, Moon } from 'lucide-react';

const DOW_TO_SCHED = [6, 0, 1, 2, 3, 4, 5];

export default function Plan() {
  const navigate = useNavigate();
  const [week, setWeek] = useState(1);
  const [active, setActive] = useState(null);
  const [availableMinutes, setAvailableMinutes] = useState(30);
  const { data: sessions = [] } = useSessions();
  useEffect(() => {
    setWeek(loadCurrentWeek());
    setActive(loadActiveSession());
  }, []);

  const startWorkout = (workoutId) => {
    if (active) { navigate('/workout'); return; }
    const workout = getWorkout(workoutId);
    const programId = getActiveProgram().id;
    const context = { sessions, enjoyment: getEnjoyment(), equipment: loadSettings().equipment, programId };
    const plan = planWorkoutForTimeBudget(workout, week, availableMinutes, context);
    if (!plan.exercisePlan.length) return;
    const session = buildSession(workoutId, week, plan.mode, {
      ...context,
      exercisePlan: plan.exercisePlan,
      timeBudgetMin: availableMinutes,
    });
    if (!session) return;
    saveActiveSession(session);
    triggerFeedback('workoutStart');
    navigate('/workout');
  };

  const selectWeek = (w) => {
    if (w === 1 && week !== 1) startNewCycle();
    else saveCurrentWeek(w);
    setWeek(w);
  };
  const phase = getPhaseForWeek(week);
  const weekMeta = getWeekMeta(week);
  const todayIdx = DOW_TO_SCHED[new Date().getDay()];

  return (
    <div className="apex-page px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
      <header className="pb-5">
        <p className="apex-overline">YOUR TRAINING</p>
        <h1 className="mt-1 text-[1.8rem] font-bold leading-tight tracking-tight">{getActiveProgram().name}</h1>
        <p className="mt-1 text-xs text-muted-foreground">Your eight-week structure, at a glance.</p>
      </header>

      <section aria-label="Choose training week" className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Training cycle</p>
          <p className="text-[10px] tabular-nums text-muted-foreground">Week {week} of 8</p>
        </div>
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 8 }, (_, i) => i + 1).map((w) => {
            const selected = w === week;
            const wm = getWeekMeta(w);
            const c = phaseColor(wm.phase);
            return (
              <button
                key={w}
                type="button"
                onClick={() => selectWeek(w)}
                aria-pressed={selected}
                aria-label={`Week ${w}: ${wm.phase}`}
                className={`relative flex h-[54px] flex-col items-center justify-center rounded-xl border transition-all ${selected ? 'border-foreground/35 bg-card shadow-sm' : 'border-border/60 bg-card/25 hover:bg-card/60'}`}
                style={selected ? { boxShadow: `inset 0 -2px 0 ${c}` } : {}}
              >
                <span className={`text-[9px] font-semibold uppercase tracking-wide ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>W</span>
                <span className="mt-0.5 text-base font-bold leading-none tabular-nums">{w}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card/45 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Current phase</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">Week {week}</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/45 px-2.5 py-1.5 text-[10px] font-semibold text-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: phaseColor(phase.key) }} />
            {phase.label}
          </span>
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{weekMeta.note}</p>
        {(isDeloadWeek(week) || isTestWeek(week)) && (
          <p className="mt-3 border-t border-border/60 pt-2.5 text-xs font-semibold" style={{ color: phaseColor(phase.key) }}>
            {isDeloadWeek(week) ? 'Lighter week · Reduce sets and focus on recovery.' : 'Test week · Check key skills and strength movements.'}
          </p>
        )}
        <div className="mt-4 flex gap-1" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i < week ? 'bg-foreground/65' : 'bg-muted'}`} />
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border/60 bg-card/25 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="apex-overline">SESSION LENGTH</p>
            <p className="mt-1 text-sm font-semibold">How much time have you got?</p>
          </div>
          <span className="text-sm font-bold tabular-nums">{availableMinutes} min</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[15, 25, 40, 60].map((minutes) => {
            const selected = availableMinutes === minutes;
            return (
              <button
                key={minutes}
                type="button"
                onClick={() => setAvailableMinutes(minutes)}
                aria-pressed={selected}
                className={`h-9 rounded-lg border text-xs font-semibold transition-colors ${selected ? 'border-foreground/35 bg-foreground/10 text-foreground' : 'border-border/70 bg-background/35 text-muted-foreground hover:text-foreground'}`}
              >
                {minutes} min
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">The workout adjusts exercise selection and volume to fit.</p>
      </section>

      <section className="mt-6">
        <div className="mb-2.5 flex items-end justify-between">
          <div>
            <p className="apex-overline">WEEKLY STRUCTURE</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">Your schedule</h2>
          </div>
          <p className="text-[10px] text-muted-foreground">Tap a session to start</p>
        </div>
        <div className="space-y-2">
          {getSchedule().map((d, i) => {
            const isToday = i === todayIdx;
            const workout = d.workoutId ? getWorkout(d.workoutId) : null;
            const accent = categoryColor(workout ? workout.category : 'skill');
            const isActiveWorkout = active && workout && active.workoutId === workout.id;
            const status = isActiveWorkout ? 'Resume' : isToday ? 'Today' : null;
            return workout ? (
              <button
                key={d.day}
                type="button"
                onClick={() => startWorkout(d.workoutId)}
                className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.99] ${isToday ? 'border-foreground/30 bg-card shadow-sm' : 'border-border/60 bg-card/25 hover:border-border hover:bg-card/65'}`}
              >
                <span className={`w-9 shrink-0 text-center text-[10px] font-bold tracking-wide ${isToday ? 'text-foreground' : 'text-muted-foreground'}`}>{d.short}</span>
                <span className="h-8 w-px shrink-0 bg-border/80" />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/65" style={{ color: accent }}>
                  <Dumbbell size={16} strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{workout.name}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{workout.subtitle}</span>
                </span>
                {status && <span className="shrink-0 rounded-md bg-muted/80 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{status}</span>}
              </button>
            ) : (
              <div key={d.day} className={`flex items-center gap-3 rounded-xl border p-3 ${isToday ? 'border-foreground/25 bg-card/80' : 'border-border/45 bg-card/15'}`}>
                <span className={`w-9 shrink-0 text-center text-[10px] font-bold tracking-wide ${isToday ? 'text-foreground' : 'text-muted-foreground'}`}>{d.short}</span>
                <span className="h-8 w-px shrink-0 bg-border/70" />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/35 text-muted-foreground">
                  <Moon size={16} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-muted-foreground">Rest day</span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground/75">Recovery is part of the program</span>
                </span>
                {isToday && <span className="shrink-0 rounded-md bg-muted/80 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Today</span>}
              </div>
            );
          })}
        </div>
      </section>
      <p className="mt-5 border-t border-border/50 pt-3 text-[10px] leading-relaxed text-muted-foreground">This is your structure, not a checklist to catch up on. Follow the next session when you're ready.</p>
    </div>
  );
}

function phaseColor(key) {
  if (key === 'deload') return '#9AA7B8';
  if (key === 'test' || key === 'comparison') return '#FB7BA0';
  return '#9CA3AF';
}