import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { getActiveProgramId } from '@/lib/programData';
import { useSessions } from '@/hooks/useTrainingData';
import { loadCurrentWeek } from '@/lib/storage';
import { getCycleConsistency } from '@/lib/trainingLogic';

export default function HabitsDetail() {
  const navigate = useNavigate();
  const { data: sessions = [] } = useSessions();
  const programId = getActiveProgramId();
  const currentWeek = loadCurrentWeek(programId);
  const c = getCycleConsistency(sessions, currentWeek, programId);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - c.percent / 100);

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10">
      <button onClick={() => navigate('/progress')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
        <ChevronLeft size={18} /> Progress
      </button>
      <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
      <p className="text-sm text-muted-foreground">Consistency across the 8-week cycle.</p>

      <div className="rounded-2xl border border-border bg-card/50 p-5 mt-5 flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
            <circle cx="64" cy="64" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
            <circle cx="64" cy="64" r={r} fill="none" stroke="hsl(var(--foreground))" strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tnum">{c.percent}%</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">consistency</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4 text-center">{c.completed} of {c.planned} planned workouts completed</p>
      </div>

      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mt-6 mb-2">Weekly breakdown</p>
      <div className="space-y-1.5">
        {c.byWeek.map((w) => {
          const pct = w.planned ? Math.round((w.completed / w.planned) * 100) : 0;
          return (
            <div key={w.week} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
              <span className="text-xs font-bold tnum w-8" style={{ color: w.week === currentWeek ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                W{w.week}
              </span>
              <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'hsl(var(--foreground))' }} />
              </div>
              <span className="text-xs text-muted-foreground tnum w-10 text-right">{w.completed}/{w.planned}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}