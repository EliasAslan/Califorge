import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Dumbbell, Flame, TrendingUp, ArrowRight, PenLine } from 'lucide-react';
import { getActiveProgram, accentColor } from '@/lib/programData';
import {
  getCurrentCycleSessions, getCycleConsistency, getProgramImprovements, formatDuration,
} from '@/lib/trainingLogic';
import { startNewCycle, loadSettings, saveSettings } from '@/lib/storage';
import { useSessions } from '@/hooks/useTrainingData';
import ExerciseVisual from '@/components/ExerciseVisual';

export default function PhaseComplete() {
  const navigate = useNavigate();
  const { data: sessions = [] } = useSessions();
  const [reflection, setReflection] = useState('');
  const program = getActiveProgram();
  const accent = accentColor();

  // confetti celebration on mount
  useEffect(() => {
    const reduce = loadSettings().reduceMotion;
    if (reduce) return;
    const fire = (x, y) =>
      confetti({ particleCount: 80, spread: 70, origin: { x, y }, colors: [accent, '#ffffff', '#34D399'] });
    fire(0.25, 0.6);
    setTimeout(() => fire(0.75, 0.6), 180);
    setTimeout(() => fire(0.5, 0.5), 360);
  }, [accent]);

  const programSessions = useMemo(
    () => getCurrentCycleSessions(sessions, program.id).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [sessions, program.id]
  );

  const stats = useMemo(() => {
    const workouts = programSessions.length;
    const totalSets = programSessions.reduce(
      (n, s) => n + s.exercises.reduce((m, e) => m + e.sets.filter((x) => x.completed && !x.skipped).length, 0),
      0
    );
    const durationSec = programSessions.reduce((n, s) => n + (s.durationSec || 0), 0);
    const consistency = getCycleConsistency(programSessions, 8, program.id);
    return { workouts, totalSets, durationSec, consistency };
  }, [programSessions, program.id]);

  const improvements = useMemo(
    () => getProgramImprovements(sessions, program.id),
    [sessions, program.id]
  );

  // prefill reflection if previously saved for this phase
  useEffect(() => {
    const reviews = loadSettings().phaseReviews || {};
    setReflection(reviews[program.id] || '');
  }, [program.id]);

  const saveReflection = (text) => {
    const s = loadSettings();
    const reviews = { ...(s.phaseReviews || {}) };
    if (text.trim()) reviews[program.id] = text.trim();
    else delete reviews[program.id];
    saveSettings({ ...s, phaseReviews: reviews });
  };

  const startNextCycle = () => {
    saveReflection(reflection);
    startNewCycle(program.id);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col px-5 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="text-center mt-6">
        <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-4 animate-scale-in bg-muted">
          <Trophy size={36} strokeWidth={2.5} className="text-foreground" />
        </div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">{program.name} Phase</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">Phase Complete</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-[30ch] mx-auto">
          Your training cycle is complete. Here's what you built.
        </p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3 mt-7">
        <Stat icon={Dumbbell} label="Workouts" value={stats.workouts} accent={accent} />
        <Stat icon={Clock} label="Total Time" value={formatDuration(stats.durationSec) || '0s'} accent={accent} />
        <Stat icon={Flame} label="Consistency" value={`${stats.consistency.percent}%`} accent={accent} />
      </div>

      {/* consistency detail */}
      <div className="mt-3 p-3.5 rounded-xl border border-border bg-card/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Phase consistency</span>
          <span className="tnum font-semibold">{stats.consistency.completed}/{stats.consistency.planned} planned workouts</span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden mt-2">
          <div className="h-full rounded-full" style={{ width: `${stats.consistency.percent}%`, background: 'hsl(var(--foreground))' }} />
        </div>
      </div>

      {/* notable improvements */}
      <div className="mt-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Notable Improvements</p>
        {improvements.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 rounded-xl border border-border bg-card/40">
            Not enough data to compare yet. Keep recording your sessions to build a clearer picture.
          </p>
        ) : (
          <div className="space-y-2">
            {improvements.map((imp) => (
              <div key={imp.exerciseId} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
                <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-background/60 shrink-0">
                  <ExerciseVisual visualId={imp.visualId} category={imp.category} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{imp.name}</p>
                  <p className="text-xs text-muted-foreground tnum mt-0.5">
                    {imp.from}{imp.unit} → {imp.to}{imp.unit}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md shrink-0" style={{ background: '#34D3991a', color: '#34D399' }}>
                  <TrendingUp size={12} /> +{imp.delta}{imp.unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* reflection */}
      <div className="mt-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2 inline-flex items-center gap-1.5">
          <PenLine size={12} /> Reflection
        </p>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="What worked, what to change next cycle…"
          rows={3}
          className="w-full p-3 rounded-xl border border-border bg-card/50 text-sm resize-none focus:outline-none focus:border-foreground/30 placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
        <button
          onClick={startNextCycle}
          className="w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
        >
          Start Next Cycle <ArrowRight size={18} />
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="w-full mt-2 h-11 rounded-xl border border-border bg-card/40 text-sm font-medium"
        >
          Switch phase
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
      <p className="text-[10px] uppercase-wide text-muted-foreground font-semibold mt-0.5">{label}</p>
    </div>
  );
}