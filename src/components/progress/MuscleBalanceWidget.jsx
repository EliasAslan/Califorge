import React from 'react';
import { ChevronRight } from 'lucide-react';
import { CATEGORIES, getExercise, getWeeks } from '@/lib/programData';
import { getProgramSessions } from '@/lib/trainingLogic';

// Hypertrophy-specific: weekly set volume split by muscle group across the
// 8-week cycle. Replaces the skill tree on the Progress dashboard when the
// active program is hypertrophy.
const GROUPS = ['push', 'pull', 'legs', 'core'];

export default function MuscleBalanceWidget({ sessions, currentWeek, programId, onClick, className }) {
  const weeks = getWeeks(programId);
  const programSessions = programId ? getProgramSessions(sessions, programId) : sessions;
  const totals = weeks.map((w) => {
    const ws = programSessions.filter((s) => s.week === w.week);
    const byCat = { push: 0, pull: 0, legs: 0, core: 0 };
    ws.forEach((s) => {
      s.exercises.forEach((e) => {
        const cat = e.category || (getExercise(e.exerciseId)?.category);
        if (!cat || !(cat in byCat)) return;
        byCat[cat] += e.sets.filter((x) => x.completed && !x.skipped).length;
      });
    });
    const total = GROUPS.reduce((n, k) => n + byCat[k], 0);
    return { week: w.week, isCurrent: w.week === currentWeek, byCat, total };
  });
  const maxTotal = Math.max(1, ...totals.map((t) => t.total));

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`rounded-2xl border border-border bg-card/50 p-5 active:scale-[0.99] transition-transform cursor-pointer flex flex-col ${className || ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Muscle Volume</p>
        <ChevronRight size={18} className="text-muted-foreground" />
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {GROUPS.map((g) => (
          <span key={g} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ background: CATEGORIES[g].color }} />
            {CATEGORIES[g].label}
          </span>
        ))}
      </div>

      <div className="flex-1 flex items-end justify-between gap-1.5 min-h-[110px]">
        {totals.map((t) => (
          <div key={t.week} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <span className="text-[10px] font-bold tnum" style={{ color: t.total ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground) / 0.5)' }}>
              {t.total || ''}
            </span>
            <div className="w-full flex flex-col-reverse rounded-md overflow-hidden" style={{ minHeight: 6 }}>
              {GROUPS.map((g) => {
                const v = t.byCat[g];
                if (!v) return null;
                const h = (v / maxTotal) * 100;
                return (
                  <div key={g} style={{ height: `${h}%`, background: CATEGORIES[g].color, minHeight: v ? 3 : 0 }} />
                );
              })}
              {!t.total && (
                <div className="w-full rounded-md" style={{ height: 6, border: '1.5px dashed hsl(var(--border))' }} />
              )}
            </div>
            <span className="text-[10px] font-semibold tnum" style={{ color: t.isCurrent ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
              {t.week}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}