import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, Dumbbell, TrendingUp } from 'lucide-react';
import { categoryColor, MODES } from '@/lib/programData';
import { formatSetResult, getProgressionStatus, formatClock, getPhaseCompletion, maybeAdvanceWeek } from '@/lib/trainingLogic';
import { loadActiveSession, clearActiveSession, loadSettings, saveCurrentWeek } from '@/lib/storage';
import { useSessions, useCreateSession } from '@/hooks/useTrainingData';
import ExerciseVisual from '@/components/ExerciseVisual';

export default function WorkoutSummary() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const { data: sessions = [] } = useSessions();
  const { mutateAsync: createSession } = useCreateSession();

  useEffect(() => {
    const s = loadActiveSession();
    if (!s) { navigate('/'); return; }
    setSession(s);
  }, [navigate]);

  if (!session) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-7 h-7 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;
  }

  const accent = categoryColor(session.workoutCategory);
  const completedExercises = session.exercises.filter((e) => e.sets.some((s) => s.completed && !s.skipped));
  const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0);
  const doneSets = session.exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed && !s.skipped).length, 0);
  const activeMs = session.activeMs != null ? session.activeMs : ((session.finishedAt || Date.now()) - (session.startedAt || Date.now()));

  const handleSave = async () => {
    if (saved) { navigate('/'); return; }
    setSaving(true);
    setErr('');
    const payload = {
      date: new Date().toISOString(),
      workoutId: session.workoutId,
      workoutName: session.workoutName,
      workoutCategory: session.workoutCategory,
      week: session.week,
      dayLabel: session.dayLabel,
      mode: session.mode || 'full',
      timeBudgetMin: session.timeBudgetMin || null,
      note: note || '',
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      durationSec: Math.round(activeMs / 1000),
      exercises: session.exercises,
    };
    try {
      await createSession(payload);
      clearActiveSession();
      setSaved(true);
      // Phase-complete check: enough distinct program workouts logged in week 8.
      const programId = loadSettings().activeProgram || 'skill';
      const synthetic = { ...payload, id: `tmp_${Date.now()}` };
      const allSessions = [...sessions, synthetic];
      if (session.week === 8 && getPhaseCompletion(allSessions, 8, programId)?.complete) {
        saveCurrentWeek(1, programId);
        navigate('/phase-complete');
      } else {
        maybeAdvanceWeek(allSessions, programId);
        navigate('/');
      }
    } catch (e) {
      setErr(e.message || 'Failed to save session');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-5 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="text-center mt-4">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 animate-scale-in bg-muted">
          <Check size={30} strokeWidth={3} className="text-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Workout Complete</h1>
        <p className="text-sm text-muted-foreground mt-1">{session.workoutName} · {session.timeBudgetMin ? `${session.timeBudgetMin} min planned` : (MODES[session.mode]?.label || 'Full')} · Week {session.week}</p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3 mt-7">
        <Stat icon={Dumbbell} label="Exercises" value={completedExercises.length} accent={accent} />
        <Stat icon={Check} label="Sets" value={`${doneSets}/${totalSets}`} accent={accent} />
        <Stat icon={Clock} label="Duration" value={formatClock(activeMs)} accent={accent} />
      </div>

      {/* highlights */}
      <div className="mt-6 flex-1">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Performance</p>
        <div className="space-y-2">
          {session.exercises.map((e) => {
            const results = e.sets.filter((s) => s.completed && !s.skipped);
            if (!results.length) return null;
            const prog = getProgressionStatus(e.exerciseId, [...sessions, { ...session, date: new Date().toISOString() }]);
            return (
              <div key={e.exerciseId} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
                <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-background/60 shrink-0">
                  <ExerciseVisual visualId={e.visualId} category={e.category} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{e.name}</p>
                  <p className="text-xs text-muted-foreground tnum mt-0.5">
                    {results.map((s) => formatSetResult(s, e.type)).join(' · ')}
                  </p>
                </div>
                {prog.status === 'earned' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md shrink-0" style={{ background: '#34D3991a', color: '#34D399' }}>
                    <TrendingUp size={11} /> PR?
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* workout note */}
      <div className="mt-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Notes</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="How did the workout feel? Anything to remember…"
          rows={3}
          className="w-full p-3 rounded-xl border border-border bg-card/50 text-sm resize-none focus:outline-none focus:border-foreground/30 placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        {err && <p className="text-xs text-red-400 text-center mb-2">{err}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
        >
          <Check size={18} strokeWidth={3} /> {saving ? 'Saving…' : saved ? 'Done' : 'Save & Finish'}
        </button>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="p-3.5 rounded-xl border border-border bg-card/50 text-center">
      <Icon size={15} className="mx-auto text-muted-foreground" />
      <p className="text-xl font-bold tnum mt-1.5">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mt-0.5">{label}</p>
    </div>
  );
}