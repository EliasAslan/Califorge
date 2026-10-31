import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { CATEGORIES, getExercise, getWeeks } from '@/lib/programData';
import { getProgramSessions, getPhaseForWeek } from '@/lib/trainingLogic';
import { loadCurrentWeek } from '@/lib/storage';
import { getActiveProgramId } from '@/lib/programData';
import { useSessions } from '@/hooks/useTrainingData';

const GROUPS = ['push', 'pull', 'legs', 'core'];

export default function MuscleBalanceDetail() {
  const navigate = useNavigate();
  const { data: sessions = [] } = useSessions();
  const programId = getActiveProgramId();
  const currentWeek = loadCurrentWeek(programId);
  const weeks = getWeeks(programId);
  const programSessions = getProgramSessions(sessions, programId);

  const totals = weeks.map((w) => {
    const ws = programSessions.filter((s) => s.week === w.week);
    const byCat = { push: 0, pull: 0, legs: 0, core: 0 };
    const byEx = {};
    ws.forEach((s) => {
      s.exercises.forEach((e) => {
        const cat = e.category || (getExercise(e.exerciseId)?.category);
        const sets = e.sets.filter((x) => x.completed && !x.skipped).length;
        if (!sets) return;
        if (cat && cat in byCat) byCat[cat] += sets;
        const name = e.name || getExercise(e.exerciseId)?.name || e.exerciseId;
        byEx[name] = (byEx[name] || 0) + sets;
      });
    });
    const total = GROUPS.reduce((n, k) => n + byCat[k], 0);
    return { week: w.week, phase: w.phase, isCurrent: w.week === currentWeek, byCat, total, byEx };
  });

  const maxTotal = Math.max(1, ...totals.map((t) => t.total));
  const cycleByCat = GROUPS.reduce((acc, g) => {
    acc[g] = totals.reduce((n, t) => n + t.byCat[g], 0);
    return acc;
  }, {});
  const cycleTotal = GROUPS.reduce((n, g) => n + cycleByCat[g], 0);

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10">
      <button onClick={() => navigate('/progress')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
        <ChevronLeft size={18} /> Progress
      </button>
      <h1 className="text-2xl font-bold tracking-tight">Muscle Volume</h1>
      <p className="text-sm text-muted-foreground">Weekly set volume split by muscle group across the 8-week cycle.</p>

      {/* cycle summary */}
      <div className="rounded-2xl border border-border bg-card/50 p-5 mt-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Cycle totals</p>
        <div className="grid grid-cols-2 gap-3">
          {GROUPS.map((g) => {
            const v = cycleByCat[g];
            const pct = cycleTotal ? Math.round((v / cycleTotal) * 100) : 0;
            return (
              <div key={g} className="p-3 rounded-xl border border-border bg-background/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORIES[g].color }} />
                  <span className="text-sm font-semibold">{CATEGORIES[g].label}</span>
                </div>
                <p className="text-2xl font-bold tnum">{v}</p>
                <p className="text-[11px] text-muted-foreground tnum">{pct}% of volume</p>
                <div className="h-1.5 rounded-full bg-border overflow-hidden mt-2">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CATEGORIES[g].color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* weekly breakdown */}
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mt-6 mb-2">Weekly breakdown</p>
      <div className="space-y-2.5">
        {totals.map((t) => {
          const phase = getPhaseForWeek(t.week, programId);
          return (
            <div key={t.week} className={`rounded-2xl border p-4 ${t.isCurrent ? 'border-foreground/30 bg-card' : 'border-border bg-card/50'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">Week {t.week}</span>
                  {t.isCurrent && <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-muted text-foreground">Now</span>}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{phase.label}</span>
              </div>

              {/* stacked bar */}
              <div className="flex items-end gap-2 mb-3">
                <div className="flex-1 h-7 rounded-lg overflow-hidden flex bg-border/40">
                  {GROUPS.map((g) => {
                    const v = t.byCat[g];
                    if (!v) return null;
                    const w = t.total ? (v / t.total) * 100 : 0;
                    return <div key={g} style={{ width: `${w}%`, background: CATEGORIES[g].color }} />;
                  })}
                  {!t.total && <div className="w-full flex items-center justify-center text-[10px] text-muted-foreground">No sessions yet</div>}
                </div>
                <span className="text-sm font-bold tnum w-8 text-right">{t.total}</span>
              </div>

              {/* category chips */}
              <div className="flex flex-wrap gap-2">
                {GROUPS.map((g) => (
                  <span key={g} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-border bg-background/40">
                    <span className="w-2 h-2 rounded-full" style={{ background: CATEGORIES[g].color }} />
                    <span className="text-muted-foreground">{CATEGORIES[g].label}</span>
                    <span className="font-bold tnum">{t.byCat[g]}</span>
                  </span>
                ))}
              </div>

              {/* exercise breakdown */}
              {t.total > 0 && Object.keys(t.byEx).length > 0 && (
                <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                  {Object.entries(t.byEx)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, sets]) => (
                      <div key={name} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate pr-2">{name}</span>
                        <span className="font-medium tnum shrink-0">{sets} sets</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}