import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Clock, Dumbbell, Moon, Play, RotateCcw, Settings2, Trash2 } from 'lucide-react';
import { getActiveProgram, getActiveProgramId, getExercise, getWorkout, getProgramWorkouts, categoryColor } from '@/lib/programData';
import { getPhaseForWeek, getWeekMeta, buildSession, buildCustomSession, isSameDay, formatDuration, getProgramSessions, getPlanLedWorkoutRecommendation, getExercisesForTimeBudget, estimateExercisesDuration, getModeForTimeBudget } from '@/lib/trainingLogic';
import { loadCurrentWeek, loadActiveSession, saveActiveSession, clearActiveSession, getEnjoyment, loadSettings } from '@/lib/storage';
import { useCustomWorkouts, useSessions } from '@/hooks/useTrainingData';

const TIME_PRESETS = [15, 25, 40, 60];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Home() {
  const navigate = useNavigate();
  const [week, setWeek] = useState(1);
  const [active, setActive] = useState(null);
  const [availableMinutes, setAvailableMinutes] = useState(30);
  const [workoutOverride, setWorkoutOverride] = useState(null);
  const [customWorkoutOverride, setCustomWorkoutOverride] = useState(null);
  const [showWorkoutOptions, setShowWorkoutOptions] = useState(false);
  const [trainOnRestDay, setTrainOnRestDay] = useState(false);
  const { data: sessions = [] } = useSessions();
  const { data: customWorkouts = [] } = useCustomWorkouts();

  useEffect(() => { setWeek(loadCurrentWeek()); setActive(loadActiveSession()); }, []);

  const now = new Date();
  const programId = getActiveProgramId();
  const program = getActiveProgram();
  const settings = loadSettings();
  const athleteName = settings.athleteName && settings.athleteName !== 'Athlete' ? settings.athleteName.trim().split(/\s+/)[0] : '';
  const timeBudget = Math.max(10, Math.min(120, Number(availableMinutes) || 30));
  const phase = getPhaseForWeek(week, programId);
  const weekMeta = getWeekMeta(week, programId);
  const context = { sessions, enjoyment: getEnjoyment() };
  const recommendation = getPlanLedWorkoutRecommendation(programId, now);
  const programWorkouts = getProgramWorkouts(programId);
  const selectedCustomWorkout = customWorkoutOverride
    ? customWorkouts.find((item) => item.id === customWorkoutOverride) || null
    : null;
  const selectedWorkoutId = workoutOverride && programWorkouts[workoutOverride] ? workoutOverride : recommendation?.workoutId;
  const plannedWorkout = getWorkout(selectedWorkoutId);
  const workout = selectedCustomWorkout ? {
    id: selectedCustomWorkout.id,
    name: selectedCustomWorkout.name,
    subtitle: `${selectedCustomWorkout.exercises.length} exercises · Created by you`,
    category: getExercise(selectedCustomWorkout.exercises[0])?.category || 'push',
    exercises: selectedCustomWorkout.exercises,
    isCustom: true,
  } : plannedWorkout;
  const isRestDay = !!recommendation?.isRestDay && !trainOnRestDay && !workoutOverride && !customWorkoutOverride;
  const category = workout?.category || 'skill';
  const categoryAccent = categoryColor(category);
  const mode = getModeForTimeBudget(timeBudget);
  const exerciseIds = workout?.isCustom
    ? workout.exercises.filter((id) => getExercise(id))
    : workout ? getExercisesForTimeBudget(workout, week, timeBudget, context) : [];
  const duration = estimateExercisesDuration(exerciseIds, week, timeBudget);
  const todaySession = sessions.filter((session) => isSameDay(new Date(session.date), now) && getProgramSessions([session], programId).length > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date)).find((session) => completedCount(session) >= 2);
  const doneToday = !!todaySession && !active;
  const todayLabel = DAY_NAMES[now.getDay()];

  const startWorkout = () => {
    if (active) { navigate('/workout'); return; }
    if (!workout || !exerciseIds.length) return;
    const session = workout.isCustom
      ? buildCustomSession(workout.name, exerciseIds, week, mode)
      : buildSession(workout.id, week, mode, { ...context, exerciseIds, timeBudgetMin: timeBudget });
    if (!session) return;
    saveActiveSession(session);
    navigate('/workout');
  };
  const discardActive = () => {
    if (!window.confirm('Discard the unfinished workout? Its progress will be lost.')) return;
    clearActiveSession(); setActive(null);
  };

  return (
    <div className="apex-page px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6">
      <header className="flex items-center justify-between gap-4 pb-6">
        <div className="min-w-0">
          <p className="apex-overline">APEX <span>/</span> TRAINING</p>
          <h1 className="mt-1 text-[1.7rem] font-bold leading-none tracking-tight">{greeting(now)}{athleteName ? `, ${athleteName}` : ''}</h1>
          <p className="mt-1.5 text-xs text-muted-foreground">{formatDate(now)}</p>
        </div>
        <Link to="/profile" aria-label="Open settings" className="apex-icon-button shrink-0"><Settings2 size={19} /></Link>
      </header>

      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{program.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Week {week} / 8 <span className="mx-1 opacity-40">·</span> {phase.label}</p>
        </div>
        <Link to="/plan" className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground">View plan <ArrowRight size={13} className="ml-1 inline" /></Link>
      </div>

      {active ? (
        <section className="apex-session-state apex-session-active animate-fade-in-up">
          <div className="flex items-start gap-3"><div className="apex-state-icon"><RotateCcw size={20} /></div><div className="min-w-0 flex-1"><p className="apex-overline">SESSION IN PROGRESS</p><h2 className="mt-1 text-xl font-bold">{active.workoutName}</h2><p className="mt-1 text-sm text-muted-foreground">{completedCount(active)} sets logged · {active.paused ? 'Paused' : 'Ready to continue'}</p></div></div>
          <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={discardActive} className="apex-button-secondary text-sm"><Trash2 size={15} /> Discard</button><button type="button" onClick={() => navigate('/workout')} className="apex-button-primary text-sm"><Play size={16} fill="currentColor" /> Resume</button></div>
        </section>
      ) : doneToday ? (
        <section className="apex-session-state apex-session-done animate-fade-in-up">
          <div className="flex items-start gap-3"><div className="apex-state-icon"><Check size={21} /></div><div className="min-w-0 flex-1"><p className="apex-overline">TODAY'S SESSION</p><h2 className="mt-1 text-xl font-bold">Done for today.</h2><p className="mt-1 text-sm text-muted-foreground">{todaySession.workoutName} · {completedCount(todaySession)} sets · {formatDuration(todaySession.durationSec) || '—'}</p></div></div>
          <p className="mt-3 text-sm text-muted-foreground">Your plan stays on track. Pick it up at the next planned session.</p>
          <Link to="/plan" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">View plan <ArrowRight size={14} /></Link>
        </section>
      ) : isRestDay ? (
        <section className="apex-rest-panel animate-fade-in-up">
          <div className="flex items-start gap-3"><div className="apex-rest-icon"><Moon size={22} /></div><div><p className="apex-overline">PLANNED RECOVERY</p><h2 className="mt-1 text-2xl font-bold">Take the space.</h2><p className="mt-1 text-sm text-muted-foreground">Rest is part of the plan. Nothing is waiting to be caught up.</p></div></div>
          <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3"><p className="text-xs text-muted-foreground">Next: {workout?.name || 'Upcoming session'}</p><button type="button" onClick={() => setTrainOnRestDay(true)} className="apex-button-secondary text-xs">Train anyway</button></div>
        </section>
      ) : workout ? (
        <>
          <section className="apex-workout-hero animate-fade-in-up" style={{ '--session-accent': categoryAccent }}>
            <div className="flex items-center justify-between gap-3"><p className="apex-overline">{workoutOverride || customWorkoutOverride ? 'OPTIONAL ALTERNATIVE' : trainOnRestDay ? 'OPTIONAL SESSION' : "TODAY'S PLANNED SESSION"}</p><span className="apex-scheduled-badge"><span /> {workoutOverride || customWorkoutOverride || trainOnRestDay ? 'Optional' : 'On plan'}</span></div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.13em]" style={{ color: 'var(--session-accent)' }}>{workout.category} <span className="mx-1 opacity-40">/</span> {recommendation?.scheduledDay || todayLabel}</p>
            <h2 className="mt-2 text-[2.4rem] font-extrabold leading-[0.98] tracking-[-0.055em]">{workout.name}</h2>
            <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">{workout.subtitle}</p>
            <div className="mt-5 flex items-center gap-5 border-t border-border/70 pt-4">
              <div className="flex items-center gap-2"><Clock size={15} className="text-muted-foreground" /><span className="text-sm font-semibold">~{duration} min</span></div>
              <div className="flex items-center gap-2"><Dumbbell size={15} className="text-muted-foreground" /><span className="text-sm font-semibold">{exerciseIds.length} exercises</span></div>
            </div>
            {(workoutOverride || customWorkoutOverride) && <p className="mt-3 text-xs text-muted-foreground">Your planned program remains unchanged.</p>}
            <button type="button" onClick={() => setShowWorkoutOptions((value) => !value)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">{showWorkoutOptions ? 'Hide alternatives' : 'Choose another workout'} <ChevronDown size={14} className={showWorkoutOptions ? 'rotate-180' : ''} /></button>
            {showWorkoutOptions && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(programWorkouts).filter((item) => item.id !== workout.id).map((item) => (
                    <button key={item.id} type="button" onClick={() => { setWorkoutOverride(item.id); setCustomWorkoutOverride(null); setShowWorkoutOptions(false); }} className="apex-option-card text-left">
                      <span className="block text-sm font-semibold">{item.name}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">{item.subtitle}</span>
                    </button>
                  ))}
                </div>
                {customWorkouts.length > 0 && (
                  <section aria-label="Your custom workouts">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your workouts</p>
                    <div className="grid grid-cols-2 gap-2">
                      {customWorkouts.filter((item) => item.id !== selectedCustomWorkout?.id).map((item) => (
                        <button key={item.id} type="button" onClick={() => { setCustomWorkoutOverride(item.id); setWorkoutOverride(null); setShowWorkoutOptions(false); }} className="apex-option-card text-left">
                          <span className="block text-sm font-semibold">{item.name}</span>
                          <span className="mt-1 block text-[11px] text-muted-foreground">{item.exercises.length} {item.exercises.length === 1 ? 'exercise' : 'exercises'} · Custom</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
            {(workoutOverride || customWorkoutOverride) && <button type="button" onClick={() => { setWorkoutOverride(null); setCustomWorkoutOverride(null); }} className="mt-2 block text-xs text-muted-foreground underline underline-offset-4">Restore planned workout</button>}
          </section>

          <section className="apex-time-panel mt-3">
            <div className="flex items-center justify-between gap-3"><div><p className="apex-overline">TIME AVAILABLE</p><p className="mt-1 text-sm font-semibold">How long have you got?</p></div><label className="apex-time-input"><input aria-label="Available training minutes" type="number" min="10" max="120" value={availableMinutes} onChange={(event) => setAvailableMinutes(event.target.value)} onBlur={() => setAvailableMinutes(String(Math.max(10, Math.min(120, Number(availableMinutes) || 30))))} /><span>min</span></label></div>
            <div className="mt-3 grid grid-cols-4 gap-2">{TIME_PRESETS.map((minutes) => { const selected = Number(availableMinutes) === minutes; return <button key={minutes} type="button" onClick={() => setAvailableMinutes(String(minutes))} className={`apex-time-choice ${selected ? 'is-selected' : ''}`} aria-pressed={selected}>{minutes}<span>m</span></button>; })}</div>
          </section>
          <button onClick={startWorkout} className="apex-button-primary mt-3 h-14 w-full rounded-2xl text-base"><Play size={17} fill="currentColor" /> Start planned session <ArrowRight size={17} /></button>
        </>
      ) : null}

      <footer className="mt-8 flex items-center justify-between border-t border-border/60 pt-4"><Link to="/progress/skills" className="text-xs font-semibold text-muted-foreground hover:text-foreground">Skill progress <ArrowRight size={13} className="ml-1 inline" /></Link><Link to="/history" className="text-xs font-semibold text-muted-foreground hover:text-foreground">Training history <ArrowRight size={13} className="ml-1 inline" /></Link></footer>
    </div>
  );
}

function greeting(date) { const hour = date.getHours(); if (hour < 12) return 'Good morning'; if (hour < 18) return 'Good afternoon'; return 'Good evening'; }
function formatDate(date) { return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }); }
function completedCount(session) { return (session.exercises || []).reduce((count, exercise) => count + (exercise.sets || []).filter((set) => set.completed && !set.skipped).length, 0); }
