import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerFeedback } from '@/lib/workoutFeedback';
import { getSchedule, getActiveProgram, getWorkout, categoryColor } from '@/lib/programData';
import { getPhaseForWeek, getWeekMeta, isDeloadWeek, isTestWeek, buildSession, getExercisesForTimeBudget, getModeForTimeBudget } from '@/lib/trainingLogic';
import { loadCurrentWeek, saveCurrentWeek, startNewCycle, loadActiveSession, saveActiveSession, getEnjoyment } from '@/lib/storage';
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
    const context = { sessions, enjoyment: getEnjoyment() };
    const exerciseIds = getExercisesForTimeBudget(workout, week, availableMinutes, context);
    const session = buildSession(workoutId, week, getModeForTimeBudget(availableMinutes), {
      ...context,
      exerciseIds,
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
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="pt-2 pb-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Program</p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">{getActiveProgram().name}</h1>
      </header>

      {/* week selector */}
      <div className="-mx-5 px-5 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-1">
          {Array.from({ length: 8 }, (_, i) => i + 1).map((w) => {
            const active = w === week;
            const wm = getWeekMeta(w);
            const c = phaseColor(wm.phase);
            return (
              <button
                key={w}
                onClick={() => selectWeek(w)}
                className={`shrink-0 w-14 h-16 rounded-xl border flex flex-col items-center justify-center transition-all ${active ? 'border-foreground/40 bg-card' : 'border-border bg-card/40'}`}
                style={active ? { boxShadow: `inset 0 0 0 1px ${c}55` } : {}}
              >
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Wk</span>
                <span className="text-xl font-bold tnum leading-none mt-0.5">{w}</span>
                <span className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: c }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* phase header */}
      <div className="mt-4 p-3.5 rounded-xl border border-border bg-card/40">
        <p className="text-sm font-semibold mb-2">Time available for a session</p>
        <div className="grid grid-cols-4 gap-2">
          {[15, 25, 40, 60].map((minutes) => {
            const selected = availableMinutes === minutes;
            return (
              <button
                key={minutes}
                type="button"
                onClick={() => setAvailableMinutes(minutes)}
                className={`h-9 rounded-lg border text-xs font-semibold ${selected ? 'border-foreground/40 bg-foreground/10 text-foreground' : 'border-border bg-background/40 text-muted-foreground'}`}
              >
                {minutes} min
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">Starting a session will select exercises and volume to fit this time.</p>
      </div>

      <div className="mt-5 p-4 rounded-2xl border border-border bg-card/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Week {week}</h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-muted text-foreground">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: phaseColor(phase.key) }} />
            {phase.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{weekMeta.note}</p>
        {(isDeloadWeek(week) || isTestWeek(week)) && (
          <p className="text-xs mt-2 font-medium" style={{ color: phaseColor(phase.key) }}>
            {isDeloadWeek(week) ? 'Sets reduced by 1. No new progressions.' : 'Test key skills and strength movements.'}
          </p>
        )}
      </div>

      {/* schedule */}
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mt-6 mb-2">Schedule</p>
      <div className="space-y-1.5">
        {getSchedule().map((d, i) => {
          const isToday = i === todayIdx;
          const w = d.workoutId ? getWorkout(d.workoutId) : null;
          const accent = categoryColor(w ? w.category : 'skill');
          const isActiveWorkout = active && w && active.workoutId === w.id;
          return w ? (
            <button
              key={d.day}
              onClick={() => startWorkout(d.workoutId)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors active:scale-[0.99] ${isToday ? 'border-foreground/30 bg-card' : 'border-border bg-card/40 hover:bg-card'}`}
            >
              <span className={`w-10 text-center text-[11px] font-bold uppercase tracking-wide ${isToday ? 'text-foreground' : 'text-muted-foreground'}`}>
                {d.short}
              </span>
              <span className="w-px h-7 bg-border" />
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-background/60">
                <Dumbbell size={14} style={{ color: accent }} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{w.name}</p>
                <p className="text-xs text-muted-foreground truncate">{w.subtitle}</p>
              </div>
              {isActiveWorkout && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-muted text-foreground">Resume</span>}
              {isToday && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-muted text-foreground">Today</span>}
            </button>
          ) : (
            <div
              key={d.day}
              className={`flex items-center gap-3 p-3 rounded-xl border ${isToday ? 'border-foreground/30 bg-card' : 'border-border bg-card/40'}`}
            >
              <span className={`w-10 text-center text-[11px] font-bold uppercase tracking-wide ${isToday ? 'text-foreground' : 'text-muted-foreground'}`}>
                {d.short}
              </span>
              <span className="w-px h-7 bg-border" />
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-background/40">
                <Moon size={14} className="text-muted-foreground" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-muted-foreground">Rest</p>
                <p className="text-xs text-muted-foreground">Recovery</p>
              </div>
              {isToday && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-muted text-foreground">Today</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function phaseColor(key) {
  if (key === 'deload') return '#9AA7B8';
  if (key === 'test' || key === 'comparison') return '#FB7BA0';
  return '#9CA3AF';
}